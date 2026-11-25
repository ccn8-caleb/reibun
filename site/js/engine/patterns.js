// Grammar-pattern catalog and matcher.
//
// Each pattern is a sequence of token tests over IPADIC tokens. A step is an object
// whose keys test token fields; values are a string, a list of strings, or a RegExp:
//
//   { s: surface, b: base form, pos, p1, p2 (pos details), ctype, cform, kind }
//   opt: true   the step may be skipped
//   alt: [[steps], [steps]]  either sequence
//   not: {…}    the token must not also match this
//
// `ex` is an example sentence: shown on the Grammar page and used by the tests
// (every pattern must match its own example).
//
// Patterns marked `generic` (e.g. bare ば) are hidden when a longer pattern
// already covers the same tokens (なければならない).
//
// To add a grammar point: add an entry with an example here and run
// `node --test tests/*.test.mjs`.

const TE = { s: ['て', 'で'], p1: '接続助詞' };
const NEG = { alt: [[{ ctype: ['特殊・ナイ', '特殊・ヌ'], pos: '助動詞' }], [{ b: 'ない', pos: '形容詞' }]] };
const NEG_ANY = [{ alt: [...NEG.alt, [{ b: 'ん', ctype: '不変化型' }]] }];
const PAST = { pos: '助動詞', ctype: '特殊・タ' };
const VERB = { pos: '動詞', p1: '自立' };
const DICT = { pos: ['動詞', '形容詞', '助動詞'], cform: '基本形' };
const STEM = { pos: '動詞', cform: '連用形' };
const COPULA = { b: ['だ', 'です'], pos: '助動詞' };
const GOOD = { b: ['いい', 'よい', '良い'], pos: '形容詞' };

const P = (id, level, label, en, ja, steps, extra = {}) => ({ id, level, label, en, ja, steps, ...extra });

