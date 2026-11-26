package main

// The sentence bank: example sentences from Tatoeba (https://tatoeba.org), licensed
// CC BY 2.0 FR. Building it has two steps:
//
//  1. tatoebaPrepare (here, Go): download the weekly exports into a cache, then keep
//     Japanese sentences owned by a member who rates their Japanese as native (5),
//     whose origin is known (written in Japanese, or translated into it by that
//     native speaker), that have an English translation, and that look like one plain
//     sentence of a useful length. Sentences of unknown origin are dropped: they are
//     mostly the old Tanaka Corpus, where most of the known errors are.
//     Output: candidates.tsv (id, ja, en, owner, origin = orig | tr).
//  2. tools/bank/build.mjs (Node, because the grammar matcher is JavaScript): run each
//     candidate through the tokenizer, matcher and ★ question builder, and write
//     site/data/bank/<level>.json.
//
// `reibun tatoeba build` runs both. The exports change every week, so they aren't
// checksummed; the date of each download is printed.

import (
	"archive/tar"
	"bufio"
	"compress/bzip2"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"
	"unicode/utf8"
)

const tatoebaBase = "https://downloads.tatoeba.org/exports/"

var tatoebaFiles = []string{
	"per_language/jpn/jpn_sentences_detailed.tsv.bz2", // id, lang, text, owner, added, modified
	"per_language/jpn/jpn-eng_links.tsv.bz2",          // jpn id, eng id
	"per_language/eng/eng_sentences.tsv.bz2",          // id, lang, text
	"user_languages.tar.bz2",                          // lang, skill (5 = native), user, details
	"sentences_base.tar.bz2",                          // id, base (0 = original, n = translated from n)
}

const (
	minChars = 12
	maxChars = 48
)

var (
	// One sentence: no sentence end except at the very end.
	innerEnd = regexp.MustCompile(`[。！？!?].`)
	// Latin letters, digits, and characters that make poor drill text.
	oddChars = regexp.MustCompile(`[A-Za-zＡ-Ｚａ-ｚ0-9０-９()（）\[\]「」『』"“”・…～〜:：;；/／#＃@＠&＆%％*＊=＝+＋<>＜＞|｜]`)
)

func tatoebaBuild(cacheDir, outDir string) error {
	candidates := filepath.Join(cacheDir, "candidates.tsv")
	if err := tatoebaPrepare(cacheDir, candidates); err != nil {
		return err
	}
	cmd := exec.Command("node", "tools/bank/build.mjs", candidates, outDir)
	cmd.Stdout, cmd.Stderr = os.Stdout, os.Stderr
	return cmd.Run()
}

