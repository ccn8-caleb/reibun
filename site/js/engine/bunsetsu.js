// Bunsetsu (文節) chunking: one content word plus the particles, auxiliaries and
// helper words that hang off it. 私は | 昨日 | 友達と | 新しい | 映画を | 見に | 行きました。
//
// The rules follow the usual IPADIC conventions (as CaboCha does): a chunk starts at
// each independent word, and everything dependent attaches to the chunk before it.

const OPEN_BRACKET = '括弧開';

// Nouns that don't glue to a preceding noun: 昨日 友達 stays two chunks.
const LOOSE_NOUN = new Set(['副詞可能', '代名詞']);

function attachesToPrevious(prev, tok) {
  if (!prev) return false;
  if (prev.pos === '接頭詞' || prev.pos1 === OPEN_BRACKET) return true;
  if (tok.pos === '記号') return tok.pos1 !== OPEN_BRACKET;
  if (tok.pos === '助詞' || tok.pos === '助動詞') return true;
  if ((tok.pos === '動詞' || tok.pos === '形容詞') && (tok.pos1 === '非自立' || tok.pos1 === '接尾')) return true;
  if (tok.pos === '名詞' && ['接尾', '非自立', '特殊'].includes(tok.pos1)) return true;
  // 〜ではない / 〜くもない: ない after は or も closes the same predicate.
  if (tok.pos === '形容詞' && tok.base === 'ない' && prev.pos === '助詞' && ['は', 'も'].includes(prev.surface)) return true;
  // かも + しれない
  if (tok.pos === '動詞' && ['しれる', '知れる'].includes(tok.base) && prev.surface === 'かも') return true;
  // 勉強 + する / できる: one suru-verb.
  if (tok.pos === '動詞' && prev.pos === '名詞' && prev.pos1 === 'サ変接続' && ['する', 'できる', '出来る'].includes(tok.base)) return true;
  // Compound nouns (日本 + 語, 東京 + 大学), but not time words or pronouns.
  if (tok.pos === '名詞' && prev.pos === '名詞' && !LOOSE_NOUN.has(prev.pos1) && !LOOSE_NOUN.has(tok.pos1) && prev.pos1 !== '非自立') {
    return ['一般', '固有名詞', 'サ変接続', '数', '形容動詞語幹'].includes(tok.pos1);
  }
  return false;
}

// Index of the chunk's content word: the first token that isn't a prefix, bracket or
// symbol; for compounds and suru-verbs the last word of the compound.
function headOf(tokens) {
  let h = tokens.findIndex((t) => t.pos !== '接頭詞' && t.pos !== '記号');
  if (h < 0) return 0;
  while (h + 1 < tokens.length) {
    const t = tokens[h];
    const n = tokens[h + 1];
    const compound = n.pos === '名詞' && t.pos === '名詞' && !['非自立', '特殊'].includes(n.pos1) && n.pos1 !== '接尾';
    const suru = n.pos === '動詞' && t.pos1 === 'サ変接続' && ['する', 'できる', '出来る'].includes(n.base);
    if (!compound && !suru) break;
    h++;
  }
  return h;
}

export function chunk(tokens) {
  const chunks = [];
  for (const tok of tokens) {
    const cur = chunks[chunks.length - 1];
    if (cur && attachesToPrevious(cur.tokens[cur.tokens.length - 1], tok)) cur.tokens.push(tok);
    else chunks.push({ tokens: [tok] });
  }
  return chunks.map((c, id) => {
    const head = headOf(c.tokens);
    return {
      id,
      tokens: c.tokens,
      head, // index into tokens
      text: c.tokens.map((t) => t.surface).join(''),
      start: c.tokens[0].start,
      end: c.tokens[c.tokens.length - 1].end,
    };
  });
}

// Tokens without trailing punctuation.
export const coreTokens = (b) => {
  let n = b.tokens.length;
  while (n > 1 && b.tokens[n - 1].pos === '記号') n--;
  return b.tokens.slice(0, n);
};
