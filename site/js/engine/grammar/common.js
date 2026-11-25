// Building blocks for the grammar catalog (n5.js … n1.js). See patterns.js for the
// step syntax.

export const TE = { s: ['て', 'で'], p1: '接続助詞' };
export const NEG = { alt: [[{ ctype: ['特殊・ナイ', '特殊・ヌ'], pos: '助動詞' }], [{ b: 'ない', pos: '形容詞' }]] };
export const NEG_ANY = [{ alt: [...NEG.alt, [{ b: 'ん', ctype: '不変化型' }], [{ ctype: '特殊・マス', cform: '未然形' }, { b: 'ん', ctype: '不変化型' }]] }];
export const PAST = { pos: '助動詞', ctype: '特殊・タ' };
export const VERB = { pos: '動詞', p1: '自立' };
export const DICT = { pos: ['動詞', '形容詞', '助動詞'], cform: '基本形' };
export const STEM = { pos: '動詞', cform: '連用形' };
export const MIZEN = { pos: ['動詞', '助動詞'], cform: /^未然/ };
export const COPULA = { b: ['だ', 'です'], pos: '助動詞' };
export const GOOD = { b: ['いい', 'よい', '良い'], pos: '形容詞' };
export const PRT = (s) => ({ s, pos: '助詞' });

// A run of tokens whose surfaces spell one of the given strings (any tokenization).
export const T = (...text) => ({ text });
// Skip up to n tokens.
export const GAP = (n = 4) => ({ gap: n });

// P(id, level, label, en, ja, steps, { group, ex, generic?, quiet? })
export const P = (id, level, label, en, ja, steps, extra = {}) => ({ id, level, label, en, ja, steps, ...extra });