func tatoebaPrepare(cacheDir, out string) error {
	if err := os.MkdirAll(cacheDir, 0o755); err != nil {
		return err
	}
	for _, f := range tatoebaFiles {
		if err := download(tatoebaBase+f, filepath.Join(cacheDir, filepath.Base(f))); err != nil {
			return err
		}
	}
	file := func(f string) string { return filepath.Join(cacheDir, filepath.Base(f)) }

	natives := map[string]bool{}
	if err := eachTSV(file(tatoebaFiles[3]), func(r []string) {
		if len(r) >= 3 && r[0] == "jpn" && r[1] == "5" {
			natives[r[2]] = true
		}
	}); err != nil {
		return err
	}

	type sentence struct{ id, ja, owner string }
	var keep []sentence
	ids := map[string]bool{}
	if err := eachTSV(file(tatoebaFiles[0]), func(r []string) {
		if len(r) < 4 || !natives[r[3]] {
			return
		}
		ja := strings.TrimSpace(r[2])
		n := utf8.RuneCountInString(ja)
		if n < minChars || n > maxChars || innerEnd.MatchString(ja) || oddChars.MatchString(ja) || !strings.HasSuffix(ja, "。") {
			return
		}
		keep = append(keep, sentence{r[0], ja, r[3]})
		ids[r[0]] = true
	}); err != nil {
		return err
	}
	fmt.Printf("tatoeba: %d natives, %d sentences by them pass the shape filter\n", len(natives), len(keep))

	// Origin: base 0 = written in Japanese; another id = translated (by this native
	// owner); \N = unknown, dropped.
	origin := map[string]string{}
	if err := eachTSV(file(tatoebaFiles[4]), func(r []string) {
		if len(r) >= 2 && ids[r[0]] && r[1] != `\N` {
			if r[1] == "0" {
				origin[r[0]] = "orig"
			} else {
				origin[r[0]] = "tr"
			}
		}
	}); err != nil {
		return err
	}

	// English translation: the first linked English sentence.
	engOf := map[string]string{}
	need := map[string]bool{}
	if err := eachTSV(file(tatoebaFiles[1]), func(r []string) {
		if len(r) >= 2 && origin[r[0]] != "" {
			if _, ok := engOf[r[0]]; !ok {
				engOf[r[0]] = r[1]
				need[r[1]] = true
			}
		}
	}); err != nil {
		return err
	}
	engText := map[string]string{}
	if err := eachTSV(file(tatoebaFiles[2]), func(r []string) {
		if len(r) >= 3 && need[r[0]] {
			engText[r[0]] = r[2]
		}
	}); err != nil {
		return err
	}

	sort.Slice(keep, func(i, j int) bool {
		return len(keep[i].id) < len(keep[j].id) || (len(keep[i].id) == len(keep[j].id) && keep[i].id < keep[j].id)
	})
	f, err := os.Create(out)
	if err != nil {
		return err
	}
	defer f.Close()
	w := bufio.NewWriter(f)
	n := 0
	for _, s := range keep {
		en := engText[engOf[s.id]]
		if origin[s.id] == "" || en == "" {
			continue
		}
		fmt.Fprintf(w, "%s\t%s\t%s\t%s\t%s\n", s.id, s.ja, strings.ReplaceAll(en, "\t", " "), s.owner, origin[s.id])
		n++
	}
	if err := w.Flush(); err != nil {
		return err
	}
	fmt.Printf("tatoeba: %d sentences of known origin with an English translation → %s\n", n, out)
	return nil
}

// download fetches url to path unless it is already there.
func download(url, path string) error {
	if st, err := os.Stat(path); err == nil && st.Size() > 0 {
		fmt.Printf("tatoeba: using %s (downloaded %s)\n", filepath.Base(path), st.ModTime().Format("2006-01-02"))
		return nil
	}
	client := &http.Client{Timeout: 15 * time.Minute}
	res, err := client.Get(url)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("download %s: %s", url, res.Status)
	}
	tmp := path + ".part"
	f, err := os.Create(tmp)
	if err != nil {
		return err
	}
	n, err := io.Copy(f, res.Body)
	if cerr := f.Close(); err == nil {
		err = cerr
	}
	if err != nil {
		return err
	}
	fmt.Printf("tatoeba: downloaded %s (%.1f MB)\n", filepath.Base(path), float64(n)/1e6)
	return os.Rename(tmp, path)
}

// eachTSV calls fn for every row of a .tsv.bz2, or of the single file in a .tar.bz2.
func eachTSV(path string, fn func([]string)) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()
	var r io.Reader = bzip2.NewReader(bufio.NewReaderSize(f, 1<<20))
	if strings.HasSuffix(path, ".tar.bz2") {
		tr := tar.NewReader(r)
		for {
			h, err := tr.Next()
			if err != nil {
				return fmt.Errorf("%s: no data file in archive: %w", path, err)
			}
			if h.Typeflag == tar.TypeReg {
				r = tr
				break
			}
		}
	}
	sc := bufio.NewScanner(r)
	sc.Buffer(make([]byte, 1<<20), 1<<20)
	for sc.Scan() {
		fn(strings.Split(sc.Text(), "\t"))
	}
	return sc.Err()
}
