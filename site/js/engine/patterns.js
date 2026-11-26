// Grammar-pattern catalog and matcher. The catalog itself lives in grammar/n5.js …
// grammar/n1.js, one file per JLPT level (helpers in grammar/common.js).
//
// Each pattern is a sequence of token tests over IPADIC tokens. A step is an object
// whose keys test token fields; values are a string, a list of strings, or a RegExp:
//
//   { s: surface, b: base form, pos, p1, p2 (pos details), ctype, cform, kind }
//   { text: [strings] }  a run of one or more tokens whose surfaces join to one of
//                        the strings, however the tokenizer split it (T('にもかかわらず'))
//   { gap: n }  skip up to n tokens (あまり〜ない: [あまり, { gap: 4 }, NEG])
//   opt: true   the step may be skipped
//   alt: [[steps], [steps]]  either sequence
//   not: {…}    the token must not also match this; `{ not }` alone is a lookahead
//   { ahead: {…} }  lookahead: the next token must match this (not consumed)
//
// Pattern options: before: {…} — the token just before the match must match this;
// initial: true — only at the start of a sentence or clause (after 、。「 or nothing).
//
// `ex` is an example sentence: shown on the Grammar page and used by the tests
// (every pattern must match its own example).
//
// Patterns marked `generic` (e.g. bare ば) are hidden when a longer pattern
// already covers the same tokens (なければならない). Patterns marked `quiet` (basic
// particles, です／ます…) are found and listed in the catalog, but left out of a
// sentence's pattern chips, where they would crowd out everything else.
//
// There is no official JLPT grammar list (since 2010); levels follow the common
// study lists, which mostly agree.
//
// To add a grammar point: add an entry with an example to the level's file and run
// `node --test tests/*.test.mjs`.

import N5 from './grammar/n5.js';
import N4 from './grammar/n4.js';
import N3 from './grammar/n3.js';
import N2 from './grammar/n2.js';
import N1 from './grammar/n1.js';
import CONNECTIVES from './grammar/connectives.js';
import { LOGIC, LOGIC_OF_PATTERN } from './grammar/logic.js';

export const PATTERNS = [...N5, ...N4, ...N3, ...N2, ...N1, ...CONNECTIVES];
export { LOGIC };
export const LOGIC_BY_ID = new Map(LOGIC.map((l) => [l.id, l]));

export const GROUPS = [
  { id: 'basics', ja: '基本の形', en: 'Basic forms' },
  { id: 'particles', ja: '助詞', en: 'Particles' },
  { id: 'aspect', ja: 'て形・アスペクト', en: 'te-form & aspect' },
  { id: 'giving', ja: '授受', en: 'Giving & receiving' },
  { id: 'intent', ja: '希望・意志・目的', en: 'Wanting, intending, purpose' },
  { id: 'modality', ja: '可能・義務・許可', en: 'Ability, obligation, permission' },
  { id: 'condition', ja: '条件', en: 'Conditions' },
  { id: 'time', ja: '時', en: 'Time' },
  { id: 'reason', ja: '理由・原因', en: 'Reasons & causes' },
  { id: 'contrast', ja: '逆接・対比', en: 'Contrast & concession' },
  { id: 'evidential', ja: '様態・伝聞・推量', en: 'Appearance, hearsay, probability' },
  { id: 'degree', ja: '程度・複合動詞', en: 'Ease, degree, compound verbs' },
  { id: 'limits', ja: '比較・限定・範囲', en: 'Comparison, limits, scope' },
  { id: 'emphasis', ja: '強調・例示', en: 'Emphasis & examples' },
  { id: 'attitude', ja: '評価・感情', en: 'Judgement & feeling' },
  { id: 'quote', ja: '引用・話題', en: 'Quoting & topics' },
  { id: 'phrases', ja: '複合助詞', en: 'Compound particles' },
  { id: 'formal', ja: '書き言葉・改まった表現', en: 'Formal & written' },
  { id: 'voice', ja: '使役・受身', en: 'Causative & passive' },
  { id: 'keigo', ja: '敬語', en: 'Keigo (honorific speech)' },
  { id: 'connectives', ja: '接続表現（JLPT外）', en: 'Connectives (beyond the JLPT lists)' },
];

export const PATTERN_BY_ID = new Map(PATTERNS.map((p) => [p.id, p]));
const hasGap = (steps) => steps.some((st) => 'gap' in st || (st.alt && st.alt.some(hasGap)));
const HAS_GAP = new Set(PATTERNS.filter((p) => hasGap(p.steps)).map((p) => p.id));
export const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1', 'extra'];
// Display names for levels that aren't JLPT levels.
export const LEVEL_NAMES = { extra: { ja: 'JLPT外', en: 'Other' } };

