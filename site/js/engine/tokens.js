// Token normalisation: kuromoji (IPADIC) tokens → the shape every Reibun tool uses.
//
//   { i, surface, base, reading, pos, pos1, pos2, pos3, ctype, cform, start, end, kind }
//
// reading is hiragana; kind is a coarse word class (see KINDS) used for colouring and
// for the chunking rules in bunsetsu.js. Pure functions, no DOM: tested under Node.

const katakanaToHiragana = (s) => String(s || '').replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const star = (v) => (v === '*' || v == null ? '' : v);

// Coarse word classes. `group` picks the colour (css: --pos-<group>).
export const KINDS = {
  noun: { group: 'noun', ja: '名詞', en: 'Noun' },
  pronoun: { group: 'noun', ja: '代名詞', en: 'Pronoun' },
  proper: { group: 'noun', ja: '固有名詞', en: 'Proper noun' },
  number: { group: 'noun', ja: '数', en: 'Number' },
  nominalizer: { group: 'noun', ja: '形式名詞', en: 'Nominalizer' },
  suffix: { group: 'noun', ja: '接尾辞', en: 'Suffix' },
  verb: { group: 'verb', ja: '動詞', en: 'Verb' },
  'aux-verb': { group: 'aux', ja: '補助動詞', en: 'Helper verb' },
  'verb-suffix': { group: 'aux', ja: '動詞接尾辞', en: 'Verb suffix' },
  'i-adj': { group: 'adj', ja: 'い形容詞', en: 'i-adjective' },
  'na-adj': { group: 'adj', ja: 'な形容詞', en: 'na-adjective' },
  'aux-adj': { group: 'aux', ja: '補助形容詞', en: 'Helper adjective' },
  adverb: { group: 'adverb', ja: '副詞', en: 'Adverb' },
  adnominal: { group: 'adverb', ja: '連体詞', en: 'Pre-noun adjectival' },
  conjunction: { group: 'other', ja: '接続詞', en: 'Conjunction' },
  particle: { group: 'particle', ja: '助詞', en: 'Particle' },
  auxiliary: { group: 'aux', ja: '助動詞', en: 'Auxiliary' },
  prefix: { group: 'other', ja: '接頭辞', en: 'Prefix' },
  interjection: { group: 'other', ja: '感動詞', en: 'Interjection' },
  symbol: { group: 'symbol', ja: '記号', en: 'Symbol' },
  other: { group: 'other', ja: 'その他', en: 'Other' },
};

// Legend order for the colour key.
export const POS_GROUPS = [
  { id: 'noun', ja: '名詞', en: 'Noun' },
  { id: 'verb', ja: '動詞', en: 'Verb' },
  { id: 'adj', ja: '形容詞', en: 'Adjective' },
  { id: 'adverb', ja: '副詞・連体詞', en: 'Adverb' },
  { id: 'particle', ja: '助詞', en: 'Particle' },
  { id: 'aux', ja: '助動詞・補助', en: 'Auxiliary' },
  { id: 'other', ja: 'その他', en: 'Other' },
];

function kindOf(pos, pos1) {
  switch (pos) {
    case '名詞':
      if (pos1 === '代名詞') return 'pronoun';
      if (pos1 === '形容動詞語幹') return 'na-adj';
      if (pos1 === '数') return 'number';
      if (pos1 === '固有名詞') return 'proper';
      if (pos1 === '接尾') return 'suffix';
      if (pos1 === '非自立') return 'nominalizer';
      if (pos1 === '特殊') return 'auxiliary'; // そう (hearsay)
      return 'noun';
    case '動詞':
      if (pos1 === '非自立') return 'aux-verb';
      if (pos1 === '接尾') return 'verb-suffix';
      return 'verb';
    case '形容詞':
      return pos1 === '自立' ? 'i-adj' : 'aux-adj';
    case '副詞':
      return 'adverb';
    case '連体詞':
      return 'adnominal';
    case '接続詞':
      return 'conjunction';
    case '助詞':
      return 'particle';
    case '助動詞':
      return 'auxiliary';
    case '接頭詞':
      return 'prefix';
    case '感動詞':
      return 'interjection';
    case '記号':
      return 'symbol';
    default:
      return 'other';
  }
}

export function normalize(raw) {
  return raw.map((k, i) => {
    const surface = k.surface_form;
    const pos = star(k.pos);
    const pos1 = star(k.pos_detail_1);
    const start = (k.word_position || 1) - 1;
    return {
      i,
      surface,
      base: star(k.basic_form) || surface,
      reading: katakanaToHiragana(star(k.reading)) || katakanaToHiragana(surface),
      pos,
      pos1,
      pos2: star(k.pos_detail_2),
      pos3: star(k.pos_detail_3),
      ctype: star(k.conjugated_type),
      cform: star(k.conjugated_form),
      start,
      end: start + surface.length,
      kind: kindOf(pos, pos1),
      known: k.word_type !== 'UNKNOWN',
    };
  });
}

// --- Furigana -------------------------------------------------------------------

const HAN = /[\p{Script=Han}々〆ヶ]/u;
export const hasKanji = (s) => HAN.test(s);

// Split a word into ruby parts: 食べさせ / たべさせ → [{text:'食', rt:'た'}, {text:'べさせ'}].
// Kana in the surface anchors the alignment; if it can't be aligned, the whole word
// gets the reading.
export function rubyParts(surface, reading) {
  if (!hasKanji(surface) || !reading) return [{ text: surface }];
  const runs = [];
  for (const ch of surface) {
    const isHan = HAN.test(ch);
    const last = runs[runs.length - 1];
    if (last && last.han === isHan) last.text += ch;
    else runs.push({ text: ch, han: isHan });
  }
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('^' + runs.map((r) => (r.han ? '(.+?)' : `(${esc(katakanaToHiragana(r.text))})`)).join('') + '$');
  const m = katakanaToHiragana(reading).match(re);
  if (!m) return [{ text: surface, rt: reading }];
  return runs.map((r, k) => (r.han ? { text: r.text, rt: m[k + 1] } : { text: r.text }));
}

// --- Sentences --------------------------------------------------------------------

// Split text into sentences, keeping the closing punctuation (and closing brackets)
// with the sentence. Offsets are into the original text.
export function splitSentences(text) {
  const out = [];
  const re = /[^。！？!?\n]+(?:[。！？!?]+[」』）)]*)?|[。！？!?]+/g;
  let m;
  while ((m = re.exec(text))) {
    const s = m[0];
    const lead = s.length - s.trimStart().length;
    const body = s.trim();
    if (body) out.push({ text: body, offset: m.index + lead });
  }
  return out;
}
