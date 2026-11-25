package main

// Dictionary support built from JMdict (jmdict-simplified JSON, English edition).
//
//	reibun dict build <jmdict-eng.json> <out-dir>   shards for the web app
//
// Same shard format as Kanji Nexus, so site/js/core/dict.js is shared between the
// two apps.
//
// JMdict is property of the Electronic Dictionary Research and Development Group
// and used under its licence (CC BY-SA 4.0): https://www.edrdg.org/edrdg/licence.html
//
// Shard format (one file per first character, <out-dir>/<hex code point>.json):
//
//	{ "構造": [ { "r": ["こうぞう"], "c": 1, "s": [ { "p": ["n"], "g": "structure; construction; …" } ], "uk": 1 } ] }
//
// r = readings (common first), c = common word, s = up to 3 senses with parts of
// speech and up to 5 glosses, uk = usually written in kana. Kana spellings are only
// indexed for words that have no kanji or are usually written in kana.

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

const (
	maxSenses  = 3
	maxGlosses = 5
)

type jmText struct {
	Common         bool     `json:"common"`
	Text           string   `json:"text"`
	Tags           []string `json:"tags"`
	AppliesToKanji []string `json:"appliesToKanji"`
}

type jmSense struct {
	PartOfSpeech   []string `json:"partOfSpeech"`
	AppliesToKanji []string `json:"appliesToKanji"`
	AppliesToKana  []string `json:"appliesToKana"`
	Misc           []string `json:"misc"`
	Gloss          []struct {
		Text string `json:"text"`
	} `json:"gloss"`
}

type jmWord struct {
	ID    string    `json:"id"`
	Kanji []jmText  `json:"kanji"`
	Kana  []jmText  `json:"kana"`
	Sense []jmSense `json:"sense"`
}

type dictSense struct {
	P []string `json:"p"`
	G string   `json:"g"`
}

type dictEntry struct {
	R  []string    `json:"r"`
	C  int         `json:"c,omitempty"`
	S  []dictSense `json:"s"`
	UK int         `json:"uk,omitempty"`
}

type dictMeta struct {
	Source  string `json:"source"`
	Version string `json:"version"`
	Date    string `json:"dictDate"`
	Words   int    `json:"words"`
	Keys    int    `json:"keys"`
	Shards  int    `json:"shards"`
	License string `json:"license"`
}

func has(list []string, s string) bool {
	for _, x := range list {
		if x == s {
			return true
		}
	}
	return false
}

func applies(list []string, s string) bool { return len(list) == 0 || has(list, "*") || has(list, s) }

// streamJMdict calls fn for every word without loading the whole 100+ MB file.
func streamJMdict(path string, fn func(jmWord)) (version, date string, err error) {
	f, err := os.Open(path)
	if err != nil {
		return "", "", err
	}
	defer f.Close()
	dec := json.NewDecoder(f)
	if _, err := dec.Token(); err != nil { // {
		return "", "", err
	}
	for dec.More() {
		tok, err := dec.Token()
		if err != nil {
			return "", "", err
		}
		switch tok {
		case "version":
			if err := dec.Decode(&version); err != nil {
				return "", "", err
			}
		case "dictDate":
			if err := dec.Decode(&date); err != nil {
				return "", "", err
			}
		case "words":
			if _, err := dec.Token(); err != nil { // [
				return "", "", err
			}
			for dec.More() {
				var w jmWord
				if err := dec.Decode(&w); err != nil {
					return "", "", err
				}
				fn(w)
			}
			if _, err := dec.Token(); err != nil { // ]
				return "", "", err
			}
		default:
			var skip json.RawMessage
			if err := dec.Decode(&skip); err != nil {
				return "", "", err
			}
		}
	}
	if version == "" {
		return "", "", fmt.Errorf("%s: not a jmdict-simplified file", path)
	}
	return version, date, nil
}