export const PATTERNS = [
  // --- Aspect & te-form helpers ------------------------------------------------------
  P('te-iru', 'N5', '〜ている', 'Ongoing action, or the state left by a change (住んでいる "live", 結婚している "is married").', '動作の進行、または変化の結果の状態。', [TE, { b: 'いる', p1: '非自立' }], { group: 'aspect', ex: '雨が降っている。' }),
  P('te-aru', 'N4', '〜てある', 'Something has been done (on purpose) and stays that way: 窓が開けてある "the window has been left open".', '意図的な動作の結果が残っている状態。', [TE, { b: 'ある', p1: '非自立' }], { group: 'aspect', ex: '窓が開けてある。' }),
  P('te-shimau', 'N4', '〜てしまう／ちゃう', 'Do completely, or do something regrettable / by accident.', '完了、または残念・後悔の気持ち。', [{ alt: [[TE, { b: 'しまう' }], [{ b: ['ちゃう', 'じゃう'], pos: '動詞' }]] }], { group: 'aspect', ex: '全部食べてしまった。' }),
  P('te-oku', 'N4', '〜ておく／とく', 'Do in advance (to prepare), or leave as is.', '準備のために前もってする／そのままにしておく。', [{ alt: [[TE, { b: 'おく', p1: '非自立' }], [{ b: 'とく', pos: '動詞' }]] }], { group: 'aspect', ex: 'ビールを買っておく。' }),
  P('te-miru', 'N4', '〜てみる', 'Try doing something to see what it is like.', '試しにする。', [TE, { b: 'みる', p1: '非自立' }], { group: 'aspect', ex: '着てみてもいいですか。' }),
  P('te-iku', 'N4', '〜ていく', 'A change continuing from now on, or doing something and then going.', 'これから先へ続く変化、またはしてから行く。', [TE, { b: ['いく', '行く'], p1: '非自立' }], { group: 'aspect', ex: 'これから寒くなっていく。' }),
  P('te-kuru', 'N4', '〜てくる', 'A change up to now, or doing something and coming back.', '今までの変化、またはしてから来る。', [TE, { b: ['くる', '来る'], p1: '非自立' }], { group: 'aspect', ex: 'だんだん暖かくなってきた。' }),
  P('te-kureru', 'N4', '〜てくれる', 'Someone does something for me / us (a favour received).', '（他人が）自分のために〜する。', [TE, { b: ['くれる', 'くださる'], p1: '非自立', not: { cform: '命令ｉ' } }], { group: 'aspect', ex: '友達が手伝ってくれた。' }),
  P('te-morau', 'N4', '〜てもらう', 'Get someone to do something / have it done for you.', '他人に〜してもらう（恩恵を受ける）。', [TE, { b: ['もらう', 'いただく'], p1: '非自立' }], { group: 'aspect', ex: '母に作ってもらった。' }),
  P('te-ageru', 'N4', '〜てあげる', 'Do something for someone else.', '他人のために〜する。', [TE, { b: ['あげる', 'さしあげる', 'やる'], p1: '非自立' }], { group: 'aspect', ex: '弟に教えてあげた。' }),
  P('te-kudasai', 'N5', '〜てください', 'Please do (a polite request).', '丁寧な依頼。', [TE, { b: 'くださる', cform: '命令ｉ' }], { group: 'aspect', ex: 'ここに名前を書いてください。' }),
  P('te-hoshii', 'N4', '〜てほしい', 'Want someone else to do something.', '他人にしてもらいたい。', [TE, { b: 'ほしい' }], { group: 'aspect', ex: 'もっと早く来てほしい。' }),
  P('te-kara', 'N5', '〜てから', 'After doing, then …', '〜した後で。', [TE, { s: 'から', pos: '助詞' }], { group: 'aspect', ex: 'ご飯を食べてから出かけます。' }),
  P('te-mo-ii', 'N5', '〜てもいい', 'Permission: it is OK to …', '許可。', [TE, { s: 'も' }, GOOD], { group: 'aspect', ex: '写真を撮ってもいいです。' }),
  P('te-wa-ikenai', 'N5', '〜てはいけない', 'Prohibition: must not …', '禁止。', [{ s: ['て', 'で', 'ちゃ', 'じゃ'], pos: '助詞' }, { s: 'は', opt: true }, { b: ['いける', 'なる', 'だめ', 'ダメ'] }, ...NEG_ANY], { group: 'aspect', ex: 'ここで写真を撮ってはいけない。' }),
  P('te-mo', 'N4', '〜ても', 'Even if / even though …', '逆接の仮定・確定。', [TE, { s: 'も', p1: '係助詞' }], { group: 'aspect', generic: true, ex: '雨が降っても行きます。' }),

  // --- Wanting, intending, trying ------------------------------------------------------
  P('tai', 'N5', '〜たい', 'Want to do (your own desire).', '話し手の希望。', [{ ctype: '特殊・タイ' }], { group: 'intent', ex: '水が飲みたい。' }),
  P('mashou', 'N5', '〜ましょう', "Let's …, or offering: I'll …", '勧誘・申し出。', [{ ctype: '特殊・マス', cform: '未然ウ接続' }, { s: 'う' }], { group: 'intent', ex: '一緒に行きましょう。' }),
  P('masen-ka', 'N5', '〜ませんか', "Invitation: won't you …? / shall we …?", '勧誘。', [{ ctype: '特殊・マス', cform: '未然形' }, { b: 'ん' }, { s: 'か' }], { group: 'intent', ex: '映画を見に行きませんか。' }),
  P('volitional-to-omou', 'N4', '〜（よ）うと思う', 'Thinking of doing / intend to.', '意志・予定。', [{ b: ['う', 'よう'], pos: '助動詞' }, { s: 'と' }, { b: ['思う', 'おもう'] }], { group: 'intent', ex: '来年留学しようと思う。' }),
  P('tsumori', 'N5', '〜つもり', 'Intend to / plan to.', '意図・予定。', [{ s: 'つもり' }], { group: 'intent', ex: '明日行くつもりです。' }),
  P('koto-ni-suru', 'N4', '〜ことにする', 'Decide to do.', '自分で決める。', [{ s: 'こと' }, { s: 'に' }, { b: 'する' }], { group: 'intent', ex: '毎日走ることにした。' }),
  P('koto-ni-naru', 'N4', '〜ことになる', 'It has been decided / it turns out that …', '（自分以外が）決める・結果としてそうなる。', [{ s: 'こと' }, { s: 'に' }, { b: 'なる' }], { group: 'intent', ex: '来月転勤することになった。' }),
  P('you-ni-suru', 'N4', '〜ようにする', 'Make an effort to / make sure to.', '努力・心がけ。', [{ s: 'よう', p1: '非自立' }, { s: 'に' }, { b: 'する' }], { group: 'intent', ex: '野菜を食べるようにしている。' }),
  P('you-ni-naru', 'N4', '〜ようになる', 'Come to be able to / come to do (a change over time).', '変化（できるように・するようになる）。', [{ s: 'よう', p1: '非自立' }, { s: 'に' }, { b: 'なる' }], { group: 'intent', ex: '漢字が読めるようになった。' }),
  P('you-ni', 'N4', '〜ように', 'So that … / in order that (with a non-volitional goal); also "like" / "as".', '目的（〜できるように）、例示。', [{ s: 'よう', p1: '非自立' }, { s: 'に' }], { group: 'intent', generic: true, ex: '忘れないようにメモする。' }),
  P('tame-ni', 'N4', '〜ために', 'For the purpose of (after a dictionary form), or because of (after past / noun の).', '目的、または原因・理由。', [{ s: ['ため', '為'] }, { s: 'に', opt: true }], { group: 'intent', ex: '家を買うために貯金している。' }),
  P('ni-iku', 'N5', '〜に行く／来る', 'Go / come (somewhere) in order to do.', '移動の目的。', [STEM, { s: 'に', pos: '助詞' }, { b: ['行く', '来る', 'いく', 'くる', '帰る', '戻る', '出かける'] }], { group: 'intent', ex: '本を借りに行った。' }),

  // --- Ability, obligation, permission -------------------------------------------------
  P('koto-ga-dekiru', 'N4', '〜ことができる', 'Can / be able to do.', '可能。', [{ s: 'こと' }, { s: ['が', 'も', 'は'], opt: true }, { b: ['できる', '出来る'] }], { group: 'modality', ex: 'ピアノを弾くことができる。' }),
  P('nakereba-naranai', 'N4', '〜なければならない', 'Must / have to.', '義務・必要。', [{ ctype: '特殊・ナイ', cform: '仮定形' }, { s: 'ば' }, { b: ['なる', 'いける'] }, ...NEG_ANY], { group: 'modality', ex: '薬を飲まなければならない。' }),
  P('nakute-wa-ikenai', 'N4', '〜なくてはいけない', 'Must / have to.', '義務・必要。', [{ s: 'なく', ctype: '特殊・ナイ' }, { s: 'て' }, { s: 'は' }, { b: ['なる', 'いける'] }, ...NEG_ANY], { group: 'modality', ex: '早く寝なくてはいけない。' }),
  P('nakute-mo-ii', 'N4', '〜なくてもいい', "Don't have to.", '不必要。', [{ s: 'なく', ctype: '特殊・ナイ' }, { s: 'て' }, { s: 'も' }, GOOD], { group: 'modality', ex: '明日は来なくてもいい。' }),
  P('hou-ga-ii', 'N5', '〜ほうがいい', 'Had better / should (advice).', '助言。', [{ s: ['方', 'ほう'] }, { s: 'が' }, GOOD], { group: 'modality', ex: '早く寝たほうがいい。' }),
  P('beki', 'N3', '〜べき', 'Should / ought to (a duty or what is right).', '当然・義務。', [{ b: 'べし' }], { group: 'modality', ex: '約束は守るべきだ。' }),

  // --- Conditions & time ---------------------------------------------------------------
  P('ba', 'N4', '〜ば', 'If (a general condition: if A, then B follows).', '仮定条件。', [{ s: 'ば', p1: '接続助詞' }], { group: 'condition', generic: true, ex: '安ければ買います。' }),
  P('tara', 'N4', '〜たら', 'If / when (once A has happened, B).', '仮定・確定条件。', [{ ctype: '特殊・タ', cform: '仮定形' }], { group: 'condition', ex: '駅に着いたら電話してください。' }),
  P('to-conditional', 'N4', '〜と（条件）', 'Whenever / if (an automatic or habitual result).', '必然・習慣的な条件。', [DICT, { s: 'と', p1: '接続助詞' }], { group: 'condition', ex: '春になると桜が咲く。' }),
  P('nara', 'N4', '〜なら', 'If (it is the case that) … — reacting to a topic or situation.', '話題・前提を受けた条件。', [{ s: 'なら', ctype: '特殊・ダ' }], { group: 'condition', ex: '京都に行くなら秋がいい。' }),
  P('mae-ni', 'N5', '〜前に', 'Before doing.', '〜する前。', [{ pos: '動詞', cform: '基本形', opt: true }, { s: ['前', 'まえ'] }, { s: 'に' }], { group: 'condition', ex: '寝る前に歯を磨く。' }),
  P('ato-de', 'N5', '〜後で', 'After doing.', '〜した後。', [{ s: ['後', 'あと'] }, { s: 'で' }], { group: 'condition', ex: '授業の後で図書館に行った。' }),
  P('toki', 'N5', '〜時', 'When … (at the time of).', '〜する／した時。', [{ s: ['時', 'とき'], pos: '名詞', p1: ['非自立', '副詞可能', '一般'] }], { group: 'condition', ex: '子供の時、よく泳いだ。' }),
  P('nagara', 'N4', '〜ながら', 'While doing (two actions at once, same subject).', '同時進行。', [{ s: 'ながら', pos: '助詞' }], { group: 'condition', ex: '音楽を聞きながら勉強する。' }),
  P('uchi-ni', 'N3', '〜うちに', 'While (still) … / before it changes.', '状態が変わる前に。', [{ s: 'うち' }, { s: 'に' }], { group: 'condition', ex: '熱いうちに食べてください。' }),
  P('tokoro', 'N4', '〜ところ', 'Just about to (dict.) / in the middle of (ている) / just did (た).', '動作の段階（直前・最中・直後）。', [{ s: 'ところ', p1: '非自立' }, { ...COPULA, opt: true }], { group: 'condition', ex: '今出かけるところだ。' }),
  P('mama', 'N3', '〜まま', 'Leaving as is / unchanged.', '変わらない状態のまま。', [{ s: 'まま' }], { group: 'condition', ex: '靴を履いたまま入った。' }),
  P('tari', 'N4', '〜たり〜たりする', 'Doing things like A and B (an example list of actions).', '動作の例示。', [{ s: ['たり', 'だり'] }], { group: 'condition', ex: '週末は掃除したり洗濯したりする。' }),

  // --- Reasons, contrast -----------------------------------------------------------------
  P('kara-reason', 'N5', '〜から（理由）', 'Because … (speaker’s reason; can be subjective).', '理由。', [{ s: 'から', p1: '接続助詞' }], { group: 'reason', ex: '暑いから窓を開けた。' }),
  P('node', 'N4', '〜ので', 'Because … (objective cause; softer and more polite than から).', '客観的な理由。', [{ s: 'ので', p1: '接続助詞' }], { group: 'reason', ex: '雨なので家にいます。' }),
  P('noni', 'N4', '〜のに', 'Even though … (unexpected or frustrating result).', '逆接・不満。', [{ alt: [[{ s: 'のに', p1: '接続助詞' }], [{ pos: '助動詞', ctype: ['特殊・タ', '特殊・ナイ', '特殊・ダ'] }, { s: 'の', p1: '非自立' }, { s: 'に', p1: '格助詞' }, { not: { pos: '動詞', b: ['使う', 'なる', 'する'] } }]] }], { group: 'reason', ex: '約束したのに来なかった。' }),
  P('kedo', 'N5', '〜けど／が', 'But / although (or a soft lead-in).', '逆接・前置き。', [{ s: ['けど', 'けれど', 'けれども', 'が'], p1: '接続助詞' }], { group: 'reason', ex: '高いけど買いたい。' }),
  P('shi', 'N4', '〜し', 'And also … (listing reasons).', '理由の列挙。', [{ s: 'し', p1: '接続助詞' }], { group: 'reason', ex: '安いし近いし便利だ。' }),

  // --- Appearance, hearsay, probability ---------------------------------------------------
  P('sou-appearance', 'N4', '〜そう（様態）', 'Looks like / seems about to (from what you can see).', '見た様子からの判断。', [{ s: 'そう', pos: '名詞', p1: '接尾' }], { group: 'evidential', ex: '雨が降りそうだ。' }),
  P('sou-hearsay', 'N4', '〜そうだ（伝聞）', 'I heard that … / they say …', '伝聞。', [{ s: 'そう', pos: '名詞', p1: '特殊' }, COPULA], { group: 'evidential', ex: '明日は雨が降るそうだ。' }),
  P('you-da', 'N4', '〜ようだ', 'It seems that … (judging from evidence).', '根拠のある推量。', [{ s: 'よう', p1: '非自立' }, { b: ['だ', 'です'], not: { cform: '連用形' } }], { group: 'evidential', ex: '誰か来たようだ。' }),
  P('mitai', 'N4', '〜みたい', 'Seems like / looks like (casual); also "like a …".', '推量・比喩（話し言葉）。', [{ s: 'みたい' }], { group: 'evidential', ex: '夢みたいな話だ。' }),
  P('rashii', 'N4', '〜らしい', 'Apparently / I hear (from indirect evidence); also "typical of".', '伝聞・推量、典型。', [{ b: 'らしい' }], { group: 'evidential', ex: '彼は来ないらしい。' }),
  P('hazu', 'N4', '〜はず', 'Should be / is expected to (logical expectation).', '当然の推量。', [{ s: 'はず' }], { group: 'evidential', ex: '荷物は明日届くはずだ。' }),
  P('kamoshirenai', 'N4', '〜かもしれない', 'Might / maybe.', '可能性。', [{ s: 'かも' }, { b: ['しれる', '知れる'] }, ...NEG_ANY], { group: 'evidential', ex: '明日は雪が降るかもしれない。' }),
  P('deshou', 'N5', '〜でしょう／だろう', 'Probably … / … right?', '推量・確認。', [{ b: ['です', 'だ'], cform: /^未然/ }, { s: 'う' }], { group: 'evidential', ex: '明日は晴れるでしょう。' }),
  P('n-desu', 'N5', '〜んです／のだ', 'Explaining or asking for an explanation (the background is…).', '説明・事情の確認。', [{ s: ['ん', 'の'], pos: '名詞', p1: '非自立' }, { b: ['だ', 'です'] }], { group: 'evidential', ex: 'どこに行くんですか。' }),
  P('wake', 'N3', '〜わけだ', 'That is why / no wonder (a logical conclusion).', '当然の結論。', [{ s: 'わけ' }, { ...COPULA, cform: /基本形/ }], { group: 'evidential', ex: 'だから安いわけだ。' }),
  P('wake-dewa-nai', 'N3', '〜わけではない', 'It is not (necessarily) that …', '部分否定。', [{ s: 'わけ' }, { s: ['で', 'じゃ'] }, { s: 'は', opt: true }, NEG], { group: 'evidential', ex: '嫌いなわけではない。' }),

  // --- Ease, degree, compound verbs --------------------------------------------------------
  P('yasui', 'N4', '〜やすい', 'Easy to do.', '〜するのが簡単。', [STEM, { b: 'やすい' }], { group: 'degree', ex: 'このペンは書きやすい。' }),
  P('nikui', 'N4', '〜にくい', 'Hard to do.', '〜するのが難しい。', [STEM, { b: ['にくい', 'づらい'] }], { group: 'degree', ex: 'この漢字は覚えにくい。' }),
  P('sugiru', 'N4', '〜すぎる', 'Too much / excessively.', '程度が過ぎる。', [{ b: ['すぎる', '過ぎる'], pos: '動詞' }], { group: 'degree', ex: '昨日は食べすぎた。' }),
  P('hajimeru', 'N4', '〜始める／出す／終わる', 'Compound verb: start / burst out / finish doing.', '複合動詞（開始・終了）。', [STEM, { b: ['始める', 'はじめる', '出す', '終わる', '終える', '続ける'] }], { group: 'degree', ex: '雨が降り始めた。' }),

  // --- Comparison & limits -----------------------------------------------------------------
  P('yori', 'N5', '〜より', 'Than … (comparison).', '比較の基準。', [{ s: 'より', pos: '助詞' }], { group: 'limits', ex: '東京は大阪より大きい。' }),
  P('dake', 'N5', '〜だけ', 'Only / just.', '限定。', [{ s: 'だけ', pos: '助詞' }], { group: 'limits', ex: '水だけ飲んだ。' }),
  P('shika-nai', 'N4', '〜しか〜ない', 'Nothing but / only (with a negative verb).', '限定（否定と呼応）。', [{ s: 'しか', pos: '助詞' }], { group: 'limits', ex: '百円しかない。' }),
  P('bakari', 'N3', '〜ばかり', 'Nothing but / always doing; after た: just did.', '限定・直後。', [{ s: 'ばかり', pos: '助詞' }], { group: 'limits', ex: '弟はゲームばかりしている。' }),

  // --- Quoting & naming -----------------------------------------------------------------------
  P('to-iu', 'N4', '〜という', 'Called … / that says … (quoting or naming).', '名称・内容の引用。', [{ alt: [[{ s: ['と', 'って'], pos: '助詞' }, { b: ['いう', '言う'] }], [{ s: ['という', 'っていう', 'といった', 'といって'] }]] }], { group: 'quote', ex: '山田という人が来た。' }),
  P('to-omou', 'N4', '〜と思う', 'I think that …', '考えの引用。', [{ s: ['と', 'って'], pos: '助詞' }, { b: ['思う', 'おもう', '考える'] }], { group: 'quote', generic: true, ex: '明日は晴れると思う。' }),

  // --- Fixed phrases (one token in IPADIC) -----------------------------------------------------
  P('ni-tsuite', 'N4', '〜について', 'About / concerning.', '〜に関して。', [{ s: 'について' }], { group: 'phrases', ex: '日本の歴史について調べた。' }),
  P('ni-yotte', 'N3', '〜によって', 'By (agent of a passive) / depending on / by means of.', '動作主・手段・依存。', [{ s: ['によって', 'により', 'による'] }], { group: 'phrases', ex: 'この絵はピカソによって描かれた。' }),
  P('to-shite', 'N3', '〜として', 'As (a role or capacity).', '資格・立場。', [{ s: 'として' }], { group: 'phrases', ex: '通訳として働いている。' }),
  P('ni-totte', 'N3', '〜にとって', 'For (from the point of view of).', '〜の立場から見ると。', [{ s: 'にとって' }], { group: 'phrases', ex: '私にとって大切な人だ。' }),
  P('ni-taishite', 'N3', '〜に対して', 'Toward / against / in contrast to.', '対象・対比。', [{ s: ['に対して', 'に対し', 'に対する'] }], { group: 'phrases', ex: '質問に対して答えた。' }),

  // --- Voice --------------------------------------------------------------------------------------
  P('causative-passive', 'N3', '使役受身（させられる）', 'Be made to do (against your will).', '強制されて〜する。', [{ b: ['させる', 'せる'], p1: '接尾' }, { b: ['られる', 'れる'], p1: '接尾' }], { group: 'voice', ex: '子供に野菜を食べさせられた。' }),
  P('causative', 'N4', '使役（させる）', 'Make / let someone do.', '他者に〜させる。', [{ b: ['させる', 'せる'], p1: '接尾' }], { group: 'voice', generic: true, ex: '子供に野菜を食べさせた。' }),
  P('passive', 'N4', '受身（られる）', 'Passive: be done to (also potential / honorific with られる).', '受身（可能・尊敬も同形）。', [{ b: ['られる', 'れる'], p1: '接尾' }], { group: 'voice', generic: true, ex: '先生に褒められた。' }),

  // --- Keigo ---------------------------------------------------------------------------------------
  P('o-kudasai', 'N4', 'お〜ください', 'Please (very polite request).', '尊敬語の依頼。', [{ s: /^[おご]/, pos: '名詞' }, { b: 'くださる' }], { group: 'keigo', ex: '少々お待ちください。' }),
  P('o-ni-naru', 'N3', 'お〜になる', 'Honorific: someone (respected) does.', '尊敬語。', [{ s: ['お', 'ご'], pos: '接頭詞' }, { pos: ['動詞', '名詞'] }, { s: 'に' }, { b: 'なる' }], { group: 'keigo', ex: '先生がお帰りになった。' }),
  P('o-suru', 'N3', 'お〜する', 'Humble: I do (for you).', '謙譲語。', [{ s: ['お', 'ご'], pos: '接頭詞' }, { pos: ['動詞', '名詞'] }, { b: ['する', 'いたす', '致す'] }], { group: 'keigo', ex: '荷物をお持ちします。' }),
  P('sonkeigo', 'N3', '尊敬語の動詞', 'Honorific verb: raises the person doing the action (いらっしゃる, おっしゃる, 召し上がる…).', '相手や話題の人を高める動詞。', [{ b: ['いらっしゃる', 'おっしゃる', '召し上がる', 'めしあがる', 'なさる', 'ご覧になる', 'くださる'], p1: '自立' }], { group: 'keigo', ex: '社長がいらっしゃった。' }),
  P('kenjougo', 'N3', '謙譲語の動詞', 'Humble verb: lowers yourself (参る, 申す, いただく, 伺う…).', '自分を低めて相手を高める動詞。', [{ b: ['参る', 'まいる', '申す', 'もうす', '申し上げる', 'いただく', '伺う', 'うかがう', '拝見', 'いたす', '致す', '存じる', 'おる'], p1: '自立' }], { group: 'keigo', ex: '明日伺います。' }),
];

