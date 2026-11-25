// Conjugation chains: what was stacked onto a verb or adjective and in what order.
//
//   食べさせられた → 食べる (ichidan) + させ causative + られ passive + た past
//   読んでいます   → 読む (godan) + で te-form + い progressive/state + ます polite
//
// Works on one bunsetsu. Returns null for chunks with no verb/adjective/copula.

import { coreTokens } from './bunsetsu.js';

export const CLASSES = {
  godan: { ja: '五段動詞', en: 'Godan verb (u-verb)' },
  ichidan: { ja: '一段動詞', en: 'Ichidan verb (ru-verb)' },
  kuru: { ja: 'カ変動詞（来る）', en: 'Irregular verb (来る)' },
  suru: { ja: 'サ変動詞（する）', en: 'Irregular verb (する)' },
  'suru-noun': { ja: 'する動詞（名詞＋する）', en: 'Suru-verb (noun + する)' },
  'i-adj': { ja: 'い形容詞', en: 'i-adjective' },
  'na-adj': { ja: 'な形容詞', en: 'na-adjective' },
  copula: { ja: '名詞＋だ・です', en: 'Noun + copula' },
  special: { ja: '特殊', en: 'Special' },
};

// IPADIC conjugation forms of the head word.
export const FORMS = {
  基本形: { ja: '基本形（辞書形）', en: 'Dictionary form' },
  未然形: { ja: '未然形', en: 'Irrealis stem (before ない, れる, せる)' },
  未然ウ接続: { ja: '未然ウ接続', en: 'Volitional stem (before う)' },
  未然ヌ接続: { ja: '未然ヌ接続', en: 'Stem before ぬ' },
  未然レル接続: { ja: '未然レル接続', en: 'Stem before れる' },
  連用形: { ja: '連用形（ます形の語幹）', en: 'Continuative stem (ます-stem)' },
  連用タ接続: { ja: '連用タ接続（音便）', en: 'Sound-change stem (before た / て)' },
  連用テ接続: { ja: '連用テ接続', en: 'Adverbial form (-く / before て)' },
  連用ゴザイ接続: { ja: '連用ゴザイ接続', en: 'Stem before ございます' },
  仮定形: { ja: '仮定形', en: 'Conditional stem (before ば)' },
  仮定縮約１: { ja: '仮定縮約', en: 'Contracted conditional' },
  命令ｅ: { ja: '命令形', en: 'Imperative' },
  命令ｒｏ: { ja: '命令形', en: 'Imperative' },
  命令ｙｏ: { ja: '命令形', en: 'Imperative' },
  命令ｉ: { ja: '命令形', en: 'Imperative' },
  体言接続: { ja: '体言接続', en: 'Attributive (before a noun)' },
  ガル接続: { ja: 'ガル接続', en: 'Stem before がる' },
};

