// JLPT N4 grammar.

import { TE, NEG_ANY, PAST, DICT, STEM, COPULA, GOOD, T, GAP, P } from './common.js';

const NA_ADJ = { pos: '名詞', p1: '形容動詞語幹' };
const PLAIN = { pos: ['動詞', '形容詞', '助動詞'], cform: '基本形' };

export default [
  // --- Basic forms ---------------------------------------------------------------------
  P('volitional', 'N4', '〜（よ）う（意向形）', "Plain volitional: let's … / I'll … (行こう, 食べよう).", '意志・勧誘（普通形）。', [{ pos: '動詞', cform: /^未然/ }, { s: ['う', 'よう'], pos: '助動詞' }], { group: 'basics', generic: true, ex: 'そろそろ帰ろう。' }),
  P('imperative', 'N4', '命令形', 'Plain command: do it! (起きろ, 行け) — blunt.', '命令（ぶっきらぼう）。', [{ pos: '動詞', p1: '自立', cform: /^命令/, not: { b: ['くださる', 'なさる', 'いらっしゃる'] } }], { group: 'basics', ex: '早く起きろ。' }),
  P('prohibitive-na', 'N4', '〜な（禁止）', "Don't! (dictionary form + な) — blunt.", '禁止（強い）。', [{ pos: '動詞', cform: '基本形' }, { s: 'な', p1: '終助詞' }], { group: 'basics', ex: 'ここで泳ぐな。' }),
  P('nasai', 'N4', '〜なさい', 'Do … (a command from a parent or teacher).', '目上から目下への指示。', [{ b: 'なさる', p1: '非自立', cform: /^命令/ }], { group: 'basics', ex: '早く寝なさい。' }),
  P('sa-nominal', 'N4', '〜さ（名詞化）', 'Turns an adjective into a noun of degree: 高さ "height", 静かさ.', '形容詞の名詞化（程度）。', [{ alt: [[{ pos: '形容詞', cform: 'ガル接続' }], [NA_ADJ]] }, { s: 'さ', p1: '接尾' }], { group: 'basics', ex: 'この川の深さは二メートルだ。' }),
  P('nominalizer-no', 'N4', '〜のが／のを／のは', 'Turns a clause into a noun: 読むのが好き "I like reading".', '文を名詞化する「の」。', [PLAIN, { s: 'の', p1: '非自立' }, { s: ['が', 'を', 'は', 'も'], pos: '助詞' }], { group: 'basics', ex: '本を読むのが好きです。' }),
  P('nominalizer-koto', 'N4', '〜こと（名詞化）', 'Turns a clause into a noun: 話すことは難しい "speaking is hard".', '文を名詞化する「こと」。', [PLAIN, { s: 'こと' }, { s: ['が', 'を', 'は', 'も'], pos: '助詞' }], { group: 'basics', generic: true, ex: '日本語を話すことは難しい。' }),
  P('ku-suru', 'N4', '〜くする／〜にする', 'Make something … (change it on purpose).', '意図的な変化。', [{ alt: [[{ pos: '形容詞', cform: '連用テ接続', not: { b: ['ない', '余儀ない', '無い'] } }], [{ ...NA_ADJ, not: { s: ['馬鹿', 'ばか', 'バカ', '粗末', '気', '大事', '大切'] } }, { s: 'に', pos: '助詞' }]] }, { b: 'する', pos: '動詞' }], { group: 'basics', generic: true, ex: '部屋をきれいにした。' }),
  P('chuu', 'N4', '〜中（ちゅう／じゅう）', 'In the middle of (会議中) / throughout (一日中).', '〜している最中、〜の間ずっと。', [{ s: ['中', 'ちゅう', 'じゅう'], p1: '接尾' }], { group: 'basics', ex: '父は今、会議中です。' }),

  // --- Particles -----------------------------------------------------------------------
  P('made-ni', 'N4', '〜までに', 'By (a deadline).', '期限。', [{ s: 'まで', pos: '助詞' }, { s: 'に', pos: '助詞' }], { group: 'particles', ex: '金曜日までにレポートを出してください。' }),
  P('zutsu', 'N4', '〜ずつ', 'Each / at a time (少しずつ "little by little").', '等分・繰り返し。', [{ s: 'ずつ' }], { group: 'particles', ex: '毎日少しずつ練習する。' }),
  P('demo', 'N4', '〜でも', 'Even …, or "… or something" (お茶でも).', '極端な例・軽い例示。', [{ s: 'でも', p1: '副助詞' }], { group: 'particles', generic: true, ex: '日曜日でも仕事がある。' }),
  P('nan-demo', 'N4', '何でも／誰でも／いつでも', 'Anything / anyone / any time.', '全面的な肯定（疑問詞＋でも）。', [{ s: ['何', 'なん', '誰', 'だれ', 'どこ', 'いつ', 'どれ', 'どちら'] }, { s: 'でも' }], { group: 'particles', ex: '弟は何でも食べます。' }),
  P('mo-emphasis', 'N4', '〜も（数量の強調）', 'As many / much as … (more than expected).', '数量が多いことの強調。', [{ alt: [[{ pos: '名詞', p1: '数' }], [{ pos: '名詞', p1: '接尾', p2: '助数詞' }]] }, { s: 'も', p1: '係助詞' }], { group: 'particles', ex: '駅で三時間も待った。' }),
  P('tte', 'N4', '〜って', 'Casual quote or topic: "(they said) …", "as for …".', '引用・話題（話し言葉）。', [{ s: 'って', pos: '助詞' }], { group: 'particles', generic: true, ex: '田中さんって面白い人だね。' }),
  P('kana', 'N4', '〜かな', 'I wonder … (thinking aloud).', '疑問・自問。', [{ s: 'か', pos: '助詞' }, { s: ['な', 'なあ', 'ねえ'], p1: '終助詞' }, { not: { pos: ['名詞', '助動詞', '動詞'] } }, { not: { s: ['の', 'ん'] } }], { group: 'particles', ex: '明日は晴れるかな。' }),

  // --- te-form & aspect ------------------------------------------------------------------
  P('te-aru', 'N4', '〜てある', 'Something has been done (on purpose) and stays that way: 窓が開けてある "the window has been left open".', '意図的な動作の結果が残っている状態。', [TE, { b: 'ある', p1: '非自立' }], { group: 'aspect', ex: '窓が開けてある。' }),
  P('te-shimau', 'N4', '〜てしまう／ちゃう', 'Do completely, or do something regrettable / by accident.', '完了、または残念・後悔の気持ち。', [{ alt: [[TE, { b: 'しまう' }], [{ b: ['ちゃう', 'じゃう'], pos: '動詞' }]] }], { group: 'aspect', ex: '全部食べてしまった。' }),
  P('te-oku', 'N4', '〜ておく／とく', 'Do in advance (to prepare), or leave as is.', '準備のために前もってする／そのままにしておく。', [{ alt: [[TE, { b: 'おく', p1: '非自立' }], [{ b: 'とく', pos: '動詞', not: { s: /^とき/ } }]] }], { group: 'aspect', ex: 'ビールを買っておく。' }),
  P('te-miru', 'N4', '〜てみる', 'Try doing something to see what it is like.', '試しにする。', [TE, { b: 'みる', p1: '非自立' }], { group: 'aspect', ex: '着てみてもいいですか。' }),
  P('te-iku', 'N4', '〜ていく', 'A change continuing from now on, or doing something and then going.', 'これから先へ続く変化、またはしてから行く。', [TE, { b: ['いく', '行く'], p1: '非自立' }], { group: 'aspect', ex: 'これから寒くなっていく。' }),
  P('te-kuru', 'N4', '〜てくる', 'A change up to now, or doing something and coming back.', '今までの変化、またはしてから来る。', [TE, { b: ['くる', '来る'], p1: '非自立' }], { group: 'aspect', ex: 'だんだん暖かくなってきた。' }),
  P('ta-bakari', 'N4', '〜たばかり', 'Have just (done).', '動作の直後。', [PAST, { s: 'ばかり' }], { group: 'aspect', generic: true, ex: '日本に来たばかりです。' }),
  P('naide', 'N4', '〜ないで', 'Without doing / instead of doing.', '〜しない状態で。', [{ s: 'ない', ctype: '特殊・ナイ' }, { s: 'で', p1: '接続助詞' }, { not: { b: ['くださる', 'ほしい', 'いる', 'おく', 'もらう', 'くれる', 'いただく', 'ある', 'しまう'] } }], { group: 'aspect', ex: '傘を持たないで出かけた。' }),
  P('zuni', 'N4', '〜ずに', 'Without doing (more formal than ないで).', '〜しないで（書き言葉的）。', [{ s: 'ず', ctype: '特殊・ヌ' }, { s: 'に', pos: '助詞' }], { group: 'aspect', generic: true, ex: '何も言わずに帰った。' }),
  P('te-mo-kamawanai', 'N4', '〜てもかまわない', "It's fine to … / I don't mind if …", '許可・容認。', [TE, { s: 'も' }, { b: ['かまう', '構う'] }, ...NEG_ANY], { group: 'aspect', ex: 'ここに座ってもかまいません。' }),

  // --- Giving & receiving --------------------------------------------------------------------
  P('te-kureru', 'N4', '〜てくれる', 'Someone does something for me / us (a favour received).', '（他人が）自分のために〜する。', [TE, { b: ['くれる', 'くださる'], p1: '非自立', not: { cform: '命令ｉ' } }], { group: 'giving', generic: true, ex: '友達が手伝ってくれた。' }),
  P('te-morau', 'N4', '〜てもらう', 'Get someone to do something / have it done for you.', '他人に〜してもらう（恩恵を受ける）。', [TE, { b: ['もらう', 'いただく', 'もらえる', 'いただける'], p1: '非自立' }], { group: 'giving', generic: true, ex: '母に作ってもらった。' }),
  P('te-ageru', 'N4', '〜てあげる', 'Do something for someone else.', '他人のために〜する。', [TE, { b: ['あげる', 'さしあげる', 'やる'], p1: '非自立' }], { group: 'giving', ex: '弟に教えてあげた。' }),
  P('te-kuremasen-ka', 'N4', '〜てくれませんか／もらえませんか', 'Could you (please) …? (a polite request).', '丁寧な依頼。', [T(...['くれませんか', 'くれないか', 'くれない？', 'もらえませんか', 'もらえないか', 'もらえない？', 'くださいませんか', 'いただけませんか', 'いただけないでしょうか', 'もらえないでしょうか', 'くれますか', 'もらえますか', 'いただけますか'].flatMap((x) => ['て' + x, 'で' + x]))], { group: 'giving', ex: '窓を開けてくれませんか。' }),
  P('sasete-kudasai', 'N4', '〜させてください', 'Please let me … (asking permission).', '自分の行為の許可を求める。', [{ b: ['させる', 'せる'], p1: '接尾' }, TE, { b: ['くださる', 'もらえる', 'いただける'], p1: '非自立' }], { group: 'giving', ex: '写真を撮らせてください。' }),

  // --- Wanting, intending, purpose ------------------------------------------------------------
  P('te-hoshii', 'N4', '〜てほしい', 'Want someone else to do something.', '他人にしてもらいたい。', [TE, { b: 'ほしい' }], { group: 'intent', ex: 'もっと早く来てほしい。' }),
  P('tagaru', 'N4', '〜たがる', 'Wants to (someone else’s desire, as it appears).', '第三者の希望。', [{ ctype: '特殊・タイ', cform: 'ガル接続' }, { b: 'がる' }], { group: 'intent', ex: '子供は外で遊びたがる。' }),
  P('volitional-to-omou', 'N4', '〜（よ）うと思う', 'Thinking of doing / intend to.', '意志・予定。', [{ pos: '動詞', cform: /^未然/, opt: true }, { b: ['う', 'よう'], pos: '助動詞' }, { s: 'と' }, { b: ['思う', 'おもう', '考える'] }], { group: 'intent', ex: '来年留学しようと思う。' }),
  P('yotei', 'N4', '〜予定', 'Plan to / be scheduled to.', '予定。', [{ alt: [[{ pos: '動詞', cform: '基本形' }], [{ s: 'の', pos: '助詞' }]] }, { s: '予定' }], { group: 'intent', ex: '来週京都に行く予定です。' }),
  P('koto-ni-suru', 'N4', '〜ことにする', 'Decide to do.', '自分で決める。', [{ s: 'こと' }, { s: 'に' }, { b: 'する' }], { group: 'intent', ex: '毎日走ることにした。' }),
  P('koto-ni-naru', 'N4', '〜ことになる', 'It has been decided / it turns out that …', '（自分以外が）決める・結果としてそうなる。', [{ s: 'こと' }, { s: 'に' }, { b: 'なる' }], { group: 'intent', ex: '来月転勤することになった。' }),
  P('you-ni-suru', 'N4', '〜ようにする', 'Make an effort to / make sure to.', '努力・心がけ。', [{ pos: ['動詞', '助動詞'], cform: '基本形' }, { s: 'よう', p1: '非自立' }, { s: 'に' }, { b: 'する' }], { group: 'intent', ex: '野菜を食べるようにしている。' }),
  P('you-ni-naru', 'N4', '〜ようになる', 'Come to be able to / come to do (a change over time).', '変化（できるように・するようになる）。', [{ pos: ['動詞', '助動詞'], cform: '基本形' }, { s: 'よう', p1: '非自立' }, { s: 'に' }, { b: 'なる' }], { group: 'intent', ex: '漢字が読めるようになった。' }),
  P('you-ni-iu', 'N4', '〜ように言う／頼む', 'Tell / ask someone to do (an indirect command).', '間接的な命令・依頼。', [{ s: 'よう', p1: '非自立' }, { s: 'に' }, { b: ['言う', 'いう', '頼む', '伝える', '注意', 'お願い', '書く', '命じる'] }], { group: 'intent', ex: '母に早く帰るように言われた。' }),
  P('you-ni', 'N4', '〜ように', 'So that … / in order that (with a non-volitional goal); also "like" / "as".', '目的（〜できるように）、例示。', [{ s: 'よう', p1: '非自立' }, { s: 'に' }], { group: 'intent', generic: true, ex: '忘れないようにメモする。' }),
  P('tame-ni', 'N4', '〜ために', 'For the purpose of (after a dictionary form), or because of (after past / noun の).', '目的、または原因・理由。', [{ s: ['ため', '為'] }, { s: 'に', opt: true }], { group: 'intent', generic: true, ex: '家を買うために貯金している。' }),

  // --- Ability, obligation, permission -------------------------------------------------------
  P('koto-ga-dekiru', 'N4', '〜ことができる', 'Can / be able to do.', '可能。', [{ ...PLAIN, opt: true }, { s: 'こと' }, { s: ['が', 'も', 'は'], opt: true }, { b: ['できる', '出来る'] }], { group: 'modality', ex: 'ピアノを弾くことができる。' }),
  P('ta-koto-ga-aru', 'N4', '〜たことがある', 'Have (ever) done: an experience.', '経験。', [PAST, { s: 'こと' }, { s: ['が', 'も', 'は'], opt: true }, { b: 'ある', pos: '動詞' }], { group: 'modality', ex: '富士山に登ったことがある。' }),
  P('koto-ga-aru', 'N4', '〜ことがある', 'Sometimes … (it happens that).', '時々そういう場合がある。', [{ ...PLAIN, not: { ctype: '特殊・タ' } }, { s: 'こと' }, { s: ['が', 'も'] }, { b: 'ある', pos: '動詞' }], { group: 'modality', ex: '時々朝ご飯を食べないことがある。' }),
  P('nakereba-naranai', 'N4', '〜なければならない', 'Must / have to.', '義務・必要。', [{ ctype: '特殊・ナイ', cform: '仮定形' }, { s: 'ば' }, { b: ['なる', 'いける'] }, ...NEG_ANY], { group: 'modality', ex: '薬を飲まなければならない。' }),
  P('nakute-wa-ikenai', 'N4', '〜なくてはいけない', 'Must / have to.', '義務・必要。', [{ s: 'なく', ctype: '特殊・ナイ' }, { s: 'て' }, { s: 'は' }, { b: ['なる', 'いける'] }, ...NEG_ANY], { group: 'modality', ex: '早く寝なくてはいけない。' }),
  P('nai-to-ikenai', 'N4', '〜ないといけない', 'Must / have to (conversational).', '義務・必要（話し言葉）。', [{ s: 'ない', ctype: '特殊・ナイ' }, { s: 'と' }, { alt: [[{ b: 'いける' }, ...NEG_ANY], [{ s: ['だめ', 'ダメ'] }]] }], { group: 'modality', ex: 'もう行かないといけない。' }),
  P('nakya', 'N4', '〜なきゃ／〜なくちゃ', 'Gotta … (casual "must", the rest left unsaid).', '義務（くだけた話し言葉）。', [{ alt: [[{ ctype: '特殊・ナイ', s: ['なきゃ', 'なけりゃ'] }], [{ s: 'なく', ctype: '特殊・ナイ' }, { s: ['ちゃ', 'ては'] }, { not: { b: ['いける', 'なる'] } }]] }], { group: 'modality', ex: '明日は早いから、もう寝なきゃ。' }),
  P('nakute-mo-ii', 'N4', '〜なくてもいい', "Don't have to.", '不必要。', [{ s: 'なく', ctype: '特殊・ナイ' }, { s: 'て' }, { s: 'も' }, GOOD], { group: 'modality', ex: '明日は来なくてもいい。' }),
  P('ba-ii', 'N4', '〜ばいい', 'You just need to … / should (advice: that’s all it takes).', '助言・方法。', [{ s: 'ば', p1: '接続助詞' }, { b: ['いい', 'よい'], cform: '基本形' }], { group: 'modality', ex: '駅まではバスで行けばいい。' }),
  P('ba-yokatta', 'N4', '〜ばよかった', 'I should have … (regret).', '後悔。', [{ s: 'ば', p1: '接続助詞' }, { b: ['いい', 'よい'], cform: '連用タ接続' }, PAST], { group: 'modality', ex: 'もっと勉強すればよかった。' }),
  P('tara-dou', 'N4', '〜たらどう', 'Why don’t you …? (a suggestion).', '提案。', [{ ctype: '特殊・タ', cform: '仮定形' }, { s: ['どう', 'いかが'] }, { b: ['です', 'だ'], pos: '助動詞', opt: true }, { s: 'か', opt: true }], { group: 'modality', ex: '医者に行ったらどうですか。' }),

  // --- Conditions ----------------------------------------------------------------------------
  P('ba', 'N4', '〜ば', 'If (a general condition: if A, then B follows).', '仮定条件。', [{ s: 'ば', p1: '接続助詞' }], { group: 'condition', generic: true, ex: '安ければ買います。' }),
  P('tara', 'N4', '〜たら', 'If / when (once A has happened, B).', '仮定・確定条件。', [{ ctype: '特殊・タ', cform: '仮定形' }], { group: 'condition', generic: true, ex: '駅に着いたら電話してください。' }),
  P('to-conditional', 'N4', '〜と（条件）', 'Whenever / if (an automatic or habitual result).', '必然・習慣的な条件。', [DICT, { s: 'と', p1: '接続助詞' }], { group: 'condition', generic: true, ex: '春になると桜が咲く。' }),
  P('nara', 'N4', '〜なら', 'If (it is the case that) … — reacting to a topic or situation.', '話題・前提を受けた条件。', [{ s: 'なら', ctype: '特殊・ダ' }], { group: 'condition', generic: true, ex: '京都に行くなら秋がいい。' }),

  // --- Time ----------------------------------------------------------------------------------
  P('nagara', 'N4', '〜ながら', 'While doing (two actions at once, same subject).', '同時進行。', [{ s: 'ながら', pos: '助詞' }], { group: 'time', generic: true, ex: '音楽を聞きながら勉強する。' }),
  P('tokoro', 'N4', '〜ところ', 'Just about to (dict.) / in the middle of (ている) / just did (た).', '動作の段階（直前・最中・直後）。', [{ s: 'ところ', p1: '非自立' }, { ...COPULA, opt: true }], { group: 'time', before: { pos: ['動詞', '助動詞'] }, generic: true, ex: '今出かけるところだ。' }),
  P('aida', 'N4', '〜間／〜間に', 'During / while (間: the whole time; 間に: at some point within it).', '期間（間：ずっと、間に：その期間内に）。', [{ alt: [[{ pos: ['動詞', '助動詞'], cform: '基本形' }, { s: ['間', 'あいだ'] }, { s: 'に', opt: true }], [{ pos: '名詞', s: /(休み|夏|冬|春|秋|留守|授業|会議|旅行|日|週|年|月|時間|夜|昼|朝|午前|午後|食事|試験|生活|期間|滞在|入院|仕事|学生時代|子供)$/ }, { s: 'の', pos: '助詞' }, { s: ['間', 'あいだ'] }, { s: ['に', '、', 'は', 'ずっと', 'じゅう', '中'] }]] }], { group: 'time', ex: '母が寝ている間に掃除した。' }),
  P('tari', 'N4', '〜たり〜たりする', 'Doing things like A and B (an example list of actions).', '動作の例示。', [{ s: ['たり', 'だり'], pos: '助詞' }], { group: 'time', ex: '週末は掃除したり洗濯したりする。' }),

  // --- Reasons & contrast -------------------------------------------------------------------
  P('node', 'N4', '〜ので', 'Because … (objective cause; softer and more polite than から).', '客観的な理由。', [{ s: 'ので', p1: '接続助詞' }], { group: 'reason', ex: '雨なので家にいます。' }),
  P('shi', 'N4', '〜し', 'And also … (listing reasons).', '理由の列挙。', [{ s: 'し', p1: '接続助詞' }], { group: 'reason', generic: true, ex: '安いし近いし便利だ。' }),
  P('te-mo', 'N4', '〜ても', 'Even if / even though …', '逆接の仮定・確定。', [TE, { s: 'も', p1: '係助詞' }], { group: 'contrast', generic: true, ex: '雨が降っても行きます。' }),
  P('noni', 'N4', '〜のに', 'Even though … (unexpected or frustrating result).', '逆接・不満。', [{ alt: [[{ s: 'のに', p1: '接続助詞' }], [{ pos: '助動詞', ctype: ['特殊・タ', '特殊・ナイ', '特殊・ダ'] }, { s: 'の', p1: '非自立' }, { s: 'に', p1: '格助詞' }, { not: { pos: '動詞', b: ['使う', 'なる', 'する'] } }]] }], { group: 'contrast', ex: '約束したのに来なかった。' }),

  // --- Appearance, hearsay, probability ------------------------------------------------------
  P('sou-appearance', 'N4', '〜そう（様態）', 'Looks like / seems about to (from what you can see).', '見た様子からの判断。', [{ s: 'そう', pos: '名詞', p1: '接尾' }], { group: 'evidential', before: { not: { cform: '基本形' } }, generic: true, ex: '雨が降りそうだ。' }),
  P('sou-hearsay', 'N4', '〜そうだ（伝聞）', 'I heard that … / they say …', '伝聞。', [{ s: 'そう', pos: '名詞', p1: ['特殊', '接尾'] }, { alt: [[COPULA], [{ s: 'な', pos: '助動詞' }, { s: 'ので' }]] }], { group: 'evidential', before: { cform: '基本形' }, ex: '明日は雨が降るそうだ。' }),
  P('ni-yoru-to', 'N4', '〜によると', 'According to … (the source of what you heard).', '情報の出所。', [T('によると', 'によれば')], { group: 'evidential', ex: '天気予報によると、明日は雨だ。' }),
  P('you-da', 'N4', '〜ようだ', 'It seems that … (judging from evidence).', '根拠のある推量。', [{ s: 'よう', p1: '非自立' }, { b: ['だ', 'です'], not: { cform: ['連用形', '体言接続'] } }], { group: 'evidential', ex: '誰か来たようだ。' }),
  P('no-you-na', 'N4', '〜のような／〜のように', 'Like … / similar to … (a comparison or example).', '比喩・例示。', [{ s: 'の', p1: '連体化' }, { s: 'よう', p1: '非自立' }, { s: ['な', 'に', 'だ', 'です'] }], { group: 'evidential', ex: '鳥のように空を飛びたい。' }),
  P('mitai', 'N4', '〜みたい', 'Seems like / looks like (casual); also "like a …".', '推量・比喩（話し言葉）。', [{ s: 'みたい' }], { group: 'evidential', ex: '夢みたいな話だ。' }),
  P('rashii', 'N4', '〜らしい', 'Apparently / I hear (from indirect evidence); also "typical of".', '伝聞・推量、典型。', [{ b: 'らしい' }], { group: 'evidential', ex: '彼は来ないらしい。' }),
  P('hazu', 'N4', '〜はず', 'Should be / is expected to (logical expectation).', '当然の推量。', [{ s: 'はず' }], { group: 'evidential', generic: true, ex: '荷物は明日届くはずだ。' }),
  P('kamoshirenai', 'N4', '〜かもしれない', 'Might / maybe.', '可能性。', [{ s: 'かも' }, { b: ['しれる', '知れる'] }, ...NEG_ANY], { group: 'evidential', ex: '明日は雪が降るかもしれない。' }),
  P('ga-suru', 'N4', '〜がする', 'There is a (sound, smell, taste, feeling): 音がする.', '感覚（音・におい・味・気配）。', [{ s: ['音', '声', '匂い', 'におい', '臭い', '味', '気', '感じ', '香り', '寒気', '頭痛', '吐き気', 'めまい'] }, { s: 'が' }, { b: 'する', pos: '動詞' }], { group: 'evidential', generic: true, ex: '台所からいい匂いがする。' }),

  // --- Ease, degree, compound verbs ----------------------------------------------------------
  P('yasui', 'N4', '〜やすい', 'Easy to do.', '〜するのが簡単。', [STEM, { b: 'やすい' }], { group: 'degree', ex: 'このペンは書きやすい。' }),
  P('nikui', 'N4', '〜にくい', 'Hard to do.', '〜するのが難しい。', [STEM, { b: ['にくい', 'づらい'] }], { group: 'degree', ex: 'この漢字は覚えにくい。' }),
  P('sugiru', 'N4', '〜すぎる', 'Too much / excessively.', '程度が過ぎる。', [{ b: ['すぎる', '過ぎる'], pos: '動詞' }], { group: 'degree', generic: true, ex: '昨日は食べすぎた。' }),
  P('hajimeru', 'N4', '〜始める／出す／終わる', 'Compound verb: start / burst out / finish doing.', '複合動詞（開始・終了）。', [{ alt: [[STEM, { b: ['始める', 'はじめる', '出す', '終わる', '終える', '続ける'] }], [{ pos: '動詞', b: /^.+[いきぎしちにびみりえけげせてねべめれ](始める|はじめる|終わる|終える|続ける|出す)$/, not: { b: ['思い出す', '取り出す', '引き出す', '呼び出す', '追い出す', '貸し出す', '持ち出す', '差し出す', '見出す', '作り出す', '生み出す', '抜け出す', '乗り出す', '言い出す'] } }]] }], { group: 'degree', ex: '雨が降り始めた。' }),

  // --- Comparison, limits, scope -------------------------------------------------------------
  P('shika-nai', 'N4', '〜しか〜ない', 'Nothing but / only (with a negative verb).', '限定（否定と呼応）。', [{ s: 'しか', pos: '助詞' }], { group: 'limits', generic: true, ex: '百円しかない。' }),
  P('hodo-nai', 'N4', '〜ほど〜ない', 'Not as … as …', '比較（〜ほどではない）。', [{ s: 'ほど', pos: '助詞' }, GAP(3), ...NEG_ANY], { group: 'limits', ex: '今年は去年ほど寒くない。' }),
  P('to-onaji', 'N4', '〜と同じ', 'The same as …', '同一・同様。', [{ s: 'と', pos: '助詞' }, { s: ['同じ', 'おなじ'] }], { group: 'limits', ex: '私も兄と同じ大学に行きたい。' }),
  P('nakanaka-nai', 'N4', 'なかなか〜ない', 'Just won’t … / not easily (it takes longer than expected).', '期待通りに進まない。', [{ s: 'なかなか' }, GAP(4), ...NEG_ANY], { group: 'limits', ex: 'バスがなかなか来ない。' }),

  // --- Quoting & topics ----------------------------------------------------------------------
  P('to-iu', 'N4', '〜という', 'Called … / that says … (quoting or naming).', '名称・内容の引用。', [{ alt: [[{ s: ['と', 'って'], pos: '助詞' }, { b: ['いう', '言う'], not: { s: ['いい', '言い'] } }], [{ s: ['という', 'っていう', 'といって'] }]] }], { group: 'quote', generic: true, ex: '山田という人が来た。' }),
  P('to-omou', 'N4', '〜と思う', 'I think that …', '考えの引用。', [{ s: ['と', 'って'], pos: '助詞' }, { b: ['思う', 'おもう', '考える'] }], { group: 'quote', generic: true, ex: '明日は晴れると思う。' }),
  P('ka-dou-ka', 'N4', '〜かどうか', 'Whether or not …', '二者択一の不確かさ。', [{ s: 'か', pos: '助詞' }, { s: 'どう' }, { s: 'か', pos: '助詞' }], { group: 'quote', ex: '彼が来るかどうか分からない。' }),
  P('embedded-question', 'N4', '〜か（間接疑問）', 'A question inside a sentence: 何時に来るか知らない "I don’t know when he’ll come".', '文中の疑問（間接疑問）。', [PLAIN, { s: 'か', pos: '助詞' }, { s: ['を', 'は', 'が', 'も'], opt: true }, { b: ['知る', '分かる', 'わかる', '教える', '聞く', '覚える', '忘れる', '調べる', '考える', '決める', '尋ねる'] }], { group: 'quote', ex: '彼がどこに住んでいるか知っていますか。' }),
  P('ni-tsuite', 'N4', '〜について', 'About / concerning.', '〜に関して。', [{ s: 'について' }], { group: 'quote', ex: '日本の歴史について調べた。' }),

  // --- Causative & passive -------------------------------------------------------------------
  P('causative', 'N4', '使役（させる）', 'Make / let someone do.', '他者に〜させる。', [{ b: ['させる', 'せる'], p1: '接尾' }], { group: 'voice', generic: true, ex: '子供に野菜を食べさせた。' }),
  P('passive', 'N4', '受身（られる）', 'Passive: be done to (also potential / honorific with られる).', '受身（可能・尊敬も同形）。', [{ b: ['られる', 'れる'], p1: '接尾' }], { group: 'voice', generic: true, ex: '先生に褒められた。' }),

  // --- Keigo ---------------------------------------------------------------------------------
  P('o-kudasai', 'N4', 'お〜ください', 'Please (very polite request).', '尊敬語の依頼。', [{ s: /^[おご]/, pos: '名詞' }, { b: 'くださる' }], { group: 'keigo', ex: '少々お待ちください。' }),
  P('gozaimasu', 'N4', '〜ございます', 'Very polite "there is / is" (ある, です → ございます, でございます).', '「ある」「です」の丁寧語。', [{ b: ['ござる', 'ございます'] }], { group: 'keigo', ex: 'お手洗いは二階にございます。' }),
];
