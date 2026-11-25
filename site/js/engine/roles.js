// What each bunsetsu is doing in the sentence: topic, subject, object, place,
// predicate, a clause modifying a noun, … plus which chunk it attaches to (dep).
//
// Roles come mainly from the case particle that closes the chunk; predicates come
// from what the chunk is built on (verb, adjective, noun + copula) and how it ends.
// Attachment uses the classic heuristic: noun modifiers attach to the next noun
// chunk, everything else to the next predicate. It's a teaching aid, not a parser:
// ambiguous sentences get the most common reading.

import { coreTokens } from './bunsetsu.js';

export const ROLES = {
  topic: { ja: '主題', en: 'Topic', tone: 'topic', hint: { ja: '「は」で示される話題。文全体が何について述べているか。', en: 'Marked by は: what the sentence is about. Often also the subject, but not always.' } },
  subject: { ja: '主語', en: 'Subject', tone: 'subject', hint: { ja: '「が」で示される動作・状態の主体。', en: 'Marked by が: who or what does the action or has the state.' } },
  object: { ja: '目的語', en: 'Object', tone: 'object', hint: { ja: '「を」で示される動作の対象。移動動詞では通過する場所。', en: 'Marked by を: what the action is done to. With motion verbs, the place moved through.' } },
  target: { ja: '対象・着点', en: 'Target', tone: 'case', hint: { ja: '「に」: 相手・到達点・存在の場所・目的など。', en: 'Marked by に: recipient, destination, where something exists, or purpose.' } },
  agent: { ja: '動作主（に）', en: 'By whom (に)', tone: 'subject', hint: { ja: '受身・使役受身の「に」: その動作をした人（〜に…される）。', en: 'With a passive verb, に marks who did it: 先生に褒められた "was praised by the teacher".' } },
  causee: { ja: '使役の相手（に）', en: 'Made / let (に)', tone: 'subject', hint: { ja: '使役の「に」: させられる側の人（〜に…させる）。', en: 'With a causative verb, に marks who is made or allowed to act: 子供に食べさせる "make the child eat".' } },
  time: { ja: '時', en: 'Time', tone: 'case', hint: { ja: '時を表す語（「に」が付くことも付かないこともある）。', en: 'When it happens. Time words often take no particle; specific times take に.' } },
  direction: { ja: '方向', en: 'Direction', tone: 'case', hint: { ja: '「へ」: 移動の方向。', en: 'Marked by へ: the direction of movement.' } },
  means: { ja: '場所・手段', en: 'Place / means', tone: 'case', hint: { ja: '「で」: 動作の場所、手段・材料、原因、範囲。', en: 'Marked by で: where an action happens, the means or material, a cause, or a scope.' } },
  companion: { ja: '相手・並列', en: 'With / and', tone: 'case', hint: { ja: '「と」: 一緒に行う相手、または名詞の並列。', en: 'Marked by と: who you do it with, or "and" between nouns.' } },
  quote: { ja: '引用', en: 'Quote', tone: 'clause', hint: { ja: '「と」「って」: 言う・思う内容の引用。', en: 'Marked by と / って: the content of saying, thinking or calling.' } },
  source: { ja: '起点', en: 'From', tone: 'case', hint: { ja: '「から」: 起点（場所・時間・人）。', en: 'Marked by から: the starting point in space, time or who something comes from.' } },
  limit: { ja: '限度', en: 'Until', tone: 'case', hint: { ja: '「まで」: 終点・限度。', en: 'Marked by まで: the end point or limit.' } },
  comparison: { ja: '比較', en: 'Compared to', tone: 'case', hint: { ja: '「より」: 比較の基準。', en: 'Marked by より: the thing being compared against ("than").' } },
  also: { ja: '追加', en: 'Also', tone: 'topic', hint: { ja: '「も」: 「〜も」同様であることを示す。', en: 'Marked by も: "too / also / even", replacing は, が or を.' } },
  listing: { ja: '例示', en: 'Listing', tone: 'case', hint: { ja: '「や」「とか」: 例の列挙。', en: 'Marked by や / とか: items given as examples ("A, B and so on").' } },
  limiter: { ja: '限定', en: 'Only / just', tone: 'case', hint: { ja: '「だけ」「しか」「ばかり」など: 範囲の限定。', en: 'だけ, しか, ばかり…: limits the scope ("only", "nothing but").' } },
  possessive: { ja: '連体修飾（の）', en: 'Describes noun (の)', tone: 'modifier', hint: { ja: '「の」で次の名詞を修飾する。', en: 'Marked by の: describes or owns the next noun ("A\'s B", "B of A").' } },
  modifier: { ja: '連体修飾', en: 'Describes noun', tone: 'modifier', hint: { ja: '次の名詞を説明する語・節（連体修飾）。', en: 'A word or clause describing the next noun. In Japanese, descriptions always come before the noun.' } },
  adverbial: { ja: '連用修飾', en: 'Describes action', tone: 'modifier', hint: { ja: '述語（動作・状態）を修飾する語。', en: 'Describes how, how much or when the predicate happens.' } },
  clause: { ja: '従属節', en: 'Linked clause', tone: 'clause', hint: { ja: '接続助詞などで次につながる節（理由・条件・順序など）。', en: 'A clause that links on to the rest of the sentence: reason, condition, sequence, contrast…' } },
  predicate: { ja: '述語', en: 'Predicate', tone: 'predicate', hint: { ja: '文の中心となる述語（動詞・形容詞・名詞＋だ）。', en: 'The core of the sentence: the verb, adjective or noun + copula that everything else hangs on.' } },
  conjunction: { ja: '接続詞', en: 'Connector', tone: 'clause', hint: { ja: '文と文をつなぐ語。', en: 'Connects this sentence to the previous one.' } },
  interjection: { ja: '感動詞', en: 'Interjection', tone: 'other', hint: { ja: '感動・応答・呼びかけ。', en: 'An exclamation, response or call.' } },
  noun: { ja: '名詞句', en: 'Noun phrase', tone: 'other', hint: { ja: '助詞の付かない名詞。', en: 'A noun with no particle; its role comes from context.' } },
};

