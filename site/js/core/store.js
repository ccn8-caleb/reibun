// Sentence library: the user's saved sentences, kept in localStorage and synced
// across tabs. Backup format (also what the Data panel exports):
//
//   { "app": "reibun", "version": 1, "sentences": [ { id, ja, en?, note?, added, updated } ] }

import { STORAGE_KEYS, SCHEMA_VERSION } from './constants.js';

const listeners = new Set();
let sentences = [];

const newId = () => 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const clean = (s) => ({
  id: String(s.id || newId()),
  ja: String(s.ja || '').trim(),
  en: s.en ? String(s.en) : '',
  note: s.note ? String(s.note) : '',
  added: Number(s.added) || Date.now(),
  updated: Number(s.updated) || Number(s.added) || Date.now(),
});

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.LIBRARY) || 'null');
    return Array.isArray(raw?.sentences) ? raw.sentences.map(clean).filter((s) => s.ja) : [];
  } catch (_) {
    return [];
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(exportData()));
  } catch (err) {
    console.warn('[store] could not save', err);
  }
  emit();
}

function emit() {
  for (const fn of listeners) fn(sentences);
}

function exportData() {
  return { app: 'reibun', version: SCHEMA_VERSION, sentences };
}

window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEYS.LIBRARY) {
    sentences = read();
    emit();
  }
});

export const store = {
  async load() {
    sentences = read();
    return 'local';
  },
  get sentences() {
    return sentences;
  },
  onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  find: (ja) => sentences.find((s) => s.ja === String(ja).trim()),
  get: (id) => sentences.find((s) => s.id === id),
  add(entry) {
    const existing = store.find(entry.ja);
    if (existing) return existing;
    const s = clean({ ...entry, id: newId(), added: Date.now() });
    sentences = [s, ...sentences];
    persist();
    return s;
  },
  update(id, patch) {
    sentences = sentences.map((s) => (s.id === id ? clean({ ...s, ...patch, id, updated: Date.now() }) : s));
    persist();
  },
  remove(id) {
    const removed = sentences.find((s) => s.id === id);
    sentences = sentences.filter((s) => s.id !== id);
    persist();
    return removed;
  },
  restore(entry) {
    if (!entry || store.get(entry.id)) return;
    sentences = [entry, ...sentences].sort((a, b) => b.added - a.added);
    persist();
  },
  summary: () => ({ ja: `保存した例文 ${sentences.length} 件`, en: `${sentences.length} saved sentence${sentences.length === 1 ? '' : 's'}` }),
  exportText: () => JSON.stringify(exportData(), null, 2),
  importData(parsed) {
    if (!parsed || parsed.app !== 'reibun' || !Array.isArray(parsed.sentences)) throw new Error('not a Reibun backup');
    sentences = parsed.sentences.map(clean).filter((s) => s.ja);
    persist();
  },
  wipe() {
    sentences = [];
    persist();
  },
};
