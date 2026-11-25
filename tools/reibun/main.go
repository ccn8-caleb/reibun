// reibun: maintenance tool for the Reibun static site.
//
//	reibun lint [file]                        check the sample sentences (exit 1 on errors)
//	reibun kuromoji fetch [out-dir]           download the tokenizer dictionary (checksummed)
//	reibun dict build <jmdict.json> <out-dir> dictionary shards for the app (CI)
//
// file defaults to site/data/samples.json; out-dir to site/kuromoji/dict.
package main

import (
	"fmt"
	"os"
)

const (
	defaultSamples  = "site/data/samples.json"
	defaultKuromoji = "site/kuromoji/dict"
)

func usage() {
	fmt.Fprintln(os.Stderr, `usage:
  reibun lint [samples.json]
  reibun kuromoji fetch [out-dir]
  reibun dict build <jmdict-eng.json> <out-dir>`)
	os.Exit(2)
}

func arg(args []string, i int, fallback string) string {
	if len(args) > i {
		return args[i]
	}
	return fallback
}

func die(err error) {
	fmt.Fprintln(os.Stderr, "error:", err)
	os.Exit(1)
}

func main() {
	if len(os.Args) < 2 {
		usage()
	}
	cmd, args := os.Args[1], os.Args[2:]
	switch {
	case cmd == "lint":
		if err := lintSamples(arg(args, 0, defaultSamples)); err != nil {
			die(err)
		}
	case cmd == "kuromoji" && len(args) >= 1 && args[0] == "fetch":
		if err := kuromojiFetch(arg(args, 1, defaultKuromoji)); err != nil {
			die(err)
		}
	case cmd == "dict" && len(args) == 3 && args[0] == "build":
		if err := dictBuild(args[1], args[2]); err != nil {
			die(err)
		}
	default:
		usage()
	}
}