export const ROLE_TONES = ['topic', 'subject', 'object', 'case', 'modifier', 'clause', 'predicate', 'other'];

// Connective particles that end a linked clause, with their meaning.
export const CONNECTORS = {
  て: { ja: '〜て（順序・手段・理由）', en: 'te-form: and then / by / because' },
  で: { ja: '〜で（順序・手段・理由）', en: 'te-form: and then / by / because' },
  ので: { ja: '〜ので（理由）', en: 'node: because (objective)' },
  から: { ja: '〜から（理由）', en: 'kara: because' },
  けど: { ja: '〜けど（逆接）', en: 'kedo: but / although' },
  けれど: { ja: '〜けれど（逆接）', en: 'keredo: but / although' },
  けれども: { ja: '〜けれども（逆接）', en: 'keredomo: but / although' },
  が: { ja: '〜が（逆接・前置き）', en: 'ga: but / and (softener)' },
  のに: { ja: '〜のに（逆接・不満）', en: 'noni: even though (unexpected)' },
  ば: { ja: '〜ば（条件）', en: 'ba: if' },
  と: { ja: '〜と（条件・きっかけ）', en: 'to: when / whenever / if' },
  ながら: { ja: '〜ながら（同時）', en: 'nagara: while' },
  たり: { ja: '〜たり（例示）', en: 'tari: things like…' },
  だり: { ja: '〜たり（例示）', en: 'tari: things like…' },
  し: { ja: '〜し（理由の列挙）', en: 'shi: and also (listing reasons)' },
  ても: { ja: '〜ても（逆接条件）', en: 'temo: even if' },
  でも: { ja: '〜ても（逆接条件）', en: 'temo: even if' },
};

const CASE_ROLE = { が: 'subject', を: 'object', へ: 'direction', で: 'means', から: 'source', まで: 'limit', より: 'comparison', や: 'listing', とか: 'listing' };
const LIMITERS = new Set(['だけ', 'しか', 'ばかり', 'のみ', 'ほど', 'くらい', 'ぐらい', 'など']);
const TIME_SUFFIX = /^(時|分|秒|日|月|年|曜日|週|時間|頃|ごろ)$/;
// Time words among IPADIC's 副詞可能 nouns (which also include たくさん, 全部…).
const TIME_WORD = /[日年月時分秒朝昼晩夜週頃昔今前後春夏秋冬]|いつ|さっき|あした|あす|きのう|きょう|ごろ|とき|うち/;