// entriesFor turns one JMdict word into (spelling → entry) pairs.
func entriesFor(w jmWord) map[string]dictEntry {
	out := map[string]dictEntry{}
	usuallyKana := false
	for i, s := range w.Sense {
		if i < maxSenses && has(s.Misc, "uk") {
			usuallyKana = true
		}
	}
	build := func(spelling string, isKana bool, common bool) dictEntry {
		e := dictEntry{}
		if common {
			e.C = 1
		}
		if usuallyKana {
			e.UK = 1
		}
		// Readings that apply to this spelling, common ones first.
		var readings []jmText
		for _, k := range w.Kana {
			if has(k.Tags, "sk") || has(k.Tags, "ik") {
				continue
			}
			if isKana || applies(k.AppliesToKanji, spelling) {
				readings = append(readings, k)
			}
		}
		sort.SliceStable(readings, func(i, j int) bool { return readings[i].Common && !readings[j].Common })
		for _, k := range readings {
			e.R = append(e.R, k.Text)
		}
		for _, s := range w.Sense {
			if len(e.S) == maxSenses {
				break
			}
			if isKana && !applies(s.AppliesToKana, spelling) || !isKana && !applies(s.AppliesToKanji, spelling) {
				continue
			}
			var gl []string
			for i, g := range s.Gloss {
				if i == maxGlosses {
					break
				}
				gl = append(gl, g.Text)
			}
			if len(gl) > 0 {
				e.S = append(e.S, dictSense{P: s.PartOfSpeech, G: strings.Join(gl, "; ")})
			}
		}
		return e
	}
	for _, k := range w.Kanji {
		if has(k.Tags, "sK") { // search-only spelling
			continue
		}
		if e := build(k.Text, false, k.Common); len(e.S) > 0 && len(e.R) > 0 {
			out[k.Text] = e
		}
	}
	if len(w.Kanji) == 0 || usuallyKana {
		for _, k := range w.Kana {
			if has(k.Tags, "sk") {
				continue
			}
			if e := build(k.Text, true, k.Common); len(e.S) > 0 {
				e.R = []string{k.Text}
				out[k.Text] = e
			}
		}
	}
	return out
}

// loadIndex builds spelling → entries (common entries first, then JMdict order).
func loadIndex(path string) (map[string][]dictEntry, dictMeta, error) {
	index := map[string][]dictEntry{}
	words := 0
	version, date, err := streamJMdict(path, func(w jmWord) {
		words++
		for spelling, e := range entriesFor(w) {
			index[spelling] = append(index[spelling], e)
		}
	})
	if err != nil {
		return nil, dictMeta{}, err
	}
	for k := range index {
		sort.SliceStable(index[k], func(i, j int) bool { return index[k][i].C > index[k][j].C })
	}
	return index, dictMeta{Source: "JMdict (jmdict-simplified)", Version: version, Date: date, Words: words, Keys: len(index),
		License: "JMdict © EDRDG, CC BY-SA 4.0 — https://www.edrdg.org/edrdg/licence.html"}, nil
}

func shardName(spelling string) string {
	r := []rune(spelling)[0]
	return fmt.Sprintf("%x.json", r)
}

func writeJSON(path string, v any) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	return writeCompact(f, v)
}

func writeCompact(w io.Writer, v any) error {
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	return enc.Encode(v)
}

func dictBuild(src, outDir string) error {
	index, meta, err := loadIndex(src)
	if err != nil {
		return err
	}
	shards := map[string]map[string][]dictEntry{}
	for spelling, entries := range index {
		name := shardName(spelling)
		if shards[name] == nil {
			shards[name] = map[string][]dictEntry{}
		}
		shards[name][spelling] = entries
	}
	if err := os.MkdirAll(outDir, 0o755); err != nil {
		return err
	}
	for name, shard := range shards {
		if err := writeJSON(filepath.Join(outDir, name), shard); err != nil {
			return err
		}
	}
	meta.Shards = len(shards)
	if err := writeJSON(filepath.Join(outDir, "meta.json"), meta); err != nil {
		return err
	}
	fmt.Printf("dict: %d words → %d spellings in %d shards (%s, %s)\n", meta.Words, meta.Keys, meta.Shards, meta.Version, meta.Date)
	return nil
}

// meaningText mirrors meaningText() in site/js/core/dict.js (unused by the CLI
// today; kept so the two stay in step).
func meaningText(e dictEntry) string {
	if len(e.S) == 1 {
		return e.S[0].G
	}
	marks := []string{"①", "②", "③", "④", "⑤"}
	parts := make([]string, len(e.S))
	for i, s := range e.S {
		parts[i] = marks[i] + " " + s.G
	}
	return strings.Join(parts, " ")
}
