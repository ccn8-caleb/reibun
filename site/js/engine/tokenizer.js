// Browser tokenizer: kuromoji.js in a Web Worker, started on first use.
//
//   await tokenize('今日は雨です。')   → raw kuromoji tokens
//   onTokenizerState(fn)              → fn('loading' | 'ready' | 'error', detail)
//
// The first load downloads the IPADIC dictionary (about 18 MB, once; the service
// worker keeps it for offline use), so pages show a loading state until 'ready'.

import { BUILD } from '../core/version.js';
import { analyzeText } from './analyze.js';

let worker = null;
let state = 'idle';
let detail = '';
let nextId = 1;
const pending = new Map();
const listeners = new Set();

function setState(next, info = '') {
  state = next;
  detail = info;
  for (const fn of listeners) fn(state, detail);
}

export const tokenizerState = () => state;
export function onTokenizerState(fn) {
  listeners.add(fn);
  fn(state, detail);
  return () => listeners.delete(fn);
}

function start() {
  if (worker) return;
  setState('loading');
  worker = new Worker(new URL(`./tokenizer-worker.js?v=${BUILD}`, import.meta.url));
  worker.onmessage = (e) => {
    const msg = e.data;
    if (msg.type === 'ready') setState('ready');
    else if (msg.type === 'error') failAll(msg.error);
    else if (msg.type === 'result') {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (!p) return;
      if (msg.error) p.reject(new Error(msg.error));
      else p.resolve(msg.tokens);
    }
  };
  worker.onerror = (e) => {
    e.preventDefault?.();
    failAll(e.message || 'tokenizer worker failed');
  };
}

function failAll(message) {
  setState('error', message);
  for (const p of pending.values()) p.reject(new Error(message));
  pending.clear();
  worker?.terminate();
  worker = null; // a later call retries (e.g. after coming back online)
}

export function preloadTokenizer() {
  start();
}

export function tokenize(text) {
  start();
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    worker.postMessage({ id, text });
  });
}

export const analyze = (text) => analyzeText(text, tokenize);
