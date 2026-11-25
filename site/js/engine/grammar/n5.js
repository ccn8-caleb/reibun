// JLPT N5 grammar.

import { TE, NEG, NEG_ANY, PAST, STEM, GOOD, GAP, P } from './common.js';

const Q_WORDS = ['何', 'なに', 'なん', '誰', 'だれ', 'どこ', 'いつ', 'どれ', 'どの', 'どちら', 'どっち', 'いくら', 'いくつ', 'どう', 'どうして', 'なぜ', 'どんな', 'どなた', 'どうやって'];
const NA_ADJ = { pos: '名詞', p1: '形容動詞語幹' };

export default [
  // --- Basic forms ---------------------------------------------------------------------
  P('desu-da', 'N5', '〜です／だ', 'The copula: "is / am / are" (です polite, だ plain).', '断定（丁寧形・普通形）。', [{ alt: [[{ pos: '助動詞', ctype: '特殊・デス' }], [{ pos: '助動詞', ctype: '特殊・ダ', cform: ['基本形', '連用タ接続'] }]] }], { group: 'basics', quiet: true, ex: '私は学生です。' }),
  P('masu', 'N5', '〜ます', 'Polite verb ending (ます, ました, ません…).', '動詞の丁寧形。', [{ pos: '助動詞', ctype: '特殊・マス' }], { group: 'basics', quiet: true, ex: '毎日勉強します。' }),
  P('masen-deshita', 'N5', '〜ませんでした', 'Polite past negative: did not.', '丁寧形の過去否定。', [{ ctype: '特殊・マス', cform: '未然形' }, { b: 'ん' }, { b: 'です' }, PAST], { group: 'basics', quiet: true, ex: '昨日は行きませんでした。' }),
  P('nai', 'N5', '〜ない（否定）', 'Plain negative: does not / is not.', '普通形の否定。', [{ pos: '助動詞', ctype: '特殊・ナイ' }], { group: 'basics', quiet: true, generic: true, ex: '肉は食べない。' }),
  P('ta-past', 'N5', '〜た（過去）', 'Plain past: did / was.', '普通形の過去。', [{ ...PAST, not: { cform: '仮定形' } }], { group: 'basics', quiet: true, generic: true, ex: '昨日映画を見た。' }),
  P('ja-nai', 'N5', '〜じゃない／ではありません', 'Is not (negative of a noun or な-adjective).', '名詞・な形容詞の否定。', [{ alt: [[{ s: 'じゃ', pos: '助詞' }], [{ s: 'で', pos: '助詞' }, { s: 'は' }]] }, { alt: [[{ b: 'ない' }], [{ b: 'ある' }, { ctype: '特殊・マス' }, { b: 'ん' }]] }], { group: 'basics', ex: '私は先生じゃありません。' }),
  P('i-adj-past', 'N5', '〜かった（い形容詞）', 'Past of an い-adjective: was …', 'い形容詞の過去形。', [{ pos: '形容詞', cform: '連用タ接続' }, PAST], { group: 'basics', quiet: true, ex: '昨日は寒かった。' }),
  P('i-adj-neg', 'N5', '〜くない（い形容詞）', 'Negative of an い-adjective: is not …', 'い形容詞の否定形。', [{ pos: '形容詞', cform: '連用テ接続' }, { b: 'ない' }], { group: 'basics', quiet: true, ex: 'この部屋は広くない。' }),
  P('na-adj', 'N5', '〜な（な形容詞）', 'A な-adjective before a noun: 静かな部屋 "a quiet room".', 'な形容詞の連体形。', [NA_ADJ, { s: 'な', ctype: '特殊・ダ' }], { group: 'basics', quiet: true, ex: '静かな部屋が好きです。' }),
  P('adj-te', 'N5', '〜くて／〜で（形容詞）', 'Joining adjectives: …and… (安くておいしい, 静かできれい).', '形容詞のて形（並列・理由）。', [{ alt: [[{ pos: '形容詞', cform: '連用テ接続' }, { s: 'て', pos: '助詞' }], [NA_ADJ, { s: 'で', ctype: '特殊・ダ' }]] }], { group: 'basics', ex: 'この店は安くておいしい。' }),
  P('adverbial', 'N5', '〜く／〜に（副詞的）', 'An adjective describing a verb: 早く起きる, 静かに話す.', '形容詞の副詞的用法。', [{ alt: [[{ pos: '形容詞', cform: '連用テ接続' }, { pos: '動詞', p1: '自立', not: { b: ['なる', 'する', 'ある'] } }], [NA_ADJ, { s: 'に', p1: '副詞化' }]] }], { group: 'basics', ex: '図書館では静かに話してください。' }),
  P('naru-change', 'N5', '〜くなる／〜になる', 'Become …: a change of state.', '状態の変化。', [{ alt: [[{ pos: '形容詞', cform: '連用テ接続' }], [{ pos: '名詞', not: { s: ['こと', 'よう', 'の'] } }, { s: 'に', pos: '助詞' }]] }, { b: 'なる', pos: '動詞' }], { group: 'basics', generic: true, ex: '急に寒くなった。' }),
  P('te-form', 'N5', '〜て（て形）', 'Joins actions in order: …and then… (also the base of many patterns).', '動作の継起・並列。', [{ pos: '動詞' }, TE], { group: 'basics', quiet: true, generic: true, ex: '朝起きて、顔を洗う。' }),
  P('question-words', 'N5', '疑問詞', 'Question words: 何, 誰, どこ, いつ, どれ, どう, どうして…', '疑問を表す語。', [{ s: Q_WORDS }], { group: 'basics', quiet: true, ex: 'あの人は誰ですか。' }),
  P('kosoado', 'N5', 'こそあど', 'This / that / that over there: これ・それ・あれ, この・その・あの, ここ・そこ・あそこ…', '指示語。', [{ s: ['これ', 'それ', 'あれ', 'この', 'その', 'あの', 'ここ', 'そこ', 'あそこ', 'こちら', 'そちら', 'あちら', 'こっち', 'そっち', 'あっち', 'こんな', 'そんな', 'あんな', 'こう', 'そう', 'ああ'], not: { p1: ['特殊', '接尾'] } }], { group: 'basics', quiet: true, ex: 'これは私の本です。' }),
  P('indefinite', 'N5', '何か／誰か／どこか', 'Something / someone / somewhere (question word + か).', '不定（疑問詞＋か）。', [{ s: ['何', 'なに', '誰', 'だれ', 'どこ', 'いつ', 'どれ', 'どちら'] }, { s: 'か', pos: '助詞' }, { not: { s: ['。', '？'] } }], { group: 'basics', ex: '何か飲みますか。' }),
  P('mo-negative', 'N5', '何も〜ない', 'Nothing / nobody / nowhere (question word + も + negative).', '全面否定（疑問詞＋も＋否定）。', [{ s: ['何', 'なに', '誰', 'だれ', 'どこ', 'どれ'] }, { s: ['も', 'にも', 'へも'], pos: '助詞' }, GAP(4), ...NEG_ANY], { group: 'basics', ex: '朝から何も食べていない。' }),

  // --- Particles -----------------------------------------------------------------------
  P('wa-topic', 'N5', '〜は（主題）', 'Topic marker: as for …', '主題を示す。', [{ s: 'は', p1: '係助詞' }], { group: 'particles', quiet: true, generic: true, ex: '私は学生です。' }),
  P('ga-subject', 'N5', '〜が（主語）', 'Subject marker (who / what does it, or what is new).', '主語を示す。', [{ s: 'が', p1: '格助詞' }], { group: 'particles', quiet: true, generic: true, ex: '雨が降っている。' }),
  P('wo-object', 'N5', '〜を', 'Object marker; also the place you move through (公園を歩く).', '目的語・通過点を示す。', [{ s: 'を', p1: '格助詞' }], { group: 'particles', quiet: true, generic: true, ex: '毎朝コーヒーを飲む。' }),
  P('ni-particle', 'N5', '〜に', 'Time, destination, location of existence, or target (person).', '時・到着点・存在の場所・相手。', [{ s: 'に', p1: '格助詞' }], { group: 'particles', quiet: true, generic: true, ex: '七時に起きる。' }),
  P('de-particle', 'N5', '〜で', 'Place of an action, or means (バスで, 日本語で).', '動作の場所・手段。', [{ s: 'で', p1: '格助詞' }], { group: 'particles', quiet: true, generic: true, ex: 'バスで学校に行く。' }),
  P('he-particle', 'N5', '〜へ', 'Direction: toward …', '方向を示す。', [{ s: 'へ', p1: '格助詞' }], { group: 'particles', quiet: true, ex: '来週、京都へ行きます。' }),
  P('to-and', 'N5', '〜と（並列・相手）', 'And (a complete list), or with (a person).', '並列・共同の相手。', [{ s: 'と', p1: ['並立助詞', '格助詞'] }, { not: { b: ['言う', 'いう', '思う', 'おもう', '考える', 'する', 'なる'] } }], { group: 'particles', quiet: true, generic: true, ex: '友達と映画を見た。' }),
  P('mo-also', 'N5', '〜も', 'Also / too (replaces は, が, を).', '同類・追加。', [{ s: 'も', p1: '係助詞' }], { group: 'particles', quiet: true, generic: true, ex: '私も学生です。' }),
  P('no-possessive', 'N5', '〜の（所有・修飾）', "Of / 's: links a noun to a noun (私の本).", '名詞と名詞をつなぐ。', [{ s: 'の', p1: '連体化' }], { group: 'particles', quiet: true, generic: true, ex: 'これは私の本です。' }),
  P('ka-question', 'N5', '〜か（疑問）', 'Question marker at the end of a sentence.', '疑問を示す終助詞。', [{ s: 'か', pos: '助詞' }, { not: { pos: ['名詞', '動詞', '形容詞', '助詞', '助動詞', '副詞'] } }], { group: 'particles', quiet: true, ex: 'これは何ですか。' }),
  P('ya-and', 'N5', '〜や', 'And (an incomplete list: A, B and so on).', '例示的な並列。', [{ s: 'や', p1: '並立助詞' }], { group: 'particles', quiet: true, ex: 'ペンやノートを買った。' }),
  P('yo-ne', 'N5', '〜よ／〜ね', 'Sentence-final よ (telling you something) and ね (seeking agreement).', '終助詞（よ：主張、ね：同意・確認）。', [{ s: ['よ', 'ね', 'よね', 'ねえ', 'わ'], p1: '終助詞' }], { group: 'particles', quiet: true, ex: 'いい天気ですね。' }),
  P('kara-made', 'N5', '〜から〜まで', 'From … to / until …', '起点と終点。', [{ s: 'から', p1: '格助詞' }, GAP(4), { s: 'まで', pos: '助詞' }, { not: { s: 'に' } }], { group: 'particles', ex: '九時から五時まで働く。' }),
  P('kara-from', 'N5', '〜から（起点）', 'From (a starting point in place or time).', '起点。', [{ s: 'から', p1: '格助詞' }], { group: 'particles', quiet: true, generic: true, ex: '駅から歩いて来た。' }),
  P('made', 'N5', '〜まで', 'Until / up to / as far as.', '終点・限度。', [{ s: 'まで', pos: '助詞' }, { not: { s: 'に' } }], { group: 'particles', quiet: true, generic: true, ex: '駅まで歩いた。' }),
  P('gurai', 'N5', '〜ぐらい／くらい', 'About (an amount); also "to the extent of".', 'おおよその量・程度。', [{ s: ['ぐらい', 'くらい'], pos: '助詞' }], { group: 'particles', ex: '駅まで十分ぐらいかかる。' }),
  P('goro', 'N5', '〜ごろ', 'Around (a point in time).', 'おおよその時刻。', [{ s: ['ごろ', '頃'], p1: '接尾' }], { group: 'particles', ex: '三時ごろ行きます。' }),
  P('nado', 'N5', '〜など', 'And so on / things like …', '例示。', [{ s: ['など', 'なんか'], pos: '助詞' }], { group: 'particles', ex: 'ペンやノートなどを買った。' }),
  P('tachi', 'N5', '〜たち', 'Plural suffix for people (私たち, 学生たち).', '人の複数。', [{ s: ['たち', '達'], p1: '接尾' }], { group: 'particles', ex: '学生たちが教室に入ってきた。' }),

  // --- te-form & aspect ------------------------------------------------------------------
  P('te-iru', 'N5', '〜ている', 'Ongoing action, or the state left by a change (住んでいる "live", 結婚している "is married").', '動作の進行、または変化の結果の状態。', [TE, { b: 'いる', p1: '非自立' }], { group: 'aspect', ex: '雨が降っている。' }),
  P('mada-te-inai', 'N5', 'まだ〜ていない', 'Have not … yet.', 'まだ完了していない。', [{ s: 'まだ', pos: '副詞' }, GAP(4), TE, { b: 'いる', p1: '非自立' }, ...NEG_ANY], { group: 'aspect', ex: '宿題はまだ終わっていない。' }),
  P('mou-ta', 'N5', 'もう〜た', 'Already (did).', 'すでに完了した。', [{ s: 'もう', pos: '副詞' }, GAP(6), PAST], { group: 'aspect', ex: 'もう昼ご飯を食べました。' }),
  P('te-kudasai', 'N5', '〜てください', 'Please do (a polite request).', '丁寧な依頼。', [TE, { b: 'くださる', cform: '命令ｉ' }], { group: 'aspect', generic: true, ex: 'ここに名前を書いてください。' }),
  P('naide-kudasai', 'N5', '〜ないでください', 'Please do not …', '丁寧な禁止の依頼。', [{ s: 'ない', ctype: '特殊・ナイ' }, { s: 'で', pos: '助詞' }, { b: 'くださる', cform: '命令ｉ' }], { group: 'aspect', ex: 'ここで写真を撮らないでください。' }),
  P('wo-kudasai', 'N5', '〜をください', 'Please give me … (asking for a thing).', '物を頼む。', [{ s: 'を', pos: '助詞' }, GAP(2), { b: 'くださる', p1: '自立', cform: '命令ｉ' }], { group: 'aspect', ex: 'コーヒーを二つください。' }),
  P('te-mo-ii', 'N5', '〜てもいい', 'Permission: it is OK to …', '許可。', [TE, { s: 'も' }, GOOD], { group: 'aspect', generic: true, ex: '写真を撮ってもいいです。' }),
  P('te-wa-ikenai', 'N5', '〜てはいけない', 'Prohibition: must not …', '禁止。', [{ s: ['て', 'で', 'ちゃ', 'じゃ'], pos: '助詞' }, { s: 'は', opt: true }, { b: ['いける', 'なる', 'だめ', 'ダメ'] }, ...NEG_ANY], { group: 'aspect', generic: true, ex: 'ここで写真を撮ってはいけない。' }),

  // --- Giving & receiving --------------------------------------------------------------------
  P('giving-verbs', 'N5', 'あげる・もらう・くれる', 'Giving and receiving: give (あげる), receive (もらう), give to me (くれる).', '物のやりもらい。', [{ b: ['あげる', 'もらう', 'くれる', 'やる', 'さしあげる', '差し上げる', 'いただく', 'くださる'], pos: '動詞', p1: '自立', not: { b: 'くださる', cform: '命令ｉ' } }], { group: 'giving', ex: '友達に本をもらった。' }),

  // --- Wanting, intending, purpose ------------------------------------------------------------
  P('tai', 'N5', '〜たい', 'Want to do (your own desire).', '話し手の希望。', [{ ctype: '特殊・タイ' }], { group: 'intent', generic: true, ex: '水が飲みたい。' }),
  P('ga-hoshii', 'N5', '〜がほしい', 'Want (a thing).', '物を欲しがる（話し手）。', [{ s: 'が', pos: '助詞' }, { b: ['ほしい', '欲しい'], p1: '自立' }], { group: 'intent', ex: '新しいパソコンがほしい。' }),
  P('mashou', 'N5', '〜ましょう', "Let's …, or offering: I'll …", '勧誘・申し出。', [{ ctype: '特殊・マス', cform: '未然ウ接続' }, { s: 'う' }], { group: 'intent', generic: true, ex: '一緒に行きましょう。' }),
  P('mashou-ka', 'N5', '〜ましょうか', "Shall I …? / Shall we …? (an offer or suggestion).", '申し出・提案。', [{ ctype: '特殊・マス', cform: '未然ウ接続' }, { s: 'う' }, { s: 'か' }], { group: 'intent', ex: '荷物を持ちましょうか。' }),
  P('masen-ka', 'N5', '〜ませんか', "Invitation: won't you …? / shall we …?", '勧誘。', [{ ctype: '特殊・マス', cform: '未然形' }, { b: 'ん' }, { s: 'か' }], { group: 'intent', generic: true, ex: '映画を見に行きませんか。' }),
  P('tsumori', 'N5', '〜つもり', 'Intend to / plan to.', '意図・予定。', [{ s: 'つもり' }], { group: 'intent', ex: '明日行くつもりです。' }),
  P('ni-iku', 'N5', '〜に行く／来る', 'Go / come (somewhere) in order to do.', '移動の目的。', [STEM, { s: 'に', pos: '助詞' }, { b: ['行く', '来る', 'いく', 'くる', '帰る', '戻る', '出かける'] }], { group: 'intent', ex: '本を借りに行った。' }),
  P('ni-suru', 'N5', '〜にする', 'Decide on / choose (コーヒーにする).', '選択・決定。', [{ pos: '名詞', p1: ['一般', '固有名詞', '代名詞', 'サ変接続', '副詞可能'], not: { s: ['こと', 'よう', 'の', 'ん'] } }, { s: 'に', p1: '格助詞' }, { b: 'する', pos: '動詞' }], { group: 'intent', generic: true, ex: '私はコーヒーにします。' }),
  P('dou-desu-ka', 'N5', '〜はどうですか', 'How is …? / How about …? (asking or suggesting).', '様子を尋ねる・提案する。', [{ s: ['どう', 'いかが'] }, { b: ['です', 'でしょう'], pos: '助動詞' }, { s: 'か', opt: true }], { group: 'intent', generic: true, ex: '日本の生活はどうですか。' }),

  // --- Ability, obligation, permission -------------------------------------------------------
  P('hou-ga-ii', 'N5', '〜ほうがいい', 'Had better / should (advice).', '助言。', [{ s: ['方', 'ほう'] }, { s: 'が' }, GOOD], { group: 'modality', ex: '早く寝たほうがいい。' }),
  P('suki-kirai', 'N5', '〜が好き／嫌い／上手／下手', 'Like / dislike / be good at / be bad at (with が).', '好き嫌い・得手不得手（が）。', [{ s: 'が', pos: '助詞' }, { s: ['好き', '嫌い', '上手', '下手', '得意', '苦手', 'すき', 'きらい', '大好き', '大嫌い'] }], { group: 'modality', ex: '妹は絵が上手です。' }),
  P('ga-aru', 'N5', '〜がある／いる', 'There is / exists (ある for things, いる for people and animals).', '存在（ある：物、いる：人・動物）。', [{ s: 'が', pos: '助詞' }, { b: ['ある', 'いる'], pos: '動詞', p1: '自立' }], { group: 'modality', generic: true, ex: '机の上に本があります。' }),
  P('kata', 'N5', '〜方（かた）', 'The way of doing: 書き方 "how to write".', 'やり方・方法。', [{ alt: [[{ s: /[いきぎしじちにひびみりえけげせぜてでねべめれ]方$/, pos: '名詞' }], [STEM, { s: '方', p1: '接尾' }]] }], { group: 'modality', ex: '漢字の書き方を教えてください。' }),

  // --- Time ----------------------------------------------------------------------------------
  P('te-kara', 'N5', '〜てから', 'After doing, then …', '〜した後で。', [TE, { s: 'から', pos: '助詞' }], { group: 'time', generic: true, ex: 'ご飯を食べてから出かけます。' }),
  P('mae-ni', 'N5', '〜前に', 'Before doing.', '〜する前。', [{ pos: '動詞', cform: '基本形', opt: true }, { s: ['前', 'まえ'] }, { s: 'に' }], { group: 'time', ex: '寝る前に歯を磨く。' }),
  P('ato-de', 'N5', '〜後で', 'After doing.', '〜した後。', [{ s: ['後', 'あと'] }, { s: 'で' }], { group: 'time', ex: '授業の後で図書館に行った。' }),
  P('toki', 'N5', '〜時', 'When … (at the time of).', '〜する／した時。', [{ s: ['時', 'とき'], pos: '名詞', p1: ['非自立', '副詞可能', '一般'] }], { group: 'time', ex: '子供の時、よく泳いだ。' }),

  // --- Reasons & contrast -------------------------------------------------------------------
  P('kara-reason', 'N5', '〜から（理由）', 'Because … (speaker’s reason; can be subjective).', '理由。', [{ s: 'から', p1: '接続助詞' }], { group: 'reason', ex: '暑いから窓を開けた。' }),
  P('kedo', 'N5', '〜けど／が', 'But / although (or a soft lead-in).', '逆接・前置き。', [{ s: ['けど', 'けれど', 'けれども', 'が'], p1: '接続助詞' }], { group: 'contrast', ex: '高いけど買いたい。' }),

  // --- Appearance, hearsay, probability ------------------------------------------------------
  P('deshou', 'N5', '〜でしょう／だろう', 'Probably … / … right?', '推量・確認。', [{ b: ['です', 'だ'], cform: /^未然/ }, { s: 'う' }], { group: 'evidential', ex: '明日は晴れるでしょう。' }),
  P('n-desu', 'N5', '〜んです／のだ', 'Explaining or asking for an explanation (the background is…).', '説明・事情の確認。', [{ s: ['ん', 'の'], pos: '名詞', p1: '非自立' }, { b: ['だ', 'です'] }], { group: 'evidential', generic: true, ex: 'どこに行くんですか。' }),

  // --- Comparison, limits, scope -------------------------------------------------------------
  P('yori', 'N5', '〜より', 'Than … (comparison).', '比較の基準。', [{ s: 'より', pos: '助詞' }], { group: 'limits', generic: true, ex: '東京は大阪より大きい。' }),
  P('no-hou-ga', 'N5', '〜のほうが', 'A is more … (the side that wins a comparison).', '比較で勝る方。', [{ s: 'の', p1: '連体化' }, { s: ['ほう', '方'] }, { s: 'が' }], { group: 'limits', ex: 'バスより電車のほうが速い。' }),
  P('dochira-ga', 'N5', '〜と〜とどちらが', 'Which (of two) is more …?', '二つの比較の質問。', [{ s: ['どちら', 'どっち'] }, { s: ['が', 'の'], pos: '助詞' }], { group: 'limits', ex: '肉と魚とどちらが好きですか。' }),
  P('ichiban', 'N5', '〜の中で〜が一番', 'The most … (among a group).', '最上級。', [{ alt: [[{ s: 'の' }, { s: '中' }, { s: 'で' }, GAP(3), { s: ['一番', 'いちばん'] }], [{ s: ['一番', 'いちばん'], p1: '副詞可能' }]] }], { group: 'limits', ex: '果物の中でりんごが一番好きです。' }),
  P('amari-nai', 'N5', 'あまり〜ない', 'Not very / not much.', '程度が低い（否定と呼応）。', [{ s: ['あまり', 'あんまり'], pos: '副詞' }, GAP(4), ...NEG_ANY], { group: 'limits', ex: 'この映画はあまり面白くない。' }),
  P('zenzen-nai', 'N5', '全然〜ない', 'Not at all.', '全面的な否定。', [{ s: ['全然', 'ぜんぜん'] }, GAP(4), ...NEG_ANY], { group: 'limits', ex: 'フランス語は全然分からない。' }),
  P('dake', 'N5', '〜だけ', 'Only / just.', '限定。', [{ s: 'だけ', pos: '助詞' }], { group: 'limits', generic: true, ex: '水だけ飲んだ。' }),
];
