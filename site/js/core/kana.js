// Reading-field input: romaji → kana as you type, hiragana/katakana normalisation,
// and double space → "・" between multiple readings.
//
//   attachKanaInput(el, { script: 'hiragana' | 'katakana', multi?: true, keep?: '.-' })
//
// Works with or without a Japanese IME: IME text is normalised after each
// conversion; typing romaji with the IME off converts live (kouzou → こうぞう).
// A trailing fragment that could still become kana ("k", "sh", "n") waits for the
// next key, and is flushed when the field loses focus.

import { toHiragana, toKatakana } from './util.js';

// Longest-match romaji table (hiragana). Covers Hepburn, wāpuro (si, ti, tu, hu…),
// and small kana via x-/l- prefixes.
const TABLE = (() => {
  const t = {};
  const rows = {
    '': 'あいうえお', k: 'かきくけこ', s: 'さしすせそ', t: 'たちつてと', n: 'なにぬねの', h: 'はひふへほ',
    m: 'まみむめも', r: 'らりるれろ', g: 'がぎぐげご', z: 'ざじずぜぞ', d: 'だぢづでど', b: 'ばびぶべぼ', p: 'ぱぴぷぺぽ',
  };
  for (const [c, kana] of Object.entries(rows)) [...'aiueo'].forEach((v, i) => (t[c + v] = kana[i]));
  Object.assign(t, {
    ya: 'や', yu: 'ゆ', yo: 'よ', ye: 'いぇ', wa: 'わ', wo: 'を', wi: 'うぃ', we: 'うぇ', va: 'ゔぁ', vi: 'ゔぃ', vu: 'ゔ', ve: 'ゔぇ', vo: 'ゔぉ',
    shi: 'し', chi: 'ち', tsu: 'つ', fu: 'ふ', ji: 'じ', si: 'し', ti: 'ち', tu: 'つ', hu: 'ふ', zi: 'じ', di: 'ぢ', du: 'づ',
    fa: 'ふぁ', fi: 'ふぃ', fe: 'ふぇ', fo: 'ふぉ', ja: 'じゃ', ju: 'じゅ', je: 'じぇ', jo: 'じょ',
    sha: 'しゃ', shu: 'しゅ', she: 'しぇ', sho: 'しょ', cha: 'ちゃ', chu: 'ちゅ', che: 'ちぇ', cho: 'ちょ',
    tsa: 'つぁ', thi: 'てぃ', dhi: 'でぃ', twu: 'とぅ', dwu: 'どぅ',
    "n'": 'ん', '-': 'ー',
  });
  // Contracted sounds: kya, gya, sya/zya, tya/dya, nya, hya, bya, pya, mya, rya, jya
  const yoon = { k: 'き', g: 'ぎ', s: 'し', z: 'じ', t: 'ち', d: 'ぢ', n: 'に', h: 'ひ', b: 'び', p: 'ぴ', m: 'み', r: 'り', j: 'じ', c: 'ち' };
  for (const [c, base] of Object.entries(yoon)) {
    t[`${c}ya`] = base + 'ゃ';
    t[`${c}yu`] = base + 'ゅ';
    t[`${c}yo`] = base + 'ょ';
  }
  // Small kana: xa/la → ぁ, xtu/ltu → っ, xya → ゃ, xwa → ゎ
  const small = { a: 'ぁ', i: 'ぃ', u: 'ぅ', e: 'ぇ', o: 'ぉ', ya: 'ゃ', yu: 'ゅ', yo: 'ょ', tu: 'っ', tsu: 'っ', wa: 'ゎ' };
  for (const [k, v] of Object.entries(small)) t[`x${k}`] = t[`l${k}`] = v;
  return t;
})();
const MAX_KEY = Math.max(...Object.keys(TABLE).map((k) => k.length));
const KEY_PREFIXES = new Set(Object.keys(TABLE).flatMap((k) => [...k].map((_, i) => k.slice(0, i + 1))));

const isConsonant = (c) => /[bcdfghjklmpqrstvwxyz]/.test(c);

// Converts romaji runs to hiragana. With flush=false a trailing fragment that could
// still complete (e.g. "ky", or "n" before a possible vowel) is left as typed.
export function romajiToHiragana(input, { flush = false, keep = '' } = {}) {
  const s = input.toLowerCase();
  let out = '';
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (!/[a-z'-]/.test(c) || keep.includes(c)) {
      out += input[i];
      i++;
      continue;
    }
    // Doubled consonant → っ (kk, ss, tt, cch…), except "nn".
    if (isConsonant(c) && c !== 'n' && s[i + 1] === c) {
      out += 'っ';
      i++;
      continue;
    }
    if (c === 't' && s[i + 1] === 'c' && s[i + 2] === 'h') {
      out += 'っ'; // tch → っch (matcha)
      i++;
      continue;
    }
    // "nn": before a vowel the second n starts the next syllable (onna → おんな;
    // before y both are ん: honnyaku → ほんやく);
    // at the very end it waits for the next key; otherwise it is ん.
    if (c === 'n' && s[i + 1] === 'n') {
      const after = s[i + 2];
      if (after === undefined && !flush) {
        out += input.slice(i);
        break;
      }
      out += 'ん';
      i += after !== undefined && /[aiueo]/.test(after) ? 1 : 2;
      continue;
    }
    let matched = false;
    for (let len = Math.min(MAX_KEY, s.length - i); len > 0; len--) {
      const key = s.slice(i, i + len);
      if (TABLE[key]) {
        out += TABLE[key];
        i += len;
        matched = true;
        break;
      }
    }
    if (matched) continue;
    if (c === 'n') {
      const next = s[i + 1];
      if (next === undefined) {
        if (flush) out += 'ん';
        else out += input[i];
        i++;
        continue;
      }
      if (!/[aiueoy]/.test(next)) {
        out += 'ん'; // n before a consonant (kanji → かんじ)
        i++;
        continue;
      }
    }
    // Could the rest still become kana if more letters arrive?
    const rest = s.slice(i);
    if (!flush && KEY_PREFIXES.has(rest)) {
      out += input.slice(i);
      break;
    }
    out += input[i]; // not romaji (e.g. stray "q"): leave it
    i++;
  }
  return out;
}

export function formatReading(value, { script = 'hiragana', multi = false, keep = '', flush = false } = {}) {
  let v = value;
  if (multi) v = v.replace(/[ 　]{2,}/g, '・');
  if (/[a-zA-Z'-]/.test(v)) v = romajiToHiragana(v, { flush, keep });
  return script === 'katakana' ? toKatakana(v) : toHiragana(v);
}

export function attachKanaInput(el, opts = {}) {
  let composing = false;
  const apply = (flush = false) => {
    const before = el.value;
    const caret = el.selectionStart ?? before.length;
    const after = formatReading(before, { ...opts, flush });
    if (after === before) return;
    el.value = after;
    const pos = Math.max(0, caret + (after.length - before.length));
    if (document.activeElement === el) el.setSelectionRange(pos, pos);
    // Let other listeners (autosave, "edited by user" tracking) see the new value.
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  el.addEventListener('compositionstart', () => (composing = true));
  el.addEventListener('compositionend', () => {
    composing = false;
    setTimeout(() => apply(false), 0);
  });
  el.addEventListener('input', (e) => {
    if (composing || e.isComposing) return;
    apply(false);
  });
  el.addEventListener('blur', () => apply(true));
  el.setAttribute('autocapitalize', 'off');
  el.setAttribute('autocomplete', 'off');
  el.setAttribute('spellcheck', 'false');
  el.setAttribute('lang', 'ja');
}