const L = (id, ja, en) => ({ id, ja, en });
export const LAYERS = {
  causative: L('causative', '使役（させる）', 'Causative: make / let'),
  passive: L('passive', '受身・可能・尊敬（られる）', 'Passive (also potential / honorific)'),
  'passive-godan': L('passive', '受身・尊敬（れる）', 'Passive (also honorific)'),
  negative: L('negative', '否定', 'Negative'),
  polite: L('polite', '丁寧（ます）', 'Polite'),
  past: L('past', '過去・完了', 'Past / completed'),
  conditionalTara: L('conditional', '条件（たら）', 'Conditional: if / when (たら)'),
  te: L('te', 'て形', 'te-form (connects)'),
  desire: L('desire', '希望（たい）', 'Want to'),
  volitional: L('volitional', '意向（う・よう）', "Volitional: let's / I'll"),
  conjecture: L('conjecture', '推量（でしょう・だろう）', 'Probably'),
  copula: L('copula', '断定（だ）', 'Copula: is'),
  politeCopula: L('copula', '丁寧な断定（です）', 'Copula, polite: is'),
  attributive: L('attributive', '連体（な）', 'Attributive: before a noun'),
  conditionalBa: L('conditional', '条件（ば）', 'Conditional: if (ば)'),
  progressive: L('aspect', '進行・結果の状態（ている）', 'Ongoing action or resulting state'),
  resultative: L('aspect', '結果の状態（てある）', 'State left by a deliberate action'),
  completion: L('aspect', '完了・残念（てしまう）', 'Completely / regrettably'),
  preparation: L('aspect', '準備（ておく）', 'In advance / leave as is'),
  attempt: L('aspect', '試み（てみる）', 'Try and see'),
  goingOn: L('aspect', '変化・継続（ていく）', 'Going on / away from now'),
  comingOn: L('aspect', '変化・接近（てくる）', 'Coming on / up to now'),
  giveMe: L('benefactive', '恩恵（てくれる）', 'Does for me / us'),
  receive: L('benefactive', '恩恵（てもらう）', 'Get someone to / receive a favour'),
  give: L('benefactive', '恩恵（てあげる）', 'Does for someone'),
  request: L('request', '依頼（てください）', 'Please do'),
  wantOthers: L('desire', '希望（てほしい）', 'Want someone to'),
  easy: L('ease', '〜やすい', 'Easy to'),
  hard: L('ease', '〜にくい', 'Hard to'),
  tooMuch: L('degree', '〜すぎる', 'Too much'),
  seems: L('evidential', '様態（そう）', 'Looks like'),
  heard: L('evidential', '伝聞（そう）', 'I heard that'),
  connective: L('connective', '接続', 'Connects to the next clause'),
};

const AUX_AFTER_TE = {
  いる: 'progressive', ある: 'resultative', しまう: 'completion', ちゃう: 'completion', じゃう: 'completion',
  おく: 'preparation', とく: 'preparation', みる: 'attempt', いく: 'goingOn', くる: 'comingOn',
  くれる: 'giveMe', くださる: 'request', もらう: 'receive', いただく: 'receive', あげる: 'give', さしあげる: 'give', やる: 'give',
};

function classOf(head, prev) {
  if (head.pos === '動詞') {
    if (prev?.pos1 === 'サ変接続' && head.ctype.startsWith('サ変')) return 'suru-noun';
    if (head.ctype.startsWith('五段')) return 'godan';
    if (head.ctype.startsWith('一段')) return 'ichidan';
    if (head.ctype.startsWith('カ変')) return 'kuru';
    if (head.ctype.startsWith('サ変')) return 'suru';
    return 'special';
  }
  if (head.kind === 'i-adj') return 'i-adj';
  if (head.kind === 'na-adj') return 'na-adj';
  return 'copula';
}

function layerFor(t, prev, layers) {
  const after = (id) => layers.length && layers[layers.length - 1].id === id;
  if (t.pos === '動詞' && t.pos1 === '接尾') {
    if (['させる', 'せる'].includes(t.base)) return 'causative';
    if (t.base === 'られる') return 'passive';
    if (t.base === 'れる') return 'passive-godan';
  }
  // 勉強させる: させ can come as the する verb (さ) + せる.
  if (t.pos === '助動詞') {
    switch (t.ctype) {
      case '特殊・ナイ':
      case '特殊・ヌ':
        return 'negative';
      case '特殊・マス':
        return 'polite';
      case '特殊・タ':
        return t.cform === '仮定形' ? 'conditionalTara' : 'past';
      case '特殊・タイ':
        return 'desire';
      case '特殊・ダ':
        if (t.cform === '体言接続') return 'attributive';
        if (t.cform === '未然形') return null; // だろ + う → conjecture below
        return 'copula';
      case '特殊・デス':
        if (t.cform === '未然形') return null; // でしょ + う
        return 'politeCopula';
      case '不変化型':
        if (['う', 'よう'].includes(t.base)) {
          return prev && (prev.ctype === '特殊・デス' || prev.ctype === '特殊・ダ') ? 'conjecture' : 'volitional';
        }
        if (t.base === 'ん') return 'negative';
        return null;
    }
  }
  if (t.pos === '助詞' && t.pos1 === '接続助詞') {
    if (['て', 'で'].includes(t.surface)) return 'te';
    if (t.surface === 'ば') return 'conditionalBa';
    return 'connective';
  }
  if (t.pos === '動詞' && t.pos1 === '非自立' && (after('te') || ['ちゃう', 'じゃう', 'とく'].includes(t.base))) {
    const id = AUX_AFTER_TE[t.base];
    if (id) return id;
  }
  if (t.pos === '動詞' && t.base === 'すぎる') return 'tooMuch';
  if (t.pos === '形容詞' && t.pos1 !== '自立') {
    if (t.base === 'やすい') return 'easy';
    if (['にくい', 'づらい'].includes(t.base)) return 'hard';
    if (t.base === 'ほしい' && after('te')) return 'wantOthers';
    if (t.base === 'ない') return 'negative';
  }
  if (t.pos === '形容詞' && t.base === 'ない' && prev && (prev.cform === '連用テ接続' || prev.surface === 'は')) return 'negative';
  if (t.surface === 'そう' && t.pos === '名詞') return t.pos1 === '特殊' ? 'heard' : 'seems';
  return null;
}