const isPredicateToken = (t) =>
  t.kind === 'verb' || t.kind === 'i-adj' || t.kind === 'aux-verb' || (t.pos === '助動詞' && ['特殊・ダ', '特殊・デス', 'ナ'].some((c) => t.ctype.startsWith(c)) && t.cform !== '体言接続');

// Does this chunk contain a verb, adjective, or copula (= can head a clause)?
export function isPredicate(b) {
  return coreTokens(b).some(isPredicateToken);
}

function isNominal(b) {
  const h = b.tokens[b.head];
  return h && ['noun', 'pronoun', 'proper', 'number', 'nominalizer', 'na-adj', 'suffix'].includes(h.kind);
}

// Ends in a form that modifies a following noun: 書いた 手紙, 新しい 映画, 静かな 部屋.
function endsAttributive(core) {
  const last = core[core.length - 1];
  if (!last) return false;
  if (last.pos === '助動詞' && last.cform === '体言接続') return true; // な
  if (last.pos === '助動詞' && last.ctype === '特殊・タ') return true;
  if (['動詞', '形容詞'].includes(last.pos) && last.cform === '基本形') return true;
  if (last.pos === '助動詞' && ['特殊・ナイ', '特殊・タイ', '特殊・マス'].includes(last.ctype) && last.cform === '基本形') return true;
  return false;
}

function roleFor(b, next, isLast) {
  const core = coreTokens(b);
  const head = b.tokens[b.head];
  const last = core[core.length - 1];
  const particles = [];
  for (let k = core.length - 1; k >= 0 && core[k].pos === '助詞'; k--) particles.unshift(core[k]);
  const info = { particles: particles.map((p) => p.surface).join('') };

  if (head.kind === 'conjunction') return { role: 'conjunction', ...info };
  if (head.kind === 'adverb') return { role: 'adverbial', ...info }; // すぐに, ゆっくりと
  // 〜のために / 〜ために: purpose or cause.
  if (core.some((t) => ['ため', '為'].includes(t.surface) && t.pos === '名詞') && last.surface === 'に') return { role: 'adverbial', purpose: true, ...info };
  if (head.kind === 'interjection') return { role: 'interjection', ...info };

  // Clause-ending connective particles (て, ので, けど, ば…).
  // 〜したのに: IPADIC splits のに into の (nominalizer) + に after a verb or adjective.
  if (core.length >= 3 && last.surface === 'に' && core[core.length - 2].surface === 'の' && core[core.length - 2].pos1 === '非自立' && ['助動詞', '形容詞'].includes(core[core.length - 3].pos)) {
    return { role: 'clause', connector: 'のに', ...info };
  }
  const conn = particles.find((p) => p.pos1 === '接続助詞');
  if (conn && isPredicate(b)) return { role: 'clause', connector: conn.surface, ...info };
  if (last.pos === '助動詞' && last.ctype === '特殊・タ' && last.cform === '仮定形') return { role: 'clause', connector: 'たら', ...info };

  if (particles.length) {
    const first = particles[0];
    const surfaces = particles.map((p) => p.surface);
    if (first.pos2 === '引用' || first.surface === 'って') return { role: 'quote', ...info };
    if (first.pos2 === '連体化' || (first.surface === 'の' && first.pos1 === '連体化')) return { role: 'possessive', ...info };
    if (first.pos1 === '終助詞' || (isLast && first.pos1.includes('終助詞'))) return { role: isPredicate(b) ? 'predicate' : 'noun', ending: first.surface, ...info };
    if (LIMITERS.has(first.surface) && particles.length === 1) return { role: 'limiter', ...info };
    // は / も replace or follow a case particle: 私は (topic), 学校には (target + topic).
    const caseP = particles.find((p) => p.pos1 === '格助詞' || p.pos1 === '並立助詞');
    const topic = surfaces.includes('は');
    const also = surfaces.includes('も');
    let role = null;
    if (caseP) {
      if (caseP.pos2 === '連語') role = 'adverbial'; // について, によって…
      else if (caseP.surface === 'に') role = isTime(b) ? 'time' : 'target';
      else if (caseP.surface === 'と') role = 'companion';
      else role = CASE_ROLE[caseP.surface] || null;
    }
    if (!role && topic) role = 'topic';
    if (!role && also) role = 'also';
    if (!role && particles.some((p) => LIMITERS.has(p.surface))) role = 'limiter';
    if (role && isPredicate(b) && !isNominal(b)) {
      // 見に (行く): a verb stem + に is purpose.
      if (role === 'target') return { role: 'adverbial', purpose: true, topic, ...info };
    }
    if (role) return { role, topic: topic && role !== 'topic', also: also && role !== 'also', ...info };
  }

  if (isPredicate(b)) {
    if (!isLast && next && isNominal(next) && endsAttributive(core)) return { role: 'modifier', clause: true, ...info };
    if (isLast || next?.tokens[0]?.pos === '記号') return { role: 'predicate', ...info };
    // Continuative stem (連用中止): 食べ、 / 高く
    if (head.kind === 'i-adj' && head.cform.startsWith('連用')) return { role: 'adverbial', ...info };
    if (['連用形', '連用タ接続'].includes(last.cform)) return { role: 'clause', connector: '、', ...info };
    return { role: 'predicate', ...info };
  }
  if (head.kind === 'adverb') return { role: 'adverbial', ...info };
  if (head.kind === 'adnominal') return { role: 'modifier', ...info };
  if (head.kind === 'na-adj' && last.pos === '助動詞' && last.cform === '体言接続') return { role: 'modifier', ...info };
  if (head.kind === 'na-adj' && last.surface === 'に') return { role: 'adverbial', ...info };
  if (isTime(b)) return { role: 'time', ...info };
  if (head.pos1 === '副詞可能') return { role: 'adverbial', ...info };
  return { role: 'noun', ...info };
}

