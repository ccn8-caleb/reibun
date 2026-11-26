// JLPT N2 grammar. Mostly fixed phrases, matched as text (T) whatever the tokenization.

import { TE, NEG_ANY, PAST, STEM, T, GAP, P } from './common.js';

const PLAIN = { pos: ['動詞', '形容詞', '助動詞'], cform: '基本形' };
const DICT_V = { pos: '動詞', cform: '基本形' };
const ENDS = { s: ['。', '！', '？', '!', '?', '」', 'よ', 'ね'] };
// T with polite / past endings added: Tx('にすぎない') also matches にすぎません, にすぎなかった.
const Tx = (...base) =>
  T(...base.flatMap((b) => (b.endsWith('ない') ? [b, b.slice(0, -2) + 'ありません', b.slice(0, -1) + 'かった', b.slice(0, -2) + 'ません'] : [b])));

export default [
  // --- Basic forms ---------------------------------------------------------------------
  P('mai', 'N2', '〜まい', 'Will not … / probably not … (written negative volitional).', '否定の意志・推量（書き言葉）。', [{ b: 'まい', pos: '助動詞' }], { group: 'basics', generic: true, ex: 'もう二度と行くまいと思った。' }),
  P('buri', 'N2', '〜ぶり', 'For the first time in … (三年ぶり) / manner of (話しぶり).', '時間の経過・様子。', [{ s: ['ぶり', '振り', 'っぷり'], p1: '接尾' }], { group: 'basics', ex: '三年ぶりに国へ帰った。' }),
  P('ge', 'N2', '〜げ', '-looking: seeming to feel … (寂しげ, 楽しげ).', '〜そうな様子。', [{ s: /^.+げ$/, pos: '名詞', p1: ['一般', '形容動詞語幹'], not: { s: ['ひげ', 'おかげ', 'お陰げ', 'とげ', 'まつげ', 'かげ', '影げ'] } }, { s: ['な', 'に', 'だ'] }], { group: 'basics', ex: '彼女は寂しげな顔をしていた。' }),
  P('gimi', 'N2', '〜気味', 'A touch of … / slightly … (風邪気味).', '少し〜の傾向がある。', [{ s: ['気味', 'ぎみ'], p1: '接尾' }], { group: 'basics', ex: '最近、少し風邪気味だ。' }),
  P('darake', 'N2', '〜だらけ', 'Full of / covered in … (usually bad).', '〜がたくさんある（好ましくない）。', [{ s: 'だらけ' }], { group: 'basics', ex: '部屋は本だらけだ。' }),
  P('tate', 'N2', '〜たて', 'Freshly … / just … (焼きたて).', '〜したばかり。', [{ s: ['たて', '立て'], p1: '接尾' }], { group: 'basics', ex: '焼きたてのパンはおいしい。' }),

  // --- te-form & aspect ------------------------------------------------------------------
  P('te-irai', 'N2', '〜て以来', 'Ever since …', '〜してからずっと。', [TE, { s: '以来' }], { group: 'time', ex: '日本に来て以来、ずっと東京に住んでいる。' }),
  P('te-koso', 'N2', '〜てこそ', 'Only by … (can you truly …)', '〜して初めて意味がある。', [TE, { s: 'こそ' }], { group: 'emphasis', ex: '自分でやってこそ、本当に分かる。' }),
  P('te-wa-irarenai', 'N2', '〜てはいられない', 'Can’t (afford to) keep …', 'そうしている余裕がない。', [TE, Tx('はいられない', 'もいられない', 'いられない')], { group: 'attitude', ex: '試験が近いので、遊んではいられない。' }),
  P('te-naranai', 'N2', '〜てならない', 'Can’t help feeling … (a strong, natural feeling).', '自然にそう感じて抑えられない。', [{ alt: [[TE], [{ s: 'で', p1: '格助詞' }]] }, Tx('ならない')], { group: 'attitude', ex: '故郷の家族のことが心配でならない。' }),
  P('te-mo-sashitsukaenai', 'N2', '〜ても差し支えない', 'It’s all right to … (formal).', '〜しても問題ない（改まった言い方）。', [TE, Tx('も差し支えない', 'もさしつかえない')], { group: 'modality', ex: 'こちらの資料はお持ち帰りいただいても差し支えありません。' }),
  P('tsutsu', 'N2', '〜つつ', 'While … (also: even though …).', '〜ながら（書き言葉）、逆接。', [{ s: 'つつ', pos: '助詞' }, { not: { b: 'ある' } }], { group: 'time', ex: '体に悪いと知りつつ、タバコを吸ってしまう。' }),
  P('tsutsu-aru', 'N2', '〜つつある', 'Is in the process of … (gradually changing).', '変化が進行中。', [{ s: 'つつ', pos: '助詞' }, { b: 'ある' }], { group: 'aspect', ex: '地球の気温は上がりつつある。' }),
  P('ippou-da', 'N2', '〜一方だ', 'Keeps …-ing (more and more, usually bad).', '変化が一方向に進み続ける。', [DICT_V, T('一方だ', '一方です', 'いっぽうだ', '一方で'), { not: { pos: ['名詞', '動詞'] } }, ENDS], { group: 'aspect', ex: '物価は上がる一方だ。' }),
  P('bakari-da', 'N2', '〜ばかりだ', 'Just keeps getting … (a one-way change).', '悪い方向への変化が続く。', [DICT_V, T('ばかりだ', 'ばかりです')], { group: 'aspect', ex: '病気は悪くなるばかりだ。' }),
  P('kiri', 'N2', '〜きり', 'Only … (二人きり) / since … and no more (出かけたきり).', '限定・それ以降の変化なし。', [{ s: ['きり', 'っきり', 'ぎり'], p1: ['非自立', '副助詞', '接尾'] }], { group: 'limits', ex: '彼は出かけたきり帰ってこない。' }),

  // --- Compound verbs & auxiliaries ----------------------------------------------------------
  P('kaneru', 'N2', '〜かねる', 'Cannot (politely refusing): I’m unable to …', '〜することが難しい（丁寧な断り）。', [STEM, { b: 'かねる' }, { not: { b: 'ない' } }], { group: 'degree', ex: 'そのご依頼はお受けしかねます。' }),
  P('kanenai', 'N2', '〜かねない', 'Might well … (something bad could happen).', '〜する可能性がある（悪い結果）。', [STEM, { b: 'かねる' }, { b: 'ない' }], { group: 'degree', ex: 'このままでは事故が起こりかねない。' }),
  P('eru', 'N2', '〜得る／得ない', 'Can / could possibly (あり得る) — or cannot (あり得ない).', '可能性がある／ない。', [STEM, { b: ['得る', 'える', 'うる'], p1: '非自立' }], { group: 'degree', ex: 'そんなことはあり得ない。' }),
  P('gatai', 'N2', '〜がたい', 'Hard to … (emotionally: can hardly believe / forgive).', '〜することが難しい（心理的）。', [STEM, { b: 'がたい' }], { group: 'degree', ex: '彼の話は信じがたい。' }),
  P('nuku', 'N2', '〜抜く', 'Do … to the very end / thoroughly.', '最後まで〜する。', [{ alt: [[{ pos: '動詞', b: /^.+(抜く|ぬく)$/, not: { b: ['引き抜く', '追い抜く', '見抜く', '出し抜く', '手抜く'] } }], [STEM, { b: ['抜く', 'ぬく'] }]] }], { group: 'degree', ex: '最後まで走り抜いた。' }),
  P('shidai', 'N2', '〜次第', 'As soon as … (着き次第) / depends on (…次第だ).', '〜したらすぐ・〜によって決まる。', [{ alt: [[STEM, T('次第', 'しだい')], [{ pos: '名詞' }, T('次第で', '次第だ', '次第です', 'しだいで', 'しだいだ')]] }], { group: 'time', ex: '駅に着き次第、連絡します。' }),
  P('kkonai', 'N2', '〜っこない', 'There’s no way … (casual).', '絶対に〜ない（話し言葉）。', [T('っこない', ...['て', 'け', 'せ', 'れ', 'き', 'し', 'ち', 'に', 'み', 'び', 'い', 'え', 'げ', 'べ', 'め', 'ね', 'わ', 'でき'].map((x) => x + 'っこない'))], { group: 'evidential', ex: '一日でこの仕事を終えるなんて、できっこない。' }),
  P('you-ga-nai', 'N2', '〜ようがない', 'There’s no way to …', '方法がなくて〜できない。', [{ alt: [[STEM, Tx('ようがない', 'ようもない')], [{ pos: '動詞', cform: '未然ウ接続' }, Tx('うがない', 'うもない')]] }], { group: 'modality', ex: '連絡先が分からないので、連絡しようがない。' }),

  // --- Obligation, judgement ----------------------------------------------------------------
  P('zaru-wo-enai', 'N2', '〜ざるを得ない', 'Have no choice but to …', 'どうしても〜しなければならない。', [Tx('ざるを得ない', 'ざるをえない')], { group: 'modality', ex: '上司の命令なので、行かざるを得ない。' }),
  P('zu-ni-wa-irarenai', 'N2', '〜ずにはいられない', 'Can’t help …-ing.', 'どうしても〜してしまう。', [Tx('ずにはいられない', 'ないではいられない', 'ずにはおれない')], { group: 'attitude', ex: 'あの映画を見ると、泣かずにはいられない。' }),
  P('zu-ni-sumu', 'N2', '〜ずに済む', 'Get by without …-ing / be spared …', '〜しなくても問題ない。', [T(...['ずに済', 'ずにす', 'ないで済', 'ないですん', 'ないですま', 'ないです', 'なくて済'].flatMap((x) => [x + 'む', x + 'んだ', x + 'みます', x + 'んで'])), { not: { s: 'か' } }], { group: 'modality', ex: '友達が貸してくれたので、新しく買わずに済んだ。' }),
  P('hoka-nai', 'N2', '〜ほかない', 'There’s nothing to do but …', 'それ以外に方法がない。', [DICT_V, Tx('ほかない', 'ほかはない', 'よりほかない', 'よりほかはない', '他ない', '外ない')], { group: 'modality', ex: 'バスが来ないので、歩くほかない。' }),
  P('ni-koshita-koto-wa-nai', 'N2', '〜に越したことはない', 'It’s best to … (nothing beats it).', '〜の方がいい（当然）。', [Tx('に越したことはない', 'にこしたことはない')], { group: 'modality', ex: '旅行の準備は早いに越したことはない。' }),
  P('ni-wa-oyobanai', 'N2', '〜には及ばない', 'There’s no need to …', '〜する必要はない。', [Tx('には及ばない', 'にはおよばない')], { group: 'modality', ex: 'わざわざ来るには及ばない。' }),
  P('ni-kimatte-iru', 'N2', '〜に決まっている', 'It’s bound to be … / surely …', '絶対に〜だ（強い確信）。', [T('に決まっている', 'に決まってる', 'に決まっています', 'にきまっている')], { group: 'evidential', ex: 'そんなに食べたら、太るに決まっている。' }),
  P('osore-ga-aru', 'N2', '〜おそれがある', 'There is a risk / fear that …', '悪いことが起こる可能性。', [T('おそれがある', '恐れがある', 'おそれもある', '恐れもある', 'おそれがあります', '恐れがあります')], { group: 'evidential', ex: '台風が上陸するおそれがある。' }),
  P('ni-hoka-naranai', 'N2', '〜にほかならない', 'Is nothing other than … / is precisely …', 'まさに〜だ。', [Tx('にほかならない', 'に他ならない')], { group: 'evidential', ex: '成功は努力の結果にほかならない。' }),
  P('ni-suginai', 'N2', '〜にすぎない', 'Is merely / no more than …', 'ただ〜だけだ。', [Tx('にすぎない', 'に過ぎない')], { group: 'limits', ex: 'それは噂にすぎない。' }),
  P('to-wa-kagiranai', 'N2', '〜とは限らない', 'It isn’t necessarily (true that) …', '必ずしも〜ではない。', [Tx('とは限らない', 'とはかぎらない', 'とも限らない')], { group: 'evidential', ex: '高い物がいい物だとは限らない。' }),
  P('ka-no-you-ni', 'N2', '〜かのように', 'As if … (though it isn’t so).', '実際は違うが〜のように。', [T('かのように', 'かのような', 'かのようだ', 'かのようです')], { group: 'evidential', ex: '彼は何も知らないかのように振る舞った。' }),
  P('mono-ga-aru', 'N2', '〜ものがある', 'There is something (deeply) … about it.', 'しみじみそう感じさせる。', [{ s: 'もの', p1: '非自立' }, { s: 'が' }, { b: 'ある' }], { group: 'attitude', ex: '彼の歌には人の心を打つものがある。' }),
  P('to-iu-mono-da', 'N2', '〜というものだ', 'That’s what … is (a general truth or judgement).', '本質についての断定。', [T('というものだ', 'というものです', 'ってもんだ', 'というもんだ')], { group: 'attitude', ex: '困ったときに助け合うのが友達というものだ。' }),
  P('to-iu-mono-dewa-nai', 'N2', '〜というものではない', 'It isn’t (always) the case that …', '必ずしもそうではない。', [T('というものではない', 'というものでもない', 'というもんじゃない', 'というものではありません')], { group: 'attitude', ex: 'お金があれば幸せになれるというものではない。' }),
  P('koto-ka', 'N2', '〜ことか', 'How …! (deep emotion).', '感情の強調（なんと〜だろう）。', [{ s: 'こと' }, { alt: [[{ s: 'か', pos: '助詞' }], [{ b: 'です' }, { s: 'う' }, { s: 'か', opt: true }], [{ b: 'だ', cform: /^未然/ }, { s: 'う' }]] }, ENDS], { group: 'attitude', ex: '合格の知らせを聞いて、どんなにうれしかったことか。' }),
  P('koto-ni', 'N2', '〜ことに（は）', 'To my (surprise / regret) … — what is … is that …', '話し手の感情の強調。', [{ alt: [[{ s: 'な', ctype: '特殊・ダ' }], [{ pos: ['形容詞', '助動詞'], cform: '基本形', not: { ctype: '特殊・ナイ' } }]] }, { s: 'こと' }, T('に', 'には'), { not: { b: ['する', 'なる', 'なっ'] } }], { group: 'attitude', generic: true, ex: '残念なことに、試合は中止になった。' }),
  P('mono-ka', 'N2', '〜ものか', 'As if I would …! / I’ll never …', '強い否定・拒否。', [T('ものか', 'もんか', 'ものですか', 'もんですか'), ENDS], { group: 'attitude', ex: 'あんな店、二度と行くものか。' }),
  P('you-dewa-nai-ka', 'N2', '〜ようではないか', 'Let’s … (a strong call to action).', '呼びかけ・提案。', [T('ようではないか', 'ようじゃないか', 'うではないか', 'うじゃないか', 'ようではありませんか')], { group: 'intent', ex: 'みんなで力を合わせて頑張ろうではないか。' }),

  // --- Conditions ----------------------------------------------------------------------------
  P('nai-koto-ni-wa', 'N2', '〜ないことには', 'Unless … (nothing can happen).', '〜しなければ（後は不可能）。', [T('ないことには', 'なければ')], { group: 'condition', generic: true, ex: '実際に見ないことには、何とも言えない。' }),
  P('mono-nara', 'N2', '〜ものなら', 'If (I) could … / if you dare …', '実現が難しいことの仮定。', [T('ものなら', 'もんなら')], { group: 'condition', ex: '戻れるものなら、学生時代に戻りたい。' }),
  P('kurai-nara', 'N2', '〜くらいなら', 'Rather than … (I’d sooner …).', '〜するよりはましだ。', [T('くらいなら', 'ぐらいなら')], { group: 'condition', ex: 'あんな人に謝るくらいなら、会社を辞める。' }),
  P('to-shite-mo', 'N2', '〜としても', 'Even if (we suppose) …', '仮定の逆接。', [T('としても', 'にしても', 'にしろ', 'にせよ')], { group: 'condition', ex: '今から急いだとしても、間に合わないだろう。' }),
  P('kara-ni-wa', 'N2', '〜からには', 'Now that … / since … (you must follow through).', '〜する以上は当然。', [T('からには', 'からは'), { not: { pos: '名詞' } }], { group: 'condition', ex: '約束したからには、守らなければならない。' }),
  P('ijou-wa', 'N2', '〜以上（は）', 'Since … / now that … (you must).', '〜のだから当然。', [{ pos: ['動詞', '助動詞'], cform: '基本形' }, { s: '以上' }, { s: 'は', opt: true }], { group: 'condition', ex: '約束した以上は守らなければならない。' }),
  P('ue-wa', 'N2', '〜上は', 'Now that … (formal).', '〜した以上は。', [{ pos: ['動詞', '助動詞'], cform: '基本形' }, { s: ['上', 'うえ'] }, { s: 'は' }], { group: 'condition', ex: 'こうなった上は、最後までやるしかない。' }),
  P('kagiri', 'N2', '〜限り', 'As long as … / as far as … (知る限り).', '〜の範囲では・〜の間は。', [{ alt: [[{ s: 'ない', ctype: '特殊・ナイ' }], [{ pos: ['動詞', '助動詞'], cform: '基本形' }]] }, T('限り', 'かぎり', '限りは', '限りでは', 'かぎりでは')], { group: 'condition', ex: '私の知る限り、彼は嘘をつかない。' }),
  P('ni-yotte-wa', 'N2', '〜によっては', 'Depending on … (in some cases).', '場合によって。', [T('によっては')], { group: 'condition', ex: '天気によっては、試合が中止になる。' }),

  // --- Time ----------------------------------------------------------------------------------
  P('ue-de', 'N2', '〜上で', 'After (doing, then) … / in terms of …', '〜してから・〜の点で。', [{ alt: [[PAST], [{ s: 'の' }]] }, { s: ['上', 'うえ'] }, { s: 'で' }, { not: { pos: ['動詞'], p1: '自立', b: ['寝る', '遊ぶ', '座る', '休む', '待つ', '食べる'] } }], { group: 'time', before: { not: { pos: '名詞', p1: ['一般', '固有名詞', '代名詞'] } }, ex: 'よく調べた上で決めます。' }),
  P('sue-ni', 'N2', '〜末（に）', 'After a long … (finally).', '長い過程の後に。', [{ alt: [[PAST], [{ s: 'の' }]] }, T('末に', 'すえに', '末', 'すえ')], { group: 'time', ex: '悩んだ末に、会社を辞めた。' }),
  P('ageku', 'N2', '〜あげく', 'After all that … (with a bad result).', 'いろいろした後、結局（悪い結果）。', [T('あげく', '挙げ句', '挙句', 'あげくに', '挙げ句に', 'あげくの果て')], { group: 'time', ex: 'さんざん迷ったあげく、何も買わなかった。' }),
  P('sai', 'N2', '〜際（に）', 'When / on the occasion of … (formal).', '〜のとき（改まった言い方）。', [T('際に', '際は', '際には', '際の', 'さいに')], { group: 'time', ex: 'お帰りの際には、忘れ物にご注意ください。' }),
  P('ni-atatte', 'N2', '〜にあたって', 'On the occasion of … / when starting …', '〜を始めるときに。', [T('にあたって', 'にあたり', 'に当たって', 'に当たり', 'にあたっては')], { group: 'time', ex: '留学するにあたって、両親に相談した。' }),
  P('ni-saishite', 'N2', '〜に際して', 'On the occasion of … (formal).', '〜のときに（改まった言い方）。', [T('に際して', 'に際し', 'に際しての', 'にさいして')], { group: 'time', ex: '入学に際して、書類を提出してください。' }),
  P('ni-sakidatte', 'N2', '〜に先立って', 'Prior to … / before …', '〜の前に（準備）。', [T('に先立って', 'に先立ち', 'に先立つ', 'にさきだって')], { group: 'time', ex: '工事に先立って、住民に説明会が開かれた。' }),
  P('ta-tokoro-de', 'N2', '〜たところで', 'Even if … (it won’t help).', '〜しても無駄だ。', [PAST, T('ところで')], { group: 'contrast', ex: '今から急いだところで、間に合わない。' }),
  P('tokoro-ni', 'N2', '〜ところに／ところへ／ところを', 'Just when … (something happened).', 'ちょうど〜しているときに。', [{ s: 'ところ', p1: '非自立' }, { s: ['に', 'へ', 'を'], pos: '助詞' }], { group: 'time', ex: '出かけようとしているところに、友達が来た。' }),
  P('ka-to-omou-to', 'N2', '〜かと思うと', 'No sooner … than …', '〜したと思ったらすぐに。', [T('かと思うと', 'かと思ったら', 'かと思えば')], { group: 'time', ex: '雨が降ったかと思うと、すぐに晴れた。' }),
  P('ka-nai-ka-no-uchi-ni', 'N2', '〜か〜ないかのうちに', 'Barely … when …', '〜するとほとんど同時に。', [T('ないかのうちに', 'ないかのところで')], { group: 'time', ex: 'ベルが鳴るか鳴らないかのうちに、学生は教室を出た。' }),
  P('ni-kakete', 'N2', '〜から〜にかけて', 'From … through … (a span of time or place).', '時間・場所の範囲。', [T('にかけて', 'にかけての')], { group: 'time', generic: true, ex: '今夜から明日にかけて雪が降るでしょう。' }),
  P('ni-watatte', 'N2', '〜にわたって', 'Throughout / over (a whole span).', '〜の全体に及んで。', [T('にわたって', 'に渡って', 'にわたり', 'にわたる', 'にわたった')], { group: 'time', ex: '会議は三時間にわたって続いた。' }),
  P('ni-tsuke', 'N2', '〜につけ', 'Whenever … / every time …', '〜するといつも。', [T('につけ', 'につけて', 'につけても')], { group: 'time', ex: 'この写真を見るにつけ、昔を思い出す。' }),

  // --- Reasons & causes -----------------------------------------------------------------------
  P('mono-da-kara', 'N2', '〜ものだから', 'Because … (excuse or explanation).', '理由・言い訳。', [T('ものだから', 'もんだから', 'ものですから', 'もので'), { not: { s: ['は', 'も', 'す', 'ござい'] } }], { group: 'reason', ex: '道が混んでいたものだから、遅れてしまった。' }),
  P('koto-kara', 'N2', '〜ことから', 'From the fact that … / because …', '〜という事実から判断して。', [T('ことから')], { group: 'reason', ex: '富士山が見えることから、この町は富士見町と呼ばれる。' }),
  P('koto-da-kara', 'N2', '〜ことだから', 'Knowing (him / her), … (judging by character).', '〜の性格から考えると。', [T('ことだから', 'ことですから')], { group: 'reason', ex: 'まじめな彼のことだから、きっと時間通りに来るだろう。' }),
  P('bakari-ni', 'N2', '〜ばかりに', 'Just because … (a regrettable result).', 'それだけが原因で（悪い結果）。', [{ ...PAST, opt: true }, T('ばかりに')], { group: 'reason', generic: true, ex: '一言多かったばかりに、彼女を怒らせてしまった。' }),
  P('kara-koso', 'N2', '〜からこそ', 'Precisely because …', 'まさに〜だから。', [T('からこそ')], { group: 'reason', ex: 'あなたのことを思うからこそ、厳しく言うのだ。' }),
  P('dake-atte', 'N2', '〜だけあって', 'As you’d expect of … (praise).', '〜にふさわしく。', [T('だけあって', 'だけのことはある', 'だけのことはあって', 'だけある')], { group: 'reason', ex: 'プロだけあって、料理が本当にうまい。' }),
  P('dake-ni', 'N2', '〜だけに', 'Precisely because … (all the more).', '〜なので、なおさら。', [T('だけに'), { not: { pos: '名詞' } }], { group: 'reason', ex: '期待していただけに、がっかりした。' }),
  P('amari', 'N2', '〜あまり', 'So … that (too much, with a bad result).', '程度がひどくて。', [{ alt: [[{ s: 'の', pos: '助詞' }], [{ pos: ['動詞', '助動詞'], cform: '基本形' }]] }, { s: ['あまり', '余り'], p1: '非自立' }], { group: 'reason', ex: '心配のあまり、眠れなかった。' }),
  P('kara-to-itte', 'N2', '〜からといって', 'Just because … (doesn’t mean …).', '〜という理由だけで（〜とは言えない）。', [T('からといって', 'からって', 'からと言って')], { group: 'contrast', ex: 'お金があるからといって、幸せだとは限らない。' }),

  // --- Contrast & concession ------------------------------------------------------------------
  P('ni-mo-kakawarazu', 'N2', '〜にもかかわらず', 'Despite … / even though …', '〜なのに（書き言葉）。', [T('にもかかわらず', 'にも関わらず', 'にも拘らず', 'にも拘わらず')], { group: 'contrast', ex: '雨にもかかわらず、大勢の人が来た。' }),
  P('ni-kakawarazu', 'N2', '〜にかかわらず', 'Regardless of …', '〜に関係なく。', [T('にかかわらず', 'に関わらず', 'に拘らず', 'に拘わらず')], { group: 'contrast', ex: '年齢にかかわらず、誰でも参加できる。' }),
  P('wo-towazu', 'N2', '〜を問わず', 'Regardless of … / no matter …', '〜に関係なく。', [T('を問わず', 'をとわず', 'は問わず', 'は問いません')], { group: 'contrast', ex: 'この仕事は経験を問わず応募できる。' }),
  P('mono-no', 'N2', '〜ものの', 'Although … (but in fact).', '〜けれども（書き言葉）。', [{ pos: ['動詞', '形容詞', '助動詞'], cform: '基本形' }, T('ものの')], { group: 'contrast', ex: '車の免許は取ったものの、ほとんど運転していない。' }),
  P('nagara-mo', 'N2', '〜ながらも', 'Although … / while …', '〜けれども。', [T('ながらも', 'ながら')], { group: 'contrast', generic: true, before: { not: { pos: '動詞', cform: '連用形' } }, ex: '狭いながらも、楽しい我が家だ。' }),
  P('hanmen', 'N2', '〜反面', 'On the other hand … (two sides of the same thing).', '一つの物事の別の面。', [T('反面', '半面')], { group: 'contrast', ex: 'この薬はよく効く反面、副作用も強い。' }),
  P('ippou-de', 'N2', '〜一方（で）', 'While … / on the other hand …', '対比・並行。', [{ pos: ['動詞', '形容詞', '助動詞'], cform: '基本形', opt: true }, T('一方で', '一方では', '一方、', 'いっぽうで')], { group: 'contrast', ex: '彼は仕事をする一方で、大学にも通っている。' }),
  P('dokoro-ka', 'N2', '〜どころか', 'Far from … (actually the opposite).', '〜はもちろん、反対に。', [T('どころか')], { group: 'contrast', ex: '雨はやむどころか、ますます強くなった。' }),
  P('dokoro-dewa-nai', 'N2', '〜どころではない', 'This is no time for … / out of the question.', '〜する余裕などない。', [T('どころではない', 'どころじゃない', 'どころではありません', 'どころではなかった')], { group: 'contrast', ex: '忙しくて、旅行どころではない。' }),
  P('ni-hanshite', 'N2', '〜に反して', 'Contrary to …', '〜とは反対に。', [T('に反して', 'に反し', 'に反する', 'に反した')], { group: 'contrast', ex: '予想に反して、試合に負けた。' }),
  P('ni-shite-wa', 'N2', '〜にしては', 'For … (it’s surprisingly …).', '〜から予想されるのと違って。', [{ pos: '名詞', opt: true }, T('にしては')], { group: 'contrast', ex: '初めてにしては、上手にできた。' }),
  P('wa-tomokaku', 'N2', '〜はともかく', 'Setting … aside / regardless of …', '〜は問題にしないで。', [T('はともかく', 'はともかくとして', 'はさておき')], { group: 'contrast', ex: '値段はともかく、デザインがいい。' }),
  P('mo-kamawazu', 'N2', '〜もかまわず', 'Without caring about …', '〜を気にしないで。', [T('もかまわず', 'も構わず')], { group: 'contrast', ex: '彼は人目もかまわず泣いた。' }),

  // --- Comparison, limits, scope -------------------------------------------------------------
  P('ni-kagitte', 'N2', '〜に限って', 'Of all (times / people) … / only when …', '特にその場合だけ（不満）。', [T('に限って', 'にかぎって')], { group: 'limits', ex: '急いでいる時に限って、電車が遅れる。' }),
  P('ni-kagirazu', 'N2', '〜に限らず', 'Not just … (but also).', '〜だけでなく。', [T('に限らず', 'にかぎらず')], { group: 'limits', ex: 'この店は若者に限らず、お年寄りにも人気がある。' }),
  P('ni-kagiru', 'N2', '〜に限る', 'Nothing beats … / … is best. Also: limited to (に限り).', '〜が一番だ・〜だけ。', [T('に限る', 'に限ります', 'に限り', 'にかぎる'), { not: { s: ['と'] } }], { group: 'limits', ex: '疲れたときは寝るに限る。' }),
  P('bakari-ka', 'N2', '〜ばかりか', 'Not only … but even …', '〜だけでなく、さらに。', [T('ばかりか')], { group: 'limits', ex: '彼は漢字ばかりか、ひらがなも書けない。' }),
  P('mo-ba-mo', 'N2', '〜も〜ば〜も', 'Both … and … (listing).', '並列（〜も〜し、〜も）。', [{ s: 'も', p1: '係助詞' }, GAP(3), { s: 'ば', p1: '接続助詞' }, GAP(3), { s: 'も', p1: '係助詞' }], { group: 'limits', ex: '彼は英語も話せれば、中国語も話せる。' }),
  P('yara', 'N2', '〜やら〜やら', 'What with … and … (a messy list).', 'いろいろな物事の列挙。', [{ s: 'やら' }, GAP(4), { s: 'やら' }], { group: 'limits', ex: '引っ越しの準備やら仕事やらで忙しい。' }),
  P('hodo-wa-nai', 'N2', '〜ほど〜はない', 'Nothing is as … as …', '〜が最高だ。', [{ s: 'ほど', pos: '助詞' }, GAP(4), { s: ['は', 'も'] }, { b: 'ない' }], { group: 'limits', ex: '健康ほど大切なものはない。' }),
  P('wa-mochiron', 'N2', '〜はもちろん', 'Not to mention … / … of course, and also …', '〜は当然として、さらに。', [T('はもちろん', 'はもちろんのこと', 'はもとより')], { group: 'limits', ex: 'この店は味はもちろん、サービスもいい。' }),
  P('to-itta', 'N2', '〜といった', 'Such as … (listing examples).', '例の列挙。', [T('といった', 'などといった'), { not: { pos: ['記号', '助詞', '助動詞', '動詞'] } }], { group: 'limits', generic: true, ex: '京都や奈良といった古い町が好きだ。' }),
  P('wo-hajime', 'N2', '〜をはじめ', 'Starting with … / including …', '代表例を挙げて、他にも。', [T('をはじめとして', 'をはじめとする', 'をはじめ', 'を始め'), { not: { pos: ['助動詞', '助詞', '動詞'] } }], { group: 'limits', ex: '社長をはじめ、社員全員が参加した。' }),

  // --- Quoting & topics ----------------------------------------------------------------------
  P('to-ittemo', 'N2', '〜といっても', 'Although (I say) … — it’s only …', '〜と言っても実際は。', [T('といっても', 'と言っても', 'とはいえ', 'とはいっても')], { group: 'quote', ex: '料理ができるといっても、簡単なものだけです。' }),
  P('ni-shitara', 'N2', '〜にしたら／にすれば', 'From the standpoint of …', '〜の立場から考えると。', [{ pos: '名詞', opt: true }, T('にしたら', 'にすれば', 'にしてみれば', 'にしてみたら')], { group: 'quote', ex: '子供にしたら、親の話は退屈だろう。' }),
  P('kara-suru-to', 'N2', '〜からすると', 'Judging from … / from the standpoint of …', '〜から判断すると。', [T('からすると', 'からすれば', 'から見ると', 'から見れば', 'から見て', 'からいうと', 'から言うと', 'から言えば')], { group: 'quote', ex: '彼の話し方からすると、関西の人だろう。' }),
  P('kara-shite', 'N2', '〜からして', 'Even (just) … / starting with …', '〜一つを取ってもそうだ。', [T('からして')], { group: 'quote', ex: 'この店は、店員の態度からして気に入らない。' }),
  P('wo-megutte', 'N2', '〜をめぐって', 'Concerning / over (a dispute or debate).', '〜を中心とする議論・対立。', [T('をめぐって', 'を巡って', 'をめぐる', 'を巡る', 'をめぐり')], { group: 'quote', ex: '新しい空港の建設をめぐって、意見が分かれている。' }),
  P('ni-kakete-wa', 'N2', '〜にかけては', 'When it comes to … (no one is better).', '〜については（能力が一番）。', [T('にかけては', 'にかけても')], { group: 'quote', ex: '計算の速さにかけては、彼にかなう人はいない。' }),

  // --- Compound particles --------------------------------------------------------------------
  P('ni-oite', 'N2', '〜において', 'In / at (a place, time or field — formal).', '〜で（書き言葉）。', [T('において', 'における', 'においては', 'においても', 'に於いて')], { group: 'phrases', ex: '会議は大ホールにおいて行われる。' }),
  P('ni-oujite', 'N2', '〜に応じて', 'In accordance with / depending on …', '〜に合わせて。', [T('に応じて', 'に応じ', 'に応じた', 'におうじて')], { group: 'phrases', ex: '収入に応じて税金が決まる。' }),
  P('ni-sotte', 'N2', '〜に沿って', 'Along … / in line with …', '〜に従って・〜から離れずに。', [T('に沿って', 'に沿い', 'に沿った', 'にそって', 'に沿う')], { group: 'phrases', ex: '川に沿って桜の木が並んでいる。' }),
  P('ni-motozuite', 'N2', '〜に基づいて', 'Based on …', '〜を根拠にして。', [T('に基づいて', 'に基づき', 'に基づく', 'に基づいた', 'にもとづいて')], { group: 'phrases', ex: 'この映画は事実に基づいて作られた。' }),
  P('wo-moto-ni', 'N2', '〜をもとに', 'Based on / using … as material.', '〜を材料・ヒントにして。', [T('をもとに', 'を基に', 'を元に', 'をもとにして', 'を基にして')], { group: 'phrases', ex: 'アンケートの結果をもとに、新商品を開発した。' }),
  P('wo-tsuujite', 'N2', '〜を通じて', 'Through … (a means) / throughout (a period).', '〜を手段として・〜の間ずっと。', [T('を通じて', 'を通して', 'を通じ', 'をとおして', 'をつうじて')], { group: 'phrases', ex: '友人を通じて彼女と知り合った。' }),
  P('wo-komete', 'N2', '〜を込めて', 'With (feeling) … / full of …', '気持ちを入れて。', [T('を込めて', 'をこめて', 'を込め', 'を込めた')], { group: 'phrases', ex: '心を込めて手紙を書いた。' }),
  P('wo-kikkake-ni', 'N2', '〜をきっかけに', 'Taking … as the occasion / ever since …', '〜が始まりとなって。', [T('をきっかけに', 'をきっかけとして', 'がきっかけで', 'をきっかけにして')], { group: 'phrases', ex: '留学をきっかけに、料理を始めた。' }),
  P('ni-tomonatte', 'N2', '〜に伴って', 'Along with … / as … (changes).', '〜と一緒に変化する。', [T('に伴って', 'に伴い', 'に伴う', 'にともなって', 'にともない')], { group: 'phrases', ex: '人口の増加に伴って、住宅が不足している。' }),
  P('ni-kotaete', 'N2', '〜にこたえて', 'In response to (requests, expectations).', '〜に応じて。', [T('にこたえて', 'に応えて', 'に応え', 'に応える')], { group: 'phrases', ex: 'ファンの声援にこたえて、選手は手を振った。' }),
  P('ni-mukete', 'N2', '〜に向けて', 'Toward (a goal) …', '目標に向かって。', [T('に向けて', 'に向けた', 'に向け')], { group: 'phrases', ex: '試験に向けて、毎日勉強している。' }),
  P('ni-tsuki', 'N2', '〜につき', 'Due to … (notices) / per …', '〜のため（掲示）・〜ごとに。', [T('につき'), { not: { pos: ['動詞', '助動詞'] } }], { group: 'phrases', ex: '工事中につき、通行できません。' }),
  P('no-moto-de', 'N2', '〜のもとで', 'Under (guidance, conditions).', '〜の影響・指導の下で。', [T('のもとで', 'の下で', 'のもとに', 'の下に'), { not: { pos: '動詞', b: ['寝る', '待つ', '休む', '座る', '置く', 'ある', 'いる'] } }], { group: 'phrases', ex: '先生のもとで研究を続けている。' }),
  P('nuki-de', 'N2', '〜抜きで', 'Without … / leaving out …', '〜を除いて。', [T('抜きで', 'ぬきで', '抜きに', 'ぬきに', 'を抜きにして', 'をぬきにして', '抜きには', '抜きの')], { group: 'phrases', ex: '冗談は抜きで、真剣に話そう。' }),
];
