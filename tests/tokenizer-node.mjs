// Runs the vendored browser build of kuromoji.js under Node for tests and tools.
// The browser loader fetches dictionary files with XMLHttpRequest; this shim serves
// them from disk so the exact same code path (including our gzip patch) is tested.

import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../site/', import.meta.url));

class FileXHR {
  open(_method, url) {
    this.url = url;
  }
  send() {
    readFile(this.url).then(
      (buf) => {
        this.status = 200;
        this.response = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        this.onload();
      },
      (err) => this.onerror(err)
    );
  }
}

let tokenizerPromise;
export function getTokenizer() {
  if (!tokenizerPromise) {
    globalThis.XMLHttpRequest = FileXHR;
    const kuromoji = createRequire(import.meta.url)('../site/js/vendor/kuromoji.js');
    tokenizerPromise = new Promise((resolve, reject) =>
      kuromoji.builder({ dicPath: root + 'kuromoji/dict/' }).build((err, t) => (err ? reject(err) : resolve(t)))
    );
  }
  return tokenizerPromise;
}
