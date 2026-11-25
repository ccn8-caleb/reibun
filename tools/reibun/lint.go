package main

// lint checks site/data/samples.json, the starter sentences shown on first visit:
//
//	[ { "id": "s001", "ja": "…", "en": "…", "level": "N5", "focus": ["te-iru"] } ]
//
// focus lists grammar-pattern ids (site/js/engine/patterns.js) the sentence is meant
// to show; they're checked for shape only, since the catalog lives in JS.

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"regexp"
	"unicode"
)

type sample struct {
	ID    string   `json:"id"`
	JA    string   `json:"ja"`
	EN    string   `json:"en"`
	Level string   `json:"level"`
	Focus []string `json:"focus,omitempty"`
}

var (
	idRe      = regexp.MustCompile(`^s\d{3}$`)
	patternRe = regexp.MustCompile(`^[a-z0-9]+(-[a-z0-9]+)*$`)
	levels    = map[string]bool{"N5": true, "N4": true, "N3": true, "N2": true, "N1": true}
)

func hasJapanese(s string) bool {
	for _, r := range s {
		if unicode.In(r, unicode.Hiragana, unicode.Katakana, unicode.Han) {
			return true
		}
	}
	return false
}

func lintSamples(file string) error {
	raw, err := os.ReadFile(file)
	if err != nil {
		return err
	}
	var list []sample
	dec := json.NewDecoder(bytes.NewReader(raw))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&list); err != nil {
		return fmt.Errorf("%s: %w", file, err)
	}
	errs := 0
	report := func(i int, format string, a ...any) {
		errs++
		fmt.Printf("error: %s[%d]: %s\n", file, i, fmt.Sprintf(format, a...))
	}
	seen := map[string]bool{}
	for i, s := range list {
		switch {
		case !idRe.MatchString(s.ID):
			report(i, "id %q must look like s001", s.ID)
		case seen[s.ID]:
			report(i, "duplicate id %q", s.ID)
		}
		seen[s.ID] = true
		if !hasJapanese(s.JA) {
			report(i, "%s: ja has no Japanese text", s.ID)
		}
		if s.EN == "" {
			report(i, "%s: en is empty", s.ID)
		}
		if !levels[s.Level] {
			report(i, "%s: level %q must be N5…N1", s.ID, s.Level)
		}
		for _, f := range s.Focus {
			if !patternRe.MatchString(f) {
				report(i, "%s: focus %q is not a pattern id", s.ID, f)
			}
		}
	}
	if errs > 0 {
		return fmt.Errorf("%d problem(s) in %s", errs, file)
	}
	fmt.Printf("lint: %d samples OK\n", len(list))
	return nil
}