// Tag JLPT patterns with their logic function (connectives carry theirs already).
for (const [logic, ids] of Object.entries(LOGIC_OF_PATTERN)) {
  for (const id of ids) {
    const p = PATTERN_BY_ID.get(id);
    if (p) p.logic = logic;
  }
}

function test(value, want) {
  if (want instanceof RegExp) return want.test(value);
  if (Array.isArray(want)) return want.includes(value);
  return value === want;
}

const FIELDS = { s: 'surface', b: 'base', pos: 'pos', p1: 'pos1', p2: 'pos2', ctype: 'ctype', cform: 'cform', kind: 'kind' };

function tokenMatches(tok, step) {
  if (!tok) return false;
  for (const [key, field] of Object.entries(FIELDS)) {
    if (key in step && !test(tok[field], step[key])) return false;
  }
  if (step.not && tokenMatches(tok, step.not)) return false;
  return true;
}

const GAP_STOP = /^[。！？!?」』]$/;
const CLAUSE_START = /^[、。，,！？!?「『（(]$/;

// End indices of the token runs starting at i that spell one of `texts`.
function textEnds(tokens, i, texts) {
  const ends = [];
  for (const want of texts) {
    let got = '';
    let j = i;
    while (j < tokens.length && got.length < want.length) {
      got += tokens[j].surface;
      j++;
      if (!want.startsWith(got)) break;
    }
    if (got === want && j > i) ends.push(j);
  }
  return ends;
}

// Returns the end index (exclusive) of a match starting at i, or -1.
function matchSteps(tokens, i, steps) {
  if (!steps.length) return i;
  const [step, ...rest] = steps;
  if (step.alt) {
    for (const seq of step.alt) {
      const end = matchSteps(tokens, i, [...seq, ...rest]);
      if (end >= 0) return end;
    }
    return -1;
  }
  // Lookahead-only steps test the next token without consuming it: `{ not }` must
  // not match it, `{ ahead }` must.
  if (Object.keys(step).length === 1 && step.not) {
    return tokenMatches(tokens[i], step.not) ? -1 : matchSteps(tokens, i, rest);
  }
  if (step.ahead) return tokenMatches(tokens[i], step.ahead) ? matchSteps(tokens, i, rest) : -1;
  // A gap: skip up to `gap` tokens (shortest first), but never past a sentence end.
  if ('gap' in step) {
    for (let k = 0; k <= step.gap && i + k <= tokens.length; k++) {
      if (k > 0 && GAP_STOP.test(tokens[i + k - 1].surface)) break;
      const end = matchSteps(tokens, i + k, rest);
      if (end >= 0) return end;
    }
    return -1;
  }
  if (step.text) {
    for (const j of textEnds(tokens, i, step.text)) {
      const end = matchSteps(tokens, j, rest);
      if (end >= 0) return end;
    }
  } else if (tokenMatches(tokens[i], step)) {
    const end = matchSteps(tokens, i + 1, rest);
    if (end >= 0) return end;
  }
  return step.opt ? matchSteps(tokens, i, rest) : -1;
}

// All pattern matches in a token list: [{ id, start, end }] (token indices).
export function findPatterns(tokens) {
  const found = [];
  for (const p of PATTERNS) {
    for (let i = 0; i < tokens.length; i++) {
      if (p.before && !tokenMatches(tokens[i - 1], p.before)) continue;
      if (p.initial && i > 0 && !CLAUSE_START.test(tokens[i - 1].surface)) continue;
      const end = matchSteps(tokens, i, p.steps);
      if (end > i) {
        found.push({ id: p.id, start: i, end });
        i = end - 1;
      }
    }
  }
  // Hide generic matches covered by a longer, more specific one. Patterns with a gap
  // don't hide anything: the words in the gap aren't part of them (あまり食べたくない
  // still shows 〜たい). Nor do quiet ones (〜て形 must not hide 受身 in ほめられて).
  const kept = found.filter((m) => {
    if (!PATTERN_BY_ID.get(m.id).generic) return true;
    return !found.some((o) => o !== m && !HAS_GAP.has(o.id) && !PATTERN_BY_ID.get(o.id).quiet && o.start <= m.start && o.end >= m.end && o.end - o.start > m.end - m.start);
  });
  return kept.sort((a, b) => a.start - b.start || b.end - a.end);
}

// Matches worth listing for a sentence (quiet ones left out).
export const visiblePatterns = (matches) => matches.filter((m) => !PATTERN_BY_ID.get(m.id).quiet);