export function conjugation(b) {
  const core = coreTokens(b);
  let hi = core.findIndex((t) => t.kind === 'verb' || t.kind === 'i-adj');
  if (hi < 0) hi = core.findIndex((t) => t.kind === 'aux-verb'); // お待ち + ください
  let headIdx = hi;
  if (headIdx < 0) {
    // na-adjective or noun + copula
    const cop = core.findIndex((t) => t.pos === '助動詞' && ['特殊・ダ', '特殊・デス'].includes(t.ctype));
    if (cop < 1) return null;
    headIdx = cop - 1;
  }
  const head = core[headIdx];
  const prev = core[headIdx - 1];
  const cls = classOf(head, prev);
  const base = cls === 'suru-noun' ? prev.surface + head.base : cls === 'copula' || cls === 'na-adj' ? head.surface : head.base;

  const layers = [];
  for (let k = headIdx + 1; k < core.length; k++) {
    const t = core[k];
    if (t.pos === '名詞' && ['非自立', '一般'].includes(t.pos1)) break; // こと, の: a noun phrase from here on
    if (t.pos === '助詞' && t.pos1 !== '接続助詞') break; // case/final particles end the chain
    const id = layerFor(t, core[k - 1], layers);
    if (id) layers.push({ ...LAYERS[id], key: id, surface: t.surface, connector: LAYERS[id].id === 'connective' ? t.surface : undefined });
  }
  // でしょ + う / だろ + う: the conjecture layer covers both tokens.
  const has = (id) => layers.some((l) => l.id === id);
  const negatives = layers.filter((l) => l.id === 'negative').length;
  return {
    head: head.i,
    base,
    cls,
    form: head.cform,
    layers,
    polite: has('polite') || layers.some((l) => l.key === 'politeCopula'),
    past: has('past'),
    negative: negatives % 2 === 1,
  };
}

// "causative-passive, polite past" — a short summary for the skeleton line.
export function summarize(c, t) {
  if (!c) return '';
  const parts = [];
  const ids = c.layers.map((l) => l.key);
  if (ids.includes('causative') && ids.some((i) => i.startsWith('passive'))) parts.push(t('使役受身', 'causative-passive'));
  else if (ids.includes('causative')) parts.push(t('使役', 'causative'));
  else if (ids.some((i) => i.startsWith('passive'))) parts.push(t('受身・可能', 'passive/potential'));
  if (ids.includes('desire')) parts.push(t('希望', 'want to'));
  if (ids.includes('progressive')) parts.push(t('進行・状態', 'ongoing'));
  if (ids.includes('volitional')) parts.push(t('意向', 'volitional'));
  if (ids.includes('conjecture')) parts.push(t('推量', 'probably'));
  parts.push(c.polite ? t('丁寧', 'polite') : t('普通', 'plain'));
  if (c.negative) parts.push(t('否定', 'negative'));
  parts.push(c.past ? t('過去', 'past') : t('非過去', 'non-past'));
  return parts.join(t('・', ', '));
}
