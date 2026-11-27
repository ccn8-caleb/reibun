// JLPT N3 grammar.

import { TE, NEG, NEG_ANY, PAST, STEM, COPULA, T, GAP, P } from './common.js';

const NA_ADJ = { pos: '名詞', p1: '形容動詞語幹' };
const PLAIN = { pos: ['動詞', '形容詞', '助動詞'], cform: '基本形' };
const NEG_END = [{ alt: [[{ b: 'ない' }], [{ b: 'ある' }, { ctype: '特殊・マス' }, { b: 'ん' }], [{ ctype: '特殊・マス', cform: '未然形' }, { b: 'ん' }]] }];
// A compound verb: either one IPADIC token (使い切る) or stem + verb (使い + 切る).
const COMPOUND = (re, split, not = []) => ({ alt: [[{ pos: '動詞', b: re, not: { b: not } }], [STEM, { b: split }]] });

export default [
  // --- Basic forms ---------------------------------------------------------------------
  P('zu', 'N3', '〜ず', 'Written negative: not … (食べず "without eating", 知らず).', '否定（書き言葉）。', [{ s: 'ず', ctype: '特殊・ヌ' }, { not: { s: ['に', 'には', 'にも', 'とも'] } }], { group: 'basics', generic: true, ex: '朝ご飯を食べず、学校に行った。' }),
  P('garu', 'N3', '〜がる', 'Shows signs of feeling … (someone else’s feelings: 寒がる, 嫌がる).', '第三者の感情・感覚の表れ。', [{ alt: [[{ pos: '形容詞', cform: 'ガル接続' }], [NA_ADJ]] }, { b: 'がる' }], { group: 'basics', ex: '妹は寒がっている。' }),
  P('teki', 'N3', '〜的', '-ic / -al: makes a noun into a な-adjective (経済的 "economic").', '名詞に付いて性質を表す。', [{ s: '的', p1: '接尾' }], { group: 'basics', ex: 'これは経済的な問題だ。' }),
  P('ppoi', 'N3', '〜っぽい', '-ish / -like / tends to (子供っぽい, 忘れっぽい).', '〜の傾向がある・〜のように見える。', [{ b: 'っぽい', s: /^っぽ(い|く|かっ|けれ|さ)$/ }], { group: 'basics', ex: 'あの人は少し子供っぽい。' }),
  P('gachi', 'N3', '〜がち', 'Tend to (usually something bad).', '〜になりやすい（悪い傾向）。', [{ s: ['がち', 'ガチ'], p1: '接尾' }], { group: 'basics', ex: '冬は風邪をひきがちだ。' }),
  P('muke', 'N3', '〜向け／〜向き', 'Aimed at (向け) / suited to (向き).', '対象（向け）・適性（向き）。', [{ s: ['向け', '向き'], p1: '接尾' }], { group: 'basics', ex: 'これは子供向けの本だ。' }),

  // --- Particles -----------------------------------------------------------------------
  P('kke', 'N3', '〜っけ', 'Was it …? (checking something you half-remember).', '記憶の確認。', [{ s: 'っけ', p1: '終助詞' }], { group: 'particles', ex: '会議は何時からだっけ。' }),
  P('toka', 'N3', '〜とか', 'Things like … / or something (casual examples, hearsay).', '例示（話し言葉）。', [{ s: 'とか', pos: '助詞' }], { group: 'particles', ex: '週末は映画とか買い物とかに行く。' }),
  P('mon', 'N3', '〜もん（理由）', 'Because … (a casual, often childish excuse).', '理由・言い訳（話し言葉）。', [{ alt: [[{ s: ['もん', 'もの'], p1: ['非自立', '終助詞'] }, { s: ['。', '！', '？', '!', '?', 'ね', 'な', '」', '』', '…'] }], [{ s: 'もん', p1: ['非自立', '終助詞'] }, { s: 'と' }]] }], { group: 'particles', before: { pos: '助動詞', ctype: ['特殊・ダ', '特殊・タ', '特殊・ナイ', '特殊・デス'] }, ex: 'だって眠いんだもん。' }),

  // --- te-form & aspect ------------------------------------------------------------------
  P('tokoro-datta', 'N3', '〜ところだった', 'Almost … (but it didn’t happen).', 'もう少しで〜しそうだった。', [{ s: 'ところ', p1: '非自立' }, { b: 'だ', cform: '連用タ接続' }, PAST], { group: 'aspect', ex: 'もう少しで遅刻するところだった。' }),
  P('you-to-suru', 'N3', '〜ようとする', 'Try to … / be about to …', '試み・直前。', [{ pos: '動詞', cform: /^未然/, opt: true }, { b: ['う', 'よう'], pos: '助動詞' }, { s: 'と' }, { b: 'する', pos: '動詞' }], { group: 'aspect', ex: '家を出ようとしたとき、電話が鳴った。' }),
  P('te-hajimete', 'N3', '〜てはじめて', 'Only after … (did I realize / do).', '〜して初めて分かる・する。', [TE, { s: ['はじめて', '初めて'] }], { group: 'aspect', generic: true, ex: '日本に来てはじめて寿司を食べた。' }),
  P('te-kara-denai-to', 'N3', '〜てからでないと', 'Not until … / only after …', '〜した後でなければ。', [TE, T('からでないと', 'からでなければ', 'からじゃないと')], { group: 'aspect', ex: '宿題をしてからでないと遊べない。' }),
  P('kiru', 'N3', '〜切る／〜切れない', 'Do completely (使い切る) / can’t finish (食べ切れない).', '完全に〜する／〜しきれない。', [COMPOUND(/^.+(切る|切れる|きる|きれる)$/, ['切る', '切れる', 'きる', 'きれる'], ['生きる', '起きる', '飽きる', '尽きる', '出来る', 'できる', '着る', '大きい'])], { group: 'degree', ex: 'お金を全部使い切った。' }),
  P('kakeru', 'N3', '〜かける／〜かけ', 'Half-done / start to (読みかけの本).', '途中まで〜する。', [COMPOUND(/^.+(かける|かけ)$/, ['かける'], ['出かける', '見かける', '腰かける', '話しかける', '呼びかける', '働きかける', '問いかける', '追いかける', '押しかける', '出掛ける', '見掛ける', '微笑みかける', 'ほほえみかける', '笑いかける', '語りかける', '投げかける', '問い掛ける', '言いかける', '持ちかける'])], { group: 'degree', ex: '本を読みかけたまま寝てしまった。' }),
  P('au', 'N3', '〜合う', 'Do to each other (助け合う "help each other").', 'お互いに〜する。', [COMPOUND(/^.+(合う|あう)$/, ['合う', 'あう'], ['間に合う', '似合う', '付き合う', 'つきあう', '見合う', '出会う', '出合う', '知り合う'])], { group: 'degree', ex: '困ったときは助け合うことが大切だ。' }),
  P('naosu', 'N3', '〜直す', 'Redo / do again (書き直す).', 'もう一度〜する。', [COMPOUND(/^.+(直す|なおす)$/, ['直す', 'なおす'], ['見直す', '立ち直る'])], { group: 'degree', ex: '作文をもう一度書き直した。' }),
  P('ppanashi', 'N3', '〜っぱなし', 'Leave … (on / open) / keep doing (with no change).', '〜したまま放置・ずっと〜している。', [T('っぱなし', 'っ放し')], { group: 'aspect', ex: '電気をつけっぱなしで寝てしまった。' }),
  P('saichuu', 'N3', '〜最中', 'Right in the middle of …', 'ちょうど〜しているとき。', [{ s: '最中' }, { s: ['に', 'だ', 'です'], opt: true }], { group: 'time', ex: '食事の最中に電話が鳴った。' }),

  // --- Wanting, intending, purpose ------------------------------------------------------------
  P('masu-you-ni', 'N3', '〜ますように', 'I hope … / May … (a wish or prayer).', '願い・祈り。', [{ ctype: '特殊・マス', cform: '基本形' }, { s: 'よう' }, { s: 'に' }, { not: { pos: ['動詞', '名詞', '形容詞'] } }], { group: 'intent', ex: '試験に合格できますように。' }),
  P('koto-da', 'N3', '〜ことだ（助言）', 'You should … (advice: the best thing is to …).', '助言・忠告。', [{ pos: '動詞', cform: '基本形', not: { b: ['ある', 'いる', 'できる', 'なる', '分かる', 'わかる'] } }, { s: 'こと' }, { b: 'だ', pos: '助動詞', cform: '基本形' }, { s: ['。', 'と', '！', 'ね', 'よ'] }], { group: 'modality', ex: '困ったときは先生に相談することだ。' }),
  P('koto-wa-nai', 'N3', '〜ことはない', 'There’s no need to …', '必要がない。', [{ pos: '動詞', cform: '基本形', opt: true }, { s: 'こと' }, { s: 'は' }, { b: 'ない' }], { group: 'modality', generic: true, ex: 'そんなに心配することはない。' }),
  P('shika-nai-must', 'N3', '〜しかない', 'Have no choice but to …', 'それ以外に方法がない。', [{ pos: '動詞', cform: '基本形' }, { s: 'しか' }, { alt: [[{ b: 'ない' }], [{ b: 'ある' }, { ctype: '特殊・マス' }, { b: 'ん' }]] }], { group: 'modality', ex: '終電がないので、歩いて帰るしかない。' }),
  P('beki', 'N3', '〜べき', 'Should / ought to (a duty or what is right).', '当然・義務。', [{ b: 'べし', not: { s: ['べく', 'べから', 'べからず', 'べからざる'] } }], { group: 'modality', generic: true, ex: '約束は守るべきだ。' }),
  P('wake-ni-wa-ikanai', 'N3', '〜わけにはいかない', 'Can’t (very well) … (for social or moral reasons).', '事情があって〜できない。', [T('わけにはいか', 'わけにもいか', 'わけにはいきませ', 'わけにはいけ'), { gap: 1 }, ...NEG_ANY], { group: 'modality', ex: '大事な会議なので、休むわけにはいかない。' }),
  P('nai-koto-wa-nai', 'N3', '〜ないことはない', 'It’s not that … not (= it is possible, sort of).', '二重否定（可能性はある）。', [T('ないことはない', 'ないこともない', 'なくはない', 'ないことはありません')], { group: 'modality', ex: '辛い料理も食べられないことはない。' }),

  // --- Conditions ----------------------------------------------------------------------------
  P('to-shitara', 'N3', '〜としたら／とすれば', 'If (we suppose that) …', '仮定。', [T('としたら', 'とすれば', 'とすると')], { before: { not: { pos: '助動詞', b: ['う', 'よう'] } }, group: 'condition', ex: '宝くじが当たったとしたら、何がしたいですか。' }),
  P('sae-ba', 'N3', '〜さえ〜ば', 'As long as … / if only …', 'それだけで十分な条件。', [{ s: 'さえ' }, GAP(5), { alt: [[{ s: 'ば', p1: '接続助詞' }], [{ ctype: '特殊・タ', cform: '仮定形' }]] }], { group: 'condition', ex: '時間さえあれば、旅行に行きたい。' }),
  P('ba-hodo', 'N3', '〜ば〜ほど', 'The more …, the more …', '一方の変化に伴うもう一方の変化。', [{ s: 'ば', p1: '接続助詞' }, GAP(3), { s: 'ほど', pos: '助詞' }], { group: 'condition', ex: '練習すればするほど上手になる。' }),
  P('baai', 'N3', '〜場合', 'In the case of … / if …', '仮定の状況。', [{ s: '場合' }, { s: ['は', 'に', 'には', 'でも', 'も'], opt: true }], { group: 'condition', ex: '雨の場合は試合を中止します。' }),
  P('tatoe-temo', 'N3', 'たとえ〜ても', 'Even if …', '仮定の逆接。', [{ s: ['たとえ', '例え', '仮に'] }, GAP(6), TE, { s: 'も' }], { group: 'condition', ex: 'たとえ雨が降っても行く。' }),

  // --- Time ----------------------------------------------------------------------------------
  P('uchi-ni', 'N3', '〜うちに', 'While (still) … / before it changes.', '状態が変わる前に。', [{ s: 'うち' }, { s: 'に' }], { group: 'time', generic: true, ex: '熱いうちに食べてください。' }),
  P('nai-uchi-ni', 'N3', '〜ないうちに', 'Before … happens (while it hasn’t yet).', '〜する前に（〜しない間に）。', [{ ctype: '特殊・ナイ', s: 'ない' }, { s: 'うち' }, { s: 'に' }], { group: 'time', ex: '暗くならないうちに帰ろう。' }),
  P('mama', 'N3', '〜まま', 'Leaving as is / unchanged.', '変わらない状態のまま。', [{ s: 'まま' }], { group: 'time', ex: '靴を履いたまま入った。' }),
  P('totan', 'N3', '〜たとたん（に）', 'The moment … / just as …', '〜した瞬間に。', [PAST, T('とたん', '途端'), { s: 'に', opt: true }], { group: 'time', ex: '駅に着いたとたん、雨が降り出した。' }),
  P('tabi-ni', 'N3', '〜たびに', 'Every time …', '〜するときはいつも。', [T('たびに', '度に', 'たび', '度')], { group: 'time', before: { pos: ['動詞', '助詞'], not: { s: ['が', 'を', 'は', 'も', 'に', 'で'] } }, ex: 'この歌を聞くたびに、故郷を思い出す。' }),
  P('oki-ni', 'N3', '〜おきに', 'Every other … / at intervals of …', '間隔をあけて。', [T('おきに', '置きに')], { group: 'time', ex: 'バスは十分おきに来る。' }),
  P('goto-ni', 'N3', '〜ごとに', 'Every … / each …', '〜のたびに・〜それぞれに。', [T('ごとに', '毎に')], { group: 'time', ex: '駅ごとに電車が止まる。' }),

  // --- Reasons & causes -----------------------------------------------------------------------
  P('okage-de', 'N3', '〜おかげで', 'Thanks to … (a good result).', '良い結果の原因。', [T('おかげで', 'お陰で', 'おかげだ', 'おかげです', 'おかげか')], { group: 'reason', ex: '先生のおかげで合格できた。' }),
  P('sei-de', 'N3', '〜せいで', 'Because of … (blame for a bad result).', '悪い結果の原因。', [T('せいで', 'せいだ', 'せいです', 'せいか')], { group: 'reason', ex: '雨のせいで試合が中止になった。' }),
  P('no-da-kara', 'N3', '〜のだから', 'Since (it is a fact that) … — so of course …', '当然の理由（強い主張）。', [T('のだから', 'んだから', 'のですから', 'んですから')], { group: 'reason', ex: 'せっかく来たのだから、ゆっくりしていこう。' }),
  P('sekkaku', 'N3', 'せっかく', 'Since you went to the trouble … / a precious (chance).', '苦労して・めったにない機会だから。', [{ s: ['せっかく', '折角'] }], { group: 'reason', ex: 'せっかくの休みなのに、雨だ。' }),

  // --- Contrast & concession ------------------------------------------------------------------
  P('wari-ni', 'N3', '〜わりに（は）', 'Considering … / for (a …) — not what you’d expect.', '〜から予想されるのと違って。', [T('わりに', '割に', 'わりには', '割には')], { group: 'contrast', ex: 'この店は安いわりにおいしい。' }),
  P('kuse-ni', 'N3', '〜くせに', 'Even though … (criticism: and yet!).', '非難を込めた逆接。', [T('くせに', '癖に', 'くせして')], { group: 'contrast', ex: '知っているくせに教えてくれない。' }),
  P('kawari-ni', 'N3', '〜かわりに', 'Instead of … / in exchange for …', '代替・交換。', [T('かわりに', '代わりに', '替わりに')], { group: 'contrast', ex: '母のかわりに私が行きます。' }),
  P('dake-de-naku', 'N3', '〜だけでなく／ばかりでなく', 'Not only … (but also).', '〜に加えて。', [T('だけでなく', 'だけではなく', 'だけじゃなく', 'ばかりでなく', 'ばかりではなく')], { group: 'contrast', ex: '彼は英語だけでなく中国語も話せる。' }),
  P('ni-hikubete', 'N3', '〜に比べて', 'Compared with …', '比較の基準。', [T('に比べて', 'に比べ', 'に比べると', 'と比べて', 'と比べると', 'にくらべて')], { group: 'limits', ex: '去年に比べて今年は暑い。' }),

  // --- Appearance, hearsay, probability ------------------------------------------------------
  P('wake', 'N3', '〜わけだ', 'That is why / no wonder (a logical conclusion).', '当然の結論。', [{ s: 'わけ' }, { ...COPULA, cform: /基本形/ }], { group: 'evidential', ex: 'だから安いわけだ。' }),
  P('wake-dewa-nai', 'N3', '〜わけではない', 'It is not (necessarily) that …', '部分否定。', [{ s: 'わけ' }, { s: ['で', 'じゃ'] }, { s: 'は', opt: true }, NEG], { group: 'evidential', ex: '嫌いなわけではない。' }),
  P('wake-ga-nai', 'N3', '〜わけがない', 'There’s no way … (it’s impossible).', '絶対に〜ない。', [{ s: 'わけ' }, { s: ['が', 'は'] }, ...NEG_END], { group: 'evidential', ex: 'こんな難しい問題が解けるわけがない。' }),
  P('hazu-ga-nai', 'N3', '〜はずがない', 'It can’t be that … (there’s no reason to expect it).', '〜という可能性はない。', [{ s: 'はず' }, { s: ['が', 'は'] }, ...NEG_END], { group: 'evidential', ex: '彼がそんなことを言うはずがない。' }),
  P('ni-chigainai', 'N3', '〜に違いない', 'Must be … (I’m sure of it).', '強い確信。', [T('に違いない', 'にちがいない', 'に違いありません', 'に違いなかった')], { group: 'evidential', ex: 'あの店はいつも人が多いから、おいしいに違いない。' }),
  P('you-na-ki-ga-suru', 'N3', '〜ような気がする', 'I have a feeling that …', 'はっきりしないがそう感じる。', [{ s: 'よう' }, { s: 'な' }, { s: '気' }, { s: 'が' }, { b: 'する' }], { group: 'evidential', ex: '誰かに見られているような気がする。' }),
  P('you-ni-mieru', 'N3', '〜ように見える', 'Looks like … / appears to be …', '外見からの判断。', [{ s: 'よう' }, { s: 'に' }, { b: ['見える', 'みえる'] }], { group: 'evidential', ex: '彼は怒っているように見える。' }),
  P('sou-ni-nai', 'N3', '〜そうにない／そうもない', 'Doesn’t look like it will …', '〜する様子がない。', [{ s: 'そう', p1: '接尾' }, { s: ['に', 'も', 'にも'] }, ...NEG_END], { group: 'evidential', ex: '雨はなかなかやみそうにない。' }),
  P('marude', 'N3', 'まるで〜ようだ', 'Just like … / as if …', '比喩の強調。', [{ s: 'まるで' }, GAP(6), { s: ['よう', 'みたい'] }], { group: 'evidential', ex: 'まるで夢のようだ。' }),
  P('to-iu-koto-da', 'N3', '〜ということだ／とのことだ', 'I hear that … / That means …', '伝聞・結論。', [T('ということだ', 'ということです', 'ということなので', 'ということだった', 'ということでした', 'とのことだ', 'とのことです', 'とのことなので', 'とのことでした', 'ってことだ', 'ってことです')], { group: 'evidential', ex: '社長は明日戻るということだ。' }),

  // --- Comparison, limits, scope -------------------------------------------------------------
  P('kesshite-nai', 'N3', '決して〜ない', 'Never … (strong).', '強い否定。', [{ s: ['決して', 'けっして'] }, GAP(5), ...NEG_ANY], { group: 'limits', ex: '決して嘘はつかない。' }),
  P('chittomo-nai', 'N3', 'ちっとも／少しも〜ない', 'Not … at all.', '全く〜ない。', [{ s: ['ちっとも', '少しも', 'すこしも', '全く', 'まったく'] }, GAP(5), ...NEG_ANY], { group: 'limits', ex: 'この映画はちっとも面白くない。' }),
  P('metta-ni-nai', 'N3', 'めったに〜ない', 'Rarely / hardly ever.', 'ほとんど〜ない。', [T('めったに', '滅多に'), GAP(5), ...NEG_ANY], { group: 'limits', ex: '父はめったに怒らない。' }),
  P('betsu-ni-nai', 'N3', '別に〜ない', 'Not particularly …', '特に〜ない。', [T('別に', 'べつに'), GAP(5), ...NEG_ANY], { group: 'limits', ex: '別に怒っていない。' }),
  P('hodo', 'N3', '〜ほど（程度）', 'To the extent that … / so … that …', '程度の強調。', [{ s: 'ほど', pos: '助詞' }], { group: 'limits', generic: true, ex: '泣きたいほど痛い。' }),

  // --- Emphasis & examples -------------------------------------------------------------------
  P('bakari', 'N3', '〜ばかり', 'Nothing but / always doing; after た: just did.', '限定・直後。', [{ s: 'ばかり', pos: '助詞' }], { group: 'emphasis', generic: true, ex: '弟はゲームばかりしている。' }),
  P('sae', 'N3', '〜さえ', 'Even … (an extreme example).', '極端な例の強調。', [{ s: ['さえ', 'でさえ'] }], { group: 'emphasis', generic: true, ex: '忙しくて、水を飲む時間さえない。' }),
  P('koso', 'N3', '〜こそ', 'It is precisely … (strong emphasis).', '強調（〜が一番）。', [{ s: 'こそ' }], { group: 'emphasis', generic: true, ex: '今年こそ合格したい。' }),
  P('nante', 'N3', '〜なんて', 'Things like … (surprise or contempt).', '驚き・軽視。', [{ s: ['なんて', 'なんか'], pos: '助詞' }], { group: 'emphasis', ex: '彼が結婚するなんて信じられない。' }),
  P('mono-da', 'N3', '〜ものだ', 'Used to … (nostalgia) / That’s how it is (general truth).', '回想・一般的な傾向。', [{ pos: ['動詞', '助動詞'] }, { s: 'もの', p1: '非自立' }, { b: 'だ', pos: '助動詞', cform: ['基本形', '連用タ接続'] }], { group: 'attitude', generic: true, ex: '昔はよくこの川で泳いだものだ。' }),
  P('te-tamaranai', 'N3', '〜てたまらない', 'Unbearably … / dying to …', '感情・感覚が抑えられない。', [TE, T('たまらない', 'たまりません', 'たまらなかった')], { group: 'attitude', ex: '暑くてたまらない。' }),
  P('te-shou-ga-nai', 'N3', '〜てしょうがない', 'Extremely … (can’t help feeling it).', '感情が強くてどうしようもない。', [TE, T('しょうがない', 'しかたがない', '仕方がない', 'しようがない', '仕方ない', 'しかたない', 'しょうがありません', '仕方がありません')], { group: 'attitude', ex: '試験の結果が気になってしょうがない。' }),

  // --- Quoting & topics ----------------------------------------------------------------------
  P('to-ieba', 'N3', '〜といえば／というと', 'Speaking of … / when it comes to …', '話題の提示。', [T('といえば', 'と言えば', 'というと', 'と言うと', 'といったら', 'と言ったら')], { group: 'quote', generic: true, ex: '日本といえば、富士山だ。' }),
  P('to-iu-yori', 'N3', '〜というより', 'Rather than … (it’s more that …)', '別の言い方の方が適切。', [T('というより', 'と言うより', 'というよりは')], { group: 'quote', ex: '彼は友達というより家族のような存在だ。' }),
  P('to-iu-no-wa', 'N3', '〜というのは', '(What we call) … is … / The reason is …', '定義・説明の提示。', [T('というのは', 'っていうのは', 'と言うのは')], { group: 'quote', ex: '「積ん読」というのは、本を買っても読まないことだ。' }),
  P('ni-kanshite', 'N3', '〜に関して', 'Regarding … (more formal than について).', '〜について（改まった言い方）。', [T('に関して', 'に関する', 'に関し', 'に関しては')], { group: 'quote', ex: 'この件に関して質問があります。' }),

  // --- Compound particles --------------------------------------------------------------------
  P('ni-yotte', 'N3', '〜によって', 'By (agent of a passive) / depending on / by means of.', '動作主・手段・依存。', [T('によって', 'により', 'による'), { not: { s: ['と', 'ば', 'は'] } }], { group: 'phrases', ex: 'この絵はピカソによって描かれた。' }),
  P('to-shite', 'N3', '〜として', 'As (a role or capacity).', '資格・立場。', [T('として', 'としては', 'としての'), { not: { s: 'も' } }], { group: 'phrases', before: { pos: '名詞' }, ex: '通訳として働いている。' }),
  P('ni-totte', 'N3', '〜にとって', 'For (from the point of view of).', '〜の立場から見ると。', [T('にとって', 'にとっては', 'にとっての')], { group: 'phrases', ex: '私にとって大切な人だ。' }),
  P('ni-taishite', 'N3', '〜に対して', 'Toward / against / in contrast to.', '対象・対比。', [T('に対して', 'に対し', 'に対する', 'に対しては')], { group: 'phrases', ex: '質問に対して答えた。' }),
  P('ni-kuwaete', 'N3', '〜に加えて', 'In addition to …', '〜に付け加えて。', [T('に加えて', 'に加え')], { group: 'phrases', ex: '雨に加えて風も強くなってきた。' }),
  P('ni-kawatte', 'N3', '〜に代わって', 'In place of … / on behalf of …', '代理・交代。', [T('に代わって', 'に代わり', 'に代わる', 'にかわって')], { group: 'phrases', ex: '社長に代わって部長が挨拶した。' }),
  P('ni-shitagatte', 'N3', '〜に従って', 'As … (changes, so does …) / in accordance with …', '比例的な変化・準拠。', [T('に従って', 'にしたがって', 'に従い', 'にしたがい')], { group: 'phrases', ex: '年をとるに従って、体が弱くなる。' }),
  P('ni-tsurete', 'N3', '〜につれて', 'As … (gradually changes, so does …).', '一方の変化に伴って。', [T('につれて', 'につれ')], { group: 'phrases', ex: '時間がたつにつれて、町の様子が変わった。' }),
  P('to-tomo-ni', 'N3', '〜とともに', 'Together with … / at the same time as …', '一緒に・同時に・比例。', [T('とともに', 'と共に')], { group: 'phrases', ex: '家族とともに新年を迎えた。' }),
  P('wo-chuushin-ni', 'N3', '〜を中心に', 'Centred on … / mainly …', '〜を中心として。', [T('を中心に', 'を中心として', 'を中心とした', 'を中心にして')], { group: 'phrases', ex: 'この祭りは若者を中心に人気がある。' }),
  P('toori-ni', 'N3', '〜とおり（に）', 'Just as … / in the way that …', '〜と同じように。', [T('とおりに', '通りに', 'どおりに', 'とおり', '通り', 'どおり'), { not: { pos: '名詞' } }], { group: 'phrases', before: { pos: ['助動詞', '動詞', '助詞', '名詞'], not: { s: ['が', 'を', 'は', 'も', 'に', 'で', 'と', 'へ'] } }, ex: '先生のおっしゃるとおりにした。' }),
  P('tsuide-ni', 'N3', '〜ついでに', 'While you’re at it … / on the way …', '〜する機会を利用して。', [T('ついでに')], { group: 'phrases', ex: '買い物のついでに本屋に寄った。' }),

  // --- Causative & passive -------------------------------------------------------------------
  P('causative-passive', 'N3', '使役受身（させられる）', 'Be made to do (against your will).', '強制されて〜する。', [{ b: ['させる', 'せる'], p1: '接尾' }, { b: ['られる', 'れる'], p1: '接尾' }], { group: 'voice', ex: '子供に野菜を食べさせられた。' }),

  // --- Keigo ---------------------------------------------------------------------------------
  P('o-ni-naru', 'N3', 'お〜になる', 'Honorific: someone (respected) does.', '尊敬語。', [{ s: ['お', 'ご'], pos: '接頭詞' }, { alt: [[{ pos: '動詞', cform: '連用形' }], [{ pos: '名詞', p1: ['サ変接続', '一般'], not: { s: /ちゃん$|さん$/ } }]] }, { s: 'に' }, { b: 'なる' }], { group: 'keigo', ex: '先生がお帰りになった。' }),
  P('o-suru', 'N3', 'お〜する', 'Humble: I do (for you).', '謙譲語。', [{ s: ['お', 'ご'], pos: '接頭詞' }, { pos: ['動詞', '名詞'] }, { b: ['する', 'いたす', '致す'] }], { group: 'keigo', ex: '荷物をお持ちします。' }),
  P('sonkeigo', 'N3', '尊敬語の動詞', 'Honorific verb: raises the person doing the action (いらっしゃる, おっしゃる, 召し上がる…).', '相手や話題の人を高める動詞。', [{ b: ['いらっしゃる', 'おっしゃる', '召し上がる', 'めしあがる', 'なさる', 'ご覧になる', 'くださる'], p1: '自立', not: { b: 'くださる', cform: '命令ｉ' } }], { group: 'keigo', ex: '社長がいらっしゃった。' }),
  P('kenjougo', 'N3', '謙譲語の動詞', 'Humble verb: lowers yourself (参る, 申す, いただく, 伺う…).', '自分を低めて相手を高める動詞。', [{ b: ['参る', 'まいる', '申す', 'もうす', '申し上げる', 'いただく', '伺う', 'うかがう', '拝見', 'いたす', '致す', '存じる', 'おる'], p1: '自立' }], { group: 'keigo', ex: '明日伺います。' }),
  P('sasete-itadaku', 'N3', '〜させていただく', 'Humbly do (with your permission) — very polite.', '許可を得て〜する（謙譲）。', [{ b: ['させる', 'せる'], p1: '接尾' }, TE, { b: ['いただく', 'もらう'], p1: '非自立', not: { cform: /^命令/ } }], { group: 'keigo', ex: '本日の司会を務めさせていただきます。' }),
];
