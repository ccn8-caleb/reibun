// Reading capture from Japanese IME input.
//
// While you type 構造 with an IME, the composition passes through the kana you typed
// (こうぞう) before conversion. Recording the last all-kana state of each composition
// gives the reading for free: 構(こう) + 造(ぞう), 構える(かまえる), 人々(ひとびと).
//
// Best effort: keyboards that report no kana, or picking a prediction after typing
// only part of the word, give an incomplete reading. As soon as the field's text no
// longer matches what was recorded (deleting, pasting, moving the caret), capture
// stops until the field is cleared, so it never invents a reading.

import { toHiragana } from './util.js';

const KANA = /^[ぁ-ゖゝゞァ-ヺーヽヾ]+$/;
const isKana = (s) => KANA.test(s);

// onReading(hiraganaOrNull): called whenever the captured reading changes
// (null = capture gave up for this entry).
export function trackImeReading(input, onReading) {
  let segments = [];
  let lastKana = '';
  let reliable = true;
  let last;

  const emit = () => {
    const reading = reliable && segments.length ? segments.map((s) => toHiragana(s.kana)).join('') : null;
    if (reading !== last) {
      last = reading;
      onReading(reading);
    }
  };
  const reset = () => {
    segments = [];
    lastKana = '';
    reliable = true;
  };

  let composing = false;
  // Compare the field with what was recorded, but only between compositions: while
  // composing, the field holds uncommitted kana that isn't a segment yet.
  const check = () =>
    setTimeout(() => {
      if (composing) return;
      if (!input.value) reset();
      else if (input.value !== segments.map((s) => s.text).join('')) reliable = false;
      emit();
    }, 0);

  input.addEventListener('compositionstart', () => {
    composing = true;
    lastKana = '';
  });
  input.addEventListener('compositionupdate', (e) => {
    if (e.data && isKana(e.data)) lastKana = e.data;
  });
  input.addEventListener('compositionend', (e) => {
    composing = false;
    const text = e.data || '';
    if (text) {
      const kana = isKana(text) ? text : lastKana;
      if (!kana) reliable = false;
      segments.push({ text, kana });
    }
    check();
  });
  // Browsers order input/compositionend differently; check() runs after both.
  input.addEventListener('input', check);

  return {
    reset() {
      reset();
      last = undefined;
      emit();
    },
  };
}

// Enter moves to the next field (or submits on the last), without firing while an
// IME is still composing (Enter then means "confirm conversion").
export function bindEnterFlow(fields, submit) {
  fields.forEach((el, i) => {
    el.setAttribute('enterkeyhint', i === fields.length - 1 ? 'done' : 'next');
    el.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      if (i === fields.length - 1) submit();
      else fields[i + 1].focus();
    });
  });
}