function isTime(b) {
  const core = coreTokens(b);
  return core.some(
    (t) =>
      ((t.pos1 === '副詞可能' || t.pos2 === '副詞可能') && TIME_WORD.test(t.surface)) ||
      ((t.pos1 === '接尾' || t.pos2 === '助数詞') && TIME_SUFFIX.test(t.surface))
  );
}

// Can chunk c take b as an argument? Any predicate except a modifier, with two
// exceptions: a verb relative clause takes its own arguments (彼が [書いた] 手紙), and
// an adverb can describe an adjective (とても [高い] 本).
function acceptsArgument(b, c) {
  if (!isPredicate(c)) return false;
  if (c.role !== 'modifier') return true;
  return c.tokens[c.head]?.kind === 'verb' || b.role === 'adverbial';
}

// Adds b.role / b.roleInfo / b.dep (index of the chunk it attaches to, -1 for the root).
export function assignRoles(chunks) {
  chunks.forEach((b, k) => {
    const next = chunks[k + 1];
    const isLast = k === chunks.length - 1 || chunks.slice(k + 1).every((c) => c.tokens.every((t) => t.pos === '記号'));
    const { role, ...roleInfo } = roleFor(b, next, isLast);
    b.role = role;
    b.roleInfo = roleInfo;
  });
  const root = [...chunks].reverse().find((b) => b.role === 'predicate');
  chunks.forEach((b, k) => {
    b.dep = -1;
    if (b.role === 'predicate' && chunks.slice(k + 1).every((c) => c.role !== 'predicate' && c.role !== 'clause')) return;
    // は usually reaches past embedded clauses to the main predicate:
    // 私は [雨が降ったので] 家にいた → 私は … いた.
    if ((b.role === 'topic' || b.roleInfo.topic) && root && root.id > k) {
      b.dep = root.id;
      return;
    }
    const wantsNoun = ['modifier', 'possessive'].includes(b.role);
    for (let j = k + 1; j < chunks.length; j++) {
      const c = chunks[j];
      if (wantsNoun ? isNominal(c) : acceptsArgument(b, c)) {
        b.dep = j;
        return;
      }
    }
    // Nothing suitable after it: attach to the last chunk (the sentence's end).
    if (k < chunks.length - 1) b.dep = chunks.length - 1;
  });
  return chunks;
}

// Main predicate and its direct dependents: the sentence's skeleton.
export function skeleton(chunks) {
  const root = [...chunks].reverse().find((b) => b.role === 'predicate') || chunks[chunks.length - 1];
  if (!root) return null;
  return {
    root: root.id,
    args: chunks.filter((b) => b.dep === root.id).map((b) => b.id),
  };
}
