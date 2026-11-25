// Tokenizer worker (classic script): builds kuromoji once and tokenizes on request.
// Loaded by tokenizer.js as tokenizer-worker.js?v=<build>; the same ?v= goes on the
// kuromoji script so a deploy never mixes versions. The dictionary files themselves
// never change and are cached by the service worker (cache-first).

importScripts('../vendor/kuromoji.js' + self.location.search);

const ready = new Promise((resolve, reject) => {
  kuromoji
    // A path, not a full URL: kuromoji path.join()s it, which mangles "http://".
    .builder({ dicPath: new URL('../../kuromoji/dict/', self.location.href).pathname })
    .build((err, tokenizer) => (err ? reject(err) : resolve(tokenizer)));
});

ready.then(
  () => self.postMessage({ type: 'ready' }),
  (err) => self.postMessage({ type: 'error', error: String(err?.message || err || 'dictionary failed to load') })
);

self.onmessage = async (e) => {
  const { id, text } = e.data;
  try {
    const tokenizer = await ready;
    self.postMessage({ type: 'result', id, tokens: tokenizer.tokenize(text) });
  } catch (err) {
    self.postMessage({ type: 'result', id, error: String(err?.message || err) });
  }
};
