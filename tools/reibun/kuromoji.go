package main

// The tokenizer dictionary: IPADIC compiled for kuromoji.js (about 18 MB of .dat.gz
// files). It is not committed; CI and local development download the pinned npm
// release, check its SHA-256 and extract only dict/*.dat.gz.
//
// kuromoji.js is Apache-2.0; IPADIC's licence is in site/js/vendor/kuromoji-NOTICE.md.

import (
	"archive/tar"
	"compress/gzip"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"
)

const (
	kuromojiURL    = "https://registry.npmjs.org/kuromoji/-/kuromoji-0.1.2.tgz"
	kuromojiSHA256 = "ccf8778839df92ae3a3d64a93998ac92d1e92c7f73fe6193295a5258c98308b4"
)

func kuromojiFetch(outDir string) error {
	client := &http.Client{Timeout: 5 * time.Minute}
	res, err := client.Get(kuromojiURL)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("download %s: %s", kuromojiURL, res.Status)
	}
	body, err := io.ReadAll(res.Body)
	if err != nil {
		return err
	}
	sum := sha256.Sum256(body)
	if got := hex.EncodeToString(sum[:]); got != kuromojiSHA256 {
		return fmt.Errorf("checksum mismatch for %s: got %s", kuromojiURL, got)
	}

	gz, err := gzip.NewReader(strings.NewReader(string(body)))
	if err != nil {
		return err
	}
	if err := os.MkdirAll(outDir, 0o755); err != nil {
		return err
	}
	tr := tar.NewReader(gz)
	count, total := 0, int64(0)
	for {
		h, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}
		// package/dict/<name>.dat.gz only; the name is checked so nothing escapes outDir.
		dir, name := path.Split(h.Name)
		if h.Typeflag != tar.TypeReg || dir != "package/dict/" || !strings.HasSuffix(name, ".dat.gz") || strings.ContainsAny(name, `/\`) {
			continue
		}
		f, err := os.Create(filepath.Join(outDir, name))
		if err != nil {
			return err
		}
		n, err := io.Copy(f, tr)
		f.Close()
		if err != nil {
			return err
		}
		count++
		total += n
	}
	if count == 0 {
		return fmt.Errorf("no dictionary files found in %s", kuromojiURL)
	}
	fmt.Printf("kuromoji: %d files, %.1f MB → %s\n", count, float64(total)/1e6, outDir)
	return nil
}