export const GROUPS = [
  { id: 'aspect', ja: 'て形・アスペクト', en: 'te-form & aspect' },
  { id: 'intent', ja: '希望・意志', en: 'Wanting & intending' },
  { id: 'modality', ja: '可能・義務・許可', en: 'Ability, obligation, permission' },
  { id: 'condition', ja: '条件・時', en: 'Conditions & time' },
  { id: 'reason', ja: '理由・逆接', en: 'Reasons & contrast' },
  { id: 'evidential', ja: '様態・伝聞・推量', en: 'Appearance, hearsay, probability' },
  { id: 'degree', ja: '程度・複合動詞', en: 'Ease, degree, compound verbs' },
  { id: 'limits', ja: '比較・限定', en: 'Comparison & limits' },
  { id: 'quote', ja: '引用', en: 'Quoting' },
  { id: 'phrases', ja: '複合助詞', en: 'Compound particles' },
  { id: 'voice', ja: '使役・受身', en: 'Causative & passive' },
  { id: 'keigo', ja: '敬語', en: 'Keigo (honorific speech)' },
];

export const PATTERN_BY_ID = new Map(PATTERNS.map((p) => [p.id, p]));
export const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];

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
  // A lookahead-only step: `not` alone tests the next token without consuming it.
  if (Object.keys(step).length === 1 && step.not) {
    return tokenMatches(tokens[i], step.not) ? -1 : matchSteps(tokens, i, rest);
  }
  if (tokenMatches(tokens[i], step)) {
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
      const end = matchSteps(tokens, i, p.steps);
      if (end > i) {
        found.push({ id: p.id, start: i, end });
        i = end - 1;
      }
    }
  }
  // Hide generic matches covered by a longer, more specific one.
  const kept = found.filter((m) => {
    if (!PATTERN_BY_ID.get(m.id).generic) return true;
    return !found.some((o) => o !== m && o.start <= m.start && o.end >= m.end && o.end - o.start > m.end - m.start);
  });
  return kept.sort((a, b) => a.start - b.start || b.end - a.end);
}
