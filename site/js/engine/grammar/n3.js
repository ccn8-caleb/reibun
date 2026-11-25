// JLPT N3 grammar.

import { TE, NEG, NEG_ANY, PAST, VERB, DICT, STEM, MIZEN, COPULA, GOOD, PRT, T, GAP, P } from './common.js';

export default [
  // --- Ability, obligation, permission
  P('beki', 'N3', '〜べき', 'Should / ought to (a duty or what is right).', '当然・義務。', [{ b: 'べし' }], { group: 'modality', ex: '約束は守るべきだ。' }),

  // --- Conditions & time
  P('uchi-ni', 'N3', '〜うちに', 'While (still) … / before it changes.', '状態が変わる前に。', [{ s: 'うち' }, { s: 'に' }], { group: 'time', ex: '熱いうちに食べてください。' }),
  P('mama', 'N3', '〜まま', 'Leaving as is / unchanged.', '変わらない状態のまま。', [{ s: 'まま' }], { group: 'condition', ex: '靴を履いたまま入った。' }),

  // --- Appearance, hearsay, probability
  P('wake', 'N3', '〜わけだ', 'That is why / no wonder (a logical conclusion).', '当然の結論。', [{ s: 'わけ' }, { ...COPULA, cform: /基本形/ }], { group: 'evidential', ex: 'だから安いわけだ。' }),
  P('wake-dewa-nai', 'N3', '〜わけではない', 'It is not (necessarily) that …', '部分否定。', [{ s: 'わけ' }, { s: ['で', 'じゃ'] }, { s: 'は', opt: true }, NEG], { group: 'evidential', ex: '嫌いなわけではない。' }),

  // --- Comparison & limits
  P('bakari', 'N3', '〜ばかり', 'Nothing but / always doing; after た: just did.', '限定・直後。', [{ s: 'ばかり', pos: '助詞' }], { group: 'emphasis', generic: true, ex: '弟はゲームばかりしている。' }),

  // --- Fixed phrases (one token in IPADIC)
  P('ni-yotte', 'N3', '〜によって', 'By (agent of a passive) / depending on / by means of.', '動作主・手段・依存。', [{ s: ['によって', 'により', 'による'] }], { group: 'phrases', ex: 'この絵はピカソによって描かれた。' }),
  P('to-shite', 'N3', '〜として', 'As (a role or capacity).', '資格・立場。', [{ s: 'として' }], { group: 'phrases', ex: '通訳として働いている。' }),
  P('ni-totte', 'N3', '〜にとって', 'For (from the point of view of).', '〜の立場から見ると。', [{ s: 'にとって' }], { group: 'phrases', ex: '私にとって大切な人だ。' }),
  P('ni-taishite', 'N3', '〜に対して', 'Toward / against / in contrast to.', '対象・対比。', [{ s: ['に対して', 'に対し', 'に対する'] }], { group: 'phrases', ex: '質問に対して答えた。' }),

  // --- Voice
  P('causative-passive', 'N3', '使役受身（させられる）', 'Be made to do (against your will).', '強制されて〜する。', [{ b: ['させる', 'せる'], p1: '接尾' }, { b: ['られる', 'れる'], p1: '接尾' }], { group: 'voice', ex: '子供に野菜を食べさせられた。' }),

  // --- Keigo
  P('o-ni-naru', 'N3', 'お〜になる', 'Honorific: someone (respected) does.', '尊敬語。', [{ s: ['お', 'ご'], pos: '接頭詞' }, { pos: ['動詞', '名詞'] }, { s: 'に' }, { b: 'なる' }], { group: 'keigo', ex: '先生がお帰りになった。' }),
  P('o-suru', 'N3', 'お〜する', 'Humble: I do (for you).', '謙譲語。', [{ s: ['お', 'ご'], pos: '接頭詞' }, { pos: ['動詞', '名詞'] }, { b: ['する', 'いたす', '致す'] }], { group: 'keigo', ex: '荷物をお持ちします。' }),
  P('sonkeigo', 'N3', '尊敬語の動詞', 'Honorific verb: raises the person doing the action (いらっしゃる, おっしゃる, 召し上がる…).', '相手や話題の人を高める動詞。', [{ b: ['いらっしゃる', 'おっしゃる', '召し上がる', 'めしあがる', 'なさる', 'ご覧になる', 'くださる'], p1: '自立', not: { b: 'くださる', cform: '命令ｉ' } }], { group: 'keigo', ex: '社長がいらっしゃった。' }),
  P('kenjougo', 'N3', '謙譲語の動詞', 'Humble verb: lowers yourself (参る, 申す, いただく, 伺う…).', '自分を低めて相手を高める動詞。', [{ b: ['参る', 'まいる', '申す', 'もうす', '申し上げる', 'いただく', '伺う', 'うかがう', '拝見', 'いたす', '致す', '存じる', 'おる'], p1: '自立' }], { group: 'keigo', ex: '明日伺います。' }),
];
