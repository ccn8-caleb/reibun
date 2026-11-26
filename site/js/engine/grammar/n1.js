// JLPT N1 grammar. Mostly written-style fixed phrases, matched as text (T).

import { TE, NEG_ANY, PAST, STEM, T, GAP, P } from './common.js';

const PLAIN = { pos: ['動詞', '形容詞', '助動詞'], cform: '基本形' };
const ENDS = { s: ['。', '！', '？', '!', '?', '」', '…', '、'] };
const NUM = { pos: '名詞', p1: ['数', '接尾'] };

export default [
  // --- Basic forms ---------------------------------------------------------------------
  P('meku', 'N1', '〜めく', 'Show signs of … / -ish (春めく, 皮肉めいた).', '〜らしくなる・〜のように見える。', [{ pos: '動詞', b: /^.+めく$/ }], { group: 'basics', ex: '日差しが春めいてきた。' }),
  P('gotoki', 'N1', '〜ごとき／ごとく', 'Like … / such as … (literary).', '〜のような（書き言葉）。', [{ b: ['ごとし', '如し'] }], { group: 'basics', ex: '彼のごとき人物は珍しい。' }),
  P('taru', 'N1', '〜たる', 'Who is (in the position of) … — as befits a …', '〜という立場にある。', [{ s: 'たる', pos: '助動詞' }, { s: ['もの', '者'], opt: true }], { group: 'basics', before: { pos: '名詞' }, ex: '教師たるもの、生徒の手本でなければならない。' }),
  P('mamire', 'N1', '〜まみれ', 'Covered all over in … (dirt, blood, sweat).', '全体に〜が付いている。', [{ alt: [[T('まみれ')], [{ s: /^.+まみれ$/, pos: '名詞' }]] }], { group: 'basics', ex: '子供たちは泥まみれになって遊んだ。' }),
  P('zukume', 'N1', '〜ずくめ', 'Nothing but … / full of … (often good things).', '〜ばかり。', [T('ずくめ', 'づくめ')], { group: 'basics', ex: '今年はいいことずくめの一年だった。' }),
  P('houdai', 'N1', '〜放題', 'As much as you like / unchecked (食べ放題, 荒れ放題).', '好きなだけ・したいまま。', [T('放題', 'ほうだい')], { group: 'basics', ex: 'この店は二千円で食べ放題だ。' }),
  P('tsu-tsu', 'N1', '〜つ〜つ', 'Alternately …ing and …ing (持ちつ持たれつ).', '二つの動作が交互に。', [STEM, { s: 'つ', pos: '助動詞' }, GAP(2), { s: 'つ', pos: '助動詞' }], { group: 'basics', ex: '近所の人とは持ちつ持たれつの関係だ。' }),

  // --- Particles -----------------------------------------------------------------------
  P('sura', 'N1', '〜すら', 'Even … (written: さえ).', '〜さえ（書き言葉）。', [{ s: ['すら', 'ですら'] }], { group: 'emphasis', ex: '疲れて、名前すら書けない。' }),
  P('dani', 'N1', '〜だに', 'Even (just) … (literary).', '〜するだけでも。', [{ s: 'だに' }], { group: 'emphasis', ex: '事故のことは想像するだに恐ろしい。' }),
  P('tari-tomo', 'N1', '〜たりとも', 'Not even one … (with a negative).', '〜も（〜ない）。', [T('たりとも')], { group: 'emphasis', ex: '一円たりとも無駄にできない。' }),
  P('nari-tomo', 'N1', '〜なりとも', 'At least / even a little …', '少しでも。', [T('なりとも')], { group: 'emphasis', ex: '少しなりともお役に立てれば幸いです。' }),
  P('tote', 'N1', '〜とて', 'Even … (is no exception).', '〜でも（例外ではない）。', [{ alt: [[T('とて')], [T('だって')]] }, { not: { pos: ['動詞', '助動詞'] } }], { group: 'emphasis', generic: true, before: { pos: '名詞' }, ex: '私とて、失敗することはある。' }),
  P('koso-are', 'N1', '〜こそあれ／こそすれ', 'Even if (it is …), never … / only …', '〜ことはあっても（〜ない）。', [T('こそあれ', 'こそすれ')], { group: 'emphasis', ex: '感謝こそすれ、恨むことなどない。' }),
  P('nomi', 'N1', '〜のみ', 'Only … (written: だけ).', '〜だけ（書き言葉）。', [{ s: 'のみ', pos: '助詞' }, { not: { s: ['なら'] } }], { group: 'limits', ex: '合格者のみ面接を受けられる。' }),
  P('nomi-narazu', 'N1', '〜のみならず', 'Not only … (but also).', '〜だけでなく（書き言葉）。', [T('のみならず')], { group: 'limits', ex: '彼は国内のみならず、海外でも有名だ。' }),
  P('wa-oroka', 'N1', '〜はおろか', 'Let alone … / not to mention …', '〜は言うまでもなく。', [T('はおろか')], { group: 'limits', ex: '漢字はおろか、ひらがなも書けない。' }),

  // --- Time ----------------------------------------------------------------------------------
  P('ya-ina-ya', 'N1', '〜や否や', 'The moment … / as soon as …', '〜するとすぐに。', [T('や否や', 'やいなや')], { group: 'time', ex: 'ベルが鳴るや否や、学生たちは教室を飛び出した。' }),
  P('ga-hayai-ka', 'N1', '〜が早いか', 'No sooner … than …', '〜するとほとんど同時に。', [T('が早いか', 'がはやいか')], { group: 'time', ex: '彼は家に帰るが早いか、テレビをつけた。' }),
  P('nari', 'N1', '〜なり（すぐ）', 'As soon as … (and then, unexpectedly).', '〜するとすぐに。', [{ pos: '動詞', cform: '基本形' }, { s: 'なり', pos: '助詞' }, { s: '、' }], { group: 'time', generic: true, ex: '彼は部屋に入るなり、泣き出した。' }),
  P('soba-kara', 'N1', '〜そばから', 'No sooner … than (again and again).', '〜してもすぐに（繰り返し）。', [T('そばから')], { group: 'time', ex: '覚えるそばから忘れてしまう。' }),
  P('te-kara-to-iu-mono', 'N1', '〜てからというもの', 'Ever since … (a big change).', '〜してから後ずっと。', [TE, T('からというもの')], { group: 'time', ex: '子供が生まれてからというもの、生活が大きく変わった。' }),
  P('wo-kagiri-ni', 'N1', '〜を限りに', 'As of … (and no longer).', '〜を最後に。', [T('を限りに', 'をかぎりに')], { group: 'time', ex: '今日を限りに、タバコをやめる。' }),
  P('wo-kawakiri-ni', 'N1', '〜を皮切りに', 'Starting with … (and then many more).', '〜を始まりとして。', [T('を皮切りに', 'を皮切りとして', 'を皮切りにして')], { group: 'time', ex: '東京を皮切りに、全国でコンサートを行う。' }),
  P('wo-keiki-ni', 'N1', '〜を契機に', 'Taking … as an opportunity (formal).', '〜をきっかけに（書き言葉）。', [T('を契機に', 'を契機として', 'を契機にして')], { group: 'time', ex: '入院を契機に、生活を見直した。' }),
  P('ni-itatte', 'N1', '〜に至って／に至るまで', 'Only when it came to … / (all the way) down to …', '〜という段階になって・〜まで。', [T('に至って', 'に至っては', 'に至るまで', 'に至る', 'に至り', 'にいたって', 'にいたるまで')], { group: 'time', ex: '事故が起きるに至って、ようやく対策が取られた。' }),
  P('ni-shite', 'N1', '〜にして', 'Only at … (年齢・段階) / at the same time …', '〜という段階で初めて。', [T('にして'), { s: ['初めて', 'はじめて', 'ようやく', 'やっと', 'すでに', '既に'] }], { group: 'time', ex: '四十歳にして初めて結婚した。' }),
  P('ga-saigo', 'N1', '〜が最後', 'Once … (there’s no going back).', '〜したら、もう終わり。', [T('が最後', 'たら最後', 'だら最後')], { group: 'condition', ex: 'この本は読み始めたが最後、やめられない。' }),

  // --- Conditions ----------------------------------------------------------------------------
  P('ou-ga', 'N1', '〜（よ）うが／うと', 'No matter (what / how) … — even if …', '〜しても関係ない。', [{ pos: '動詞', cform: /^未然/, opt: true }, { b: ['う', 'よう'], pos: '助動詞' }, { s: ['が', 'と'], pos: '助詞' }, { s: '、' }], { group: 'condition', ex: '何を言われようが、気にしない。' }),
  P('de-are', 'N1', '〜であれ', 'Whether it be … / even if it is …', '〜でも（関係なく）。', [T('であれ', 'であろうと', 'であろうが')], { group: 'condition', ex: 'どんな理由であれ、遅刻は許されない。' }),
  P('to-areba', 'N1', '〜とあれば', 'If it’s (for) … (then I’ll do anything).', '〜という事情なら。', [T('とあれば', 'とあらば')], { group: 'condition', ex: '子供のためとあれば、親は何でもする。' }),
  P('naku-shite-wa', 'N1', '〜なくしては／なしには', 'Without … (it would be impossible).', '〜がなければ。', [T('なくしては', 'なくして', 'なしには', 'なしに', 'なしでは')], { group: 'condition', generic: true, ex: '皆さんの協力なくしては、成功できなかった。' }),
  P('koto-nashi-ni', 'N1', '〜ことなしに', 'Without …ing.', '〜しないで。', [T('ことなしに', 'ことなしには', 'ことなく')], { group: 'condition', ex: '努力することなしに、成功はない。' }),
  P('ba-sore-made', 'N1', '〜ばそれまでだ', 'If … then that’s the end of it.', '〜したら、もう終わりだ。', [T('ばそれまでだ', 'ばそれまで', 'たらそれまでだ', 'たらそれまで')], { group: 'condition', ex: 'いくらお金を貯めても、死んでしまえばそれまでだ。' }),
  P('you-mono-nara', 'N1', '〜ようものなら', 'If you were to … (something terrible would happen).', 'もし〜したら大変なことになる。', [T('ようものなら', 'うものなら')], { group: 'condition', ex: '父に口答えしようものなら、ひどく叱られる。' }),
  P('nara-mada-shimo', 'N1', '〜ならまだしも', '… would be one thing, but …', '〜ならまだ許せるが。', [T('ならまだしも', 'ならともかく')], { group: 'condition', ex: '一度ならまだしも、何度も同じミスをするのは困る。' }),
  P('tomo-naru-to', 'N1', '〜ともなると', 'When it comes to (a higher level) …', '〜という立場・段階になると。', [T('ともなると', 'ともなれば')], { group: 'condition', ex: '大学生ともなると、自分で考えて行動しなければならない。' }),
  P('ikan', 'N1', '〜いかんで／いかんによらず', 'Depending on … / regardless of …', '〜次第で・〜に関係なく。', [T('いかんで', 'いかんでは', 'いかんによって', 'いかんだ', 'いかんによらず', 'いかんにかかわらず', 'いかんを問わず', '如何で', '如何によらず')], { group: 'condition', ex: '結果いかんで、今後の方針を決める。' }),

  // --- Reasons & causes -----------------------------------------------------------------------
  P('yue', 'N1', '〜ゆえ（に）', 'Because of … (formal, written).', '〜のため（書き言葉）。', [T('ゆえに', '故に', 'ゆえの', 'ゆえ', '故')], { group: 'reason', before: { pos: ['名詞', '助動詞', '動詞', '形容詞', '助詞'], not: { s: ['が', 'を', 'は', 'に', 'で'] } }, ex: '病気ゆえに、欠席した。' }),
  P('to-atte', 'N1', '〜とあって', 'Because (it’s a special situation) …', '〜という特別な事情なので。', [T('とあって')], { group: 'reason', ex: '連休とあって、観光地はどこも混んでいる。' }),
  P('koto-tote', 'N1', '〜こととて', 'Since … (an apologetic reason).', '〜なので（謝罪の理由）。', [T('こととて')], { group: 'reason', ex: '慣れないこととて、ご迷惑をおかけしました。' }),
  P('n-ga-tame', 'N1', '〜んがため', 'In order to … (strong, literary).', '〜するために（強い目的）。', [T('んがため', 'んがために', 'んがための')], { group: 'intent', ex: '彼は勝たんがために練習した。' }),
  P('beku', 'N1', '〜べく', 'In order to … (formal).', '〜するために（書き言葉）。', [{ s: 'べく', b: 'べし' }, { not: { s: ['も', 'して'] } }], { group: 'intent', ex: '合格すべく、毎日勉強している。' }),
  P('ni-kakotsukete', 'N1', '〜にかこつけて', 'Using … as an excuse.', '〜を口実にして。', [T('にかこつけて')], { group: 'reason', ex: '仕事にかこつけて、家族旅行を断った。' }),
  P('wo-ii-koto-ni', 'N1', '〜をいいことに', 'Taking (unfair) advantage of …', '〜を都合よく利用して。', [T('をいいことに', 'をいい事に')], { group: 'reason', ex: '親が留守なのをいいことに、子供たちは夜遅くまで遊んだ。' }),

  // --- Contrast & concession ------------------------------------------------------------------
  P('to-iedomo', 'N1', '〜といえども', 'Even though … / even (a …).', '〜であっても。', [T('といえども', 'と言えども')], { group: 'contrast', ex: '子供といえども、ルールは守らなければならない。' }),
  P('to-omoikiya', 'N1', '〜と思いきや', 'I thought … but (unexpectedly) …', '〜と思ったが、意外にも。', [T('と思いきや', 'かと思いきや')], { group: 'contrast', ex: '簡単に勝てると思いきや、意外に苦戦した。' }),
  P('mono-wo', 'N1', '〜ものを', 'If only … (but you didn’t) — regret / reproach.', '〜のに（不満・後悔）。', [T('ものを'), ENDS], { group: 'contrast', ex: '早く言ってくれれば手伝ったものを。' }),
  P('ni-hikikae', 'N1', '〜にひきかえ', 'In contrast to …', '〜とは反対に。', [T('にひきかえ', 'に引き換え', 'に引きかえ')], { group: 'contrast', ex: '兄にひきかえ、弟は勉強が苦手だ。' }),
  P('nai-made-mo', 'N1', '〜ないまでも', 'Even if not …, at least …', '〜ほどではなくても。', [T('ないまでも')], { group: 'contrast', ex: '毎日とは言わないまでも、週に一度は運動したい。' }),
  P('wo-yoso-ni', 'N1', '〜をよそに', 'Ignoring / despite (others’ concerns).', '〜を気にしないで。', [T('をよそに')], { group: 'contrast', ex: '親の心配をよそに、彼は一人で旅に出た。' }),
  P('wo-mono-tomo-sezu', 'N1', '〜をものともせず', 'Undaunted by …', '困難に負けないで。', [T('をものともせず', 'をものともせずに')], { group: 'contrast', ex: '彼は怪我をものともせず、試合に出た。' }),
  P('de-wa-arumai-shi', 'N1', '〜ではあるまいし', 'It’s not as if … (so don’t …).', '〜ではないのだから。', [T('ではあるまいし', 'じゃあるまいし')], { group: 'contrast', ex: '子供ではあるまいし、自分でやりなさい。' }),
  P('ni-shita-tokoro-de', 'N1', '〜にしたところで', 'Even for … (it’s the same).', '〜の場合でも。', [{ pos: '名詞', opt: true }, T('にしたところで', 'としたところで', 'にしたって', 'としたって')], { group: 'contrast', ex: '社長にしたところで、この問題は解決できない。' }),
  P('kai-mo-naku', 'N1', '〜かいもなく', 'Despite (all the effort), in vain.', '努力の効果がなく。', [T('かいもなく', '甲斐もなく', 'かいがない', '甲斐がない')], { group: 'contrast', ex: '必死の看病のかいもなく、祖父は亡くなった。' }),

  // --- Judgement & feeling -------------------------------------------------------------------
  P('kiwamaru', 'N1', '〜極まる／極まりない', 'Extremely … (formal, usually negative).', 'この上なく〜だ。', [T('極まる', '極まりない', 'きわまる', 'きわまりない', '極まりません', '極まった')], { group: 'attitude', ex: '彼の態度は失礼極まりない。' }),
  P('no-itari', 'N1', '〜の至り', 'The height of … (deeply felt).', 'この上なく〜だ。', [T('の至り', 'のいたり')], { group: 'attitude', ex: 'このような賞をいただき、光栄の至りです。' }),
  P('no-kiwami', 'N1', '〜の極み', 'The peak / utmost of …', '最高の程度。', [T('の極み', 'のきわみ')], { group: 'attitude', ex: '一流のホテルで贅沢の極みを味わった。' }),
  P('kagiri-da', 'N1', '〜限りだ', 'I feel extremely … (strong emotion).', '最高に〜と感じる。', [{ pos: '形容詞', cform: '基本形', opt: true }, T('限りだ', 'かぎりだ', '限りです', 'かぎりです')], { group: 'attitude', ex: '友達がみんな結婚して、うらやましい限りだ。' }),
  P('to-ittara-nai', 'N1', '〜といったらない', 'Incredibly … (beyond words).', '言い表せないほど〜だ。', [T('といったらない', 'といったらありはしない', 'といったらありゃしない', 'ったらない')], { group: 'attitude', ex: '一人で留守番する夜の寂しさといったらない。' }),
  P('te-yamanai', 'N1', '〜てやまない', 'Sincerely … (always: hope / love).', '心から〜し続ける。', [TE, T('やまない', 'やみません')], { group: 'attitude', ex: '皆様のご健康を願ってやみません。' }),
  P('wo-kinjienai', 'N1', '〜を禁じ得ない', 'Can’t help feeling …', '〜の気持ちを抑えられない。', [T('を禁じ得ない', 'を禁じえない', 'を禁じ得ません', 'を禁じ得なかった', 'を禁じえなかった')], { group: 'attitude', ex: '被害者の話を聞いて、涙を禁じ得なかった。' }),
  P('zu-ni-wa-okanai', 'N1', '〜ずにはおかない', 'Will certainly / inevitably … (cause a feeling).', '必ず〜させる。', [T('ずにはおかない', 'ないではおかない', 'ずにはおかなかった', 'ずにはおきません')], { group: 'attitude', ex: 'この映画は見る人を感動させずにはおかない。' }),
  P('zu-ni-wa-sumanai', 'N1', '〜ずにはすまない', 'Will have to … (it can’t be avoided).', '〜しないわけにはいかない。', [T('ずにはすまない', 'ずには済まない', 'ないではすまない', 'ないでは済まない', 'ずにはすまされない')], { group: 'modality', ex: '人の物を壊したのだから、謝らずにはすまない。' }),
  P('ni-katakunai', 'N1', '〜に難くない', 'It is easy to (imagine) …', '簡単に〜できる。', [T('に難くない', 'にかたくない')], { group: 'evidential', ex: '彼の苦労は想像に難くない。' }),
  P('kirai-ga-aru', 'N1', '〜きらいがある', 'Have a (bad) tendency to …', '〜する傾向がある（好ましくない）。', [T('きらいがある', '嫌いがある', 'きらいがあります')], { group: 'evidential', ex: '彼は物事を大げさに言うきらいがある。' }),
  P('shimatsu-da', 'N1', '〜始末だ', 'End up … (a bad outcome, after everything).', '悪い結果になってしまう。', [T('始末だ', 'しまつだ', '始末です', '始末である')], { group: 'attitude', ex: '彼は遅刻ばかりで、ついには無断欠勤する始末だ。' }),
  P('made-da', 'N1', '〜までだ', 'I’ll just (do) … / It’s only that …', '〜するだけだ・〜しただけだ。', [T('までだ', 'までのことだ', 'までです', 'までのことです')], { group: 'attitude', generic: true, ex: 'だめなら、もう一度やるまでだ。' }),
  P('made-mo-nai', 'N1', '〜までもない', 'There’s no need to (go as far as) …', '〜する必要もない。', [{ alt: [[T('までもない', 'までもありません', 'までもなく')], [{ b: /^.+までもない$/ }]] }], { group: 'modality', ex: 'そんなことは言うまでもない。' }),
  P('to-iu-tokoro-da', 'N1', '〜といったところだ', 'About … at most / roughly …', 'せいぜい〜程度だ。', [T('といったところだ', 'というところだ', 'といったところです', 'というところです', 'といったところだろう', 'というところだろう', 'といったところでしょう')], { group: 'evidential', ex: '参加者は多くても五十人といったところだ。' }),
  P('de-nakute-nan-darou', 'N1', '〜でなくてなんだろう', 'If this isn’t … then what is? (it is truly …)', 'まさに〜だ。', [T('でなくてなんだろう', 'でなくて何だろう', 'でなくてなんであろう', 'でなくて何であろう')], { group: 'attitude', ex: 'これが運命でなくてなんだろう。' }),
  P('te-shikarubeki', 'N1', '〜てしかるべきだ', 'Ought to … / it would be proper to …', '〜するのが当然だ。', [TE, T('しかるべき', '然るべき')], { group: 'modality', ex: 'こんな危険な道には、信号があってしかるべきだ。' }),
  P('bekarazu', 'N1', '〜べからず', 'Must not … (signs, rules).', '〜してはいけない（禁止）。', [T('べからず', 'べからざる')], { group: 'modality', ex: 'ここで釣りをするべからず。' }),
  P('majiki', 'N1', '〜まじき', 'Unbecoming of … / should not …', '〜としてあってはならない。', [T('まじき')], { group: 'modality', ex: '教師にあるまじき行為だ。' }),
  P('beku-mo-nai', 'N1', '〜べくもない', 'Can’t possibly …', '〜できるはずがない。', [T('べくもない', 'べくもありません')], { group: 'modality', ex: 'プロの選手に勝つことは望むべくもない。' }),
  P('nai-mono-demo-nai', 'N1', '〜ないものでもない', 'It’s not impossible that … / might (if …)', '条件次第では〜する。', [T('ないものでもない', 'ないものでもありません', 'ないでもない')], { group: 'modality', ex: '条件によっては、引き受けないものでもない。' }),
  P('wo-yogi-naku-sareru', 'N1', '〜を余儀なくされる', 'Be forced to …', '仕方なく〜させられる。', [T('を余儀なくされ', 'を余儀なくさせ', 'を余儀なく')], { group: 'modality', ex: '大雨のため、試合は中止を余儀なくされた。' }),
  P('te-made', 'N1', '〜てまで', 'Even going so far as to …', '極端なことをしてでも。', [TE, { s: 'まで', pos: '助詞' }], { group: 'emphasis', ex: '借金をしてまで、車を買いたくない。' }),
  P('te-habakaranai', 'N1', '〜てはばからない', 'Not hesitate to … (boldly).', '遠慮しないで〜する。', [TE, T('はばからない', '憚らない', 'はばからず')], { group: 'attitude', ex: '彼は自分が天才だと言ってはばからない。' }),

  // --- Appearance, hearsay ------------------------------------------------------------------
  P('n-bakari', 'N1', '〜んばかり', 'As if about to … (almost).', '今にも〜しそうなほど。', [T('んばかり', 'んばかりに', 'んばかりの', 'んばかりだ')], { group: 'evidential', ex: '彼女は泣き出さんばかりの顔をしていた。' }),
  P('to-bakari-ni', 'N1', '〜とばかりに', 'As if to say … (showing it in actions).', 'いかにも〜と言うように。', [T('とばかりに', 'と言わんばかりに', 'といわんばかりに')], { group: 'evidential', ex: '彼は帰れとばかりに、ドアを開けた。' }),
  P('to-mieru', 'N1', '〜とみえる', 'It seems that … (judging from what I see).', '様子から判断すると〜らしい。', [T('とみえる', 'と見える', 'とみえて', 'と見えて', 'とみえ', 'と見え')], { group: 'evidential', ex: '彼は相当疲れているとみえて、すぐに寝てしまった。' }),
  P('to-oboshiki', 'N1', '〜とおぼしき', 'Apparently … / seemingly … (written).', '〜と思われる。', [T('とおぼしき', 'と思しき')], { group: 'evidential', ex: '犯人とおぼしき男が逮捕された。' }),
  P('to-wa', 'N1', '〜とは（驚き）', 'To think that …! (surprise).', '驚き・意外な気持ち。', [PLAIN, { s: 'と', pos: '助詞' }, { s: 'は' }, { alt: [[{ s: ['。', '！', '…', '!', '、'] }], [{ b: ['思う', 'おもう', '驚く'] }], [{ s: ['夢にも', '信じ', '思わ'] }]] }], { group: 'evidential', ex: 'まさか彼が優勝するとは。' }),

  // --- Comparison, limits, scope -------------------------------------------------------------
  P('ni-todomarazu', 'N1', '〜にとどまらず', 'Not limited to … (it extends further).', '〜の範囲を超えて。', [T('にとどまらず', 'に留まらず')], { group: 'limits', ex: 'その影響は国内にとどまらず、世界中に広がった。' }),
  P('wo-oite', 'N1', '〜をおいて', 'Apart from … (there is no one / nothing else).', '〜以外には（ない）。', [T('をおいて', 'を置いて'), { s: ['他', 'ほか', '外'] }], { group: 'limits', ex: 'このチームのリーダーは、彼をおいて他にいない。' }),
  P('ni-mo-mashite', 'N1', '〜にもまして', 'Even more than …', '〜以上に。', [T('にもまして', 'にも増して')], { group: 'limits', ex: '今年は去年にもまして暑い。' }),
  P('kara-aru', 'N1', '〜からある／からする', 'As much as … (emphasizing a large amount).', '〜以上もある（量の強調）。', [NUM, T('からある', 'からする', 'からの')], { group: 'limits', ex: '十キロからある荷物を一人で運んだ。' }),
  P('naradewa', 'N1', '〜ならでは', 'Unique to … / only … could …', '〜だけにある・〜だからこそ。', [T('ならでは', 'ならではの')], { group: 'limits', ex: 'これは京都ならではの景色だ。' }),
  P('nari-ni', 'N1', '〜なりに', 'In one’s own way / as far as … goes.', '〜にふさわしい程度に。', [T('なりに', 'なりの')], { group: 'limits', before: { pos: ['名詞', '形容詞', '助動詞'] }, ex: '子供は子供なりに考えている。' }),
  P('nari-nari', 'N1', '〜なり〜なり', 'Either … or … (some such option).', '例を挙げて選ばせる。', [{ s: 'なり', pos: '助詞' }, GAP(4), { s: 'なり', pos: '助詞' }], { group: 'limits', ex: '電話するなりメールするなりして、連絡してください。' }),
  P('to-ii-to-ii', 'N1', '〜といい〜といい', 'Both … and … (in every respect).', 'どの点から見ても。', [T('といい'), GAP(4), T('といい')], { group: 'limits', ex: '味といい値段といい、この店は最高だ。' }),
  P('mo-saru-koto-nagara', 'N1', '〜もさることながら', '… is important, but even more so …', '〜もそうだが、さらに。', [T('もさることながら')], { group: 'limits', ex: 'この店は味もさることながら、サービスが素晴らしい。' }),
  P('ni-taru', 'N1', '〜に足る', 'Worthy of … / enough to …', '〜する価値がある。', [T('に足る', 'に足りない', 'に足らない', 'にたる')], { group: 'evidential', ex: '彼は信頼に足る人物だ。' }),
  P('ni-taeru', 'N1', '〜にたえる／たえない', 'Worth …ing / unbearable to … (見るにたえない).', '〜する価値がある／〜できない。', [T('にたえる', 'に堪える', 'に耐える', 'にたえない', 'に堪えない', 'に耐えない', 'にたえません')], { group: 'evidential', ex: 'その番組は見るにたえない。' }),

  // --- Quoting & topics ----------------------------------------------------------------------
  P('to-kitara', 'N1', '〜ときたら', 'When it comes to … (complaint).', '〜について言えば（不満）。', [T('ときたら', 'ってきたら')], { group: 'quote', ex: 'うちの息子ときたら、ゲームばかりしている。' }),
  P('ni-kakawaru', 'N1', '〜にかかわる', 'Concerning / affecting (something serious).', '〜に関係する（重大なこと）。', [T('にかかわる', 'に関わる', 'に係わる', 'にかかわります', 'に関わります')], { group: 'quote', ex: 'これは命にかかわる問題だ。' }),
  P('ni-sokushite', 'N1', '〜に即して', 'In line with / based on (rules, facts).', '〜に合わせて・〜に従って。', [T('に即して', 'に即した', 'に即し', 'に則して', 'に則って', 'に則った', 'にのっとって', 'にのっとり')], { group: 'phrases', ex: '規則に即して処理してください。' }),
  P('ni-atte', 'N1', '〜にあって', 'In (a situation / position) …', '〜という状況で。', [T('にあって', 'にあっては', 'にあっても')], { group: 'phrases', ex: '厳しい状況にあって、彼は最後まで諦めなかった。' }),
  P('to-aimatte', 'N1', '〜と相まって', 'Combined with …', '〜と一緒になって効果が高まる。', [{ alt: [[T('と相まって', 'とあいまって', 'と相まった', 'も相まって')], [{ s: ['相まって', 'あいまって', '相まった'] }]] }], { group: 'phrases', ex: '才能と努力が相まって、彼は成功した。' }),
  P('ni-sakigakete', 'N1', '〜に先駆けて', 'Ahead of … / before anyone else …', '他より先に。', [T('に先駆けて', 'に先駆け', 'にさきがけて')], { group: 'phrases', ex: 'この会社は他社に先駆けて新製品を発売した。' }),
  P('wo-fumaete', 'N1', '〜を踏まえて', 'Based on / taking into account …', '〜を前提・根拠として。', [T('を踏まえて', 'を踏まえ', 'をふまえて', 'を踏まえた')], { group: 'phrases', ex: '調査の結果を踏まえて、計画を立てた。' }),
  P('wo-hete', 'N1', '〜を経て', 'Via … / after going through …', '〜を通過して・〜の段階を通って。', [T('を経て', 'をへて', 'を経た')], { group: 'phrases', ex: '長い交渉を経て、ようやく契約が成立した。' }),
  P('wo-motte', 'N1', '〜をもって', 'With / by means of … ; as of (a date) (formal).', '〜で（手段・時点、改まった言い方）。', [T('をもって', 'を以て', 'をもちまして', 'をもってすれば', 'をもってしても')], { group: 'formal', ex: '本日をもって、この店は閉店いたします。' }),
  P('atte-no', 'N1', '〜あっての', 'Only possible because of …', '〜があるからこそ成り立つ。', [T('あっての')], { group: 'formal', ex: 'お客様あっての商売です。' }),
  P('gatera', 'N1', '〜がてら', 'While (doing) … / on the way, also …', '〜のついでに。', [T('がてら')], { group: 'formal', ex: '散歩がてら、パンを買いに行った。' }),
  P('katagata', 'N1', '〜かたがた', 'Also by way of … (formal combined purpose).', '〜を兼ねて。', [T('かたがた')], { group: 'formal', ex: 'ご挨拶かたがた、お伺いしました。' }),
  P('katawara', 'N1', '〜かたわら', 'Besides (one’s main work), also …', '本業の他に。', [T('かたわら', '傍ら')], { group: 'formal', ex: '彼は会社に勤めるかたわら、小説を書いている。' }),
  P('zujimai', 'N1', '〜ずじまい', 'Ended up never …', '結局〜しないで終わった。', [T('ずじまい', 'ずじまいだ', 'ず終い')], { group: 'formal', ex: '忙しくて、結局その映画は見ずじまいだった。' }),
  P('zutomo', 'N1', '〜ずとも', 'Even without …', '〜しなくても。', [T('ずとも')], { group: 'formal', ex: '言わずとも分かるだろう。' }),
  P('zu-shite', 'N1', '〜ずして', 'Without … (literary).', '〜しないで（書き言葉）。', [T('ずして')], { group: 'formal', ex: '戦わずして負けるわけにはいかない。' }),
  P('nagara-ni', 'N1', '〜ながらに（の）', 'While (still) … / as it is (涙ながらに, 生まれながらの).', '〜のままの状態で。', [T('ながらに', 'ながらの', 'ながらにして')], { group: 'formal', ex: '彼女は涙ながらに事情を話した。' }),
  P('temae', 'N1', '〜手前', 'Since (I said / in front of …), I can’t …', '〜した立場上・〜の前で。', [{ alt: [[PLAIN], [PAST], [{ s: 'の' }]] }, T('手前', 'てまえ')], { group: 'formal', ex: '行くと言った手前、今さら断れない。' }),
  P('ba-koso', 'N1', '〜ばこそ', 'Precisely because … (literary).', 'まさに〜からこそ。', [T('ばこそ')], { group: 'formal', ex: '君のことを思えばこそ、注意するのだ。' }),
  P('ni-mo-hodo-ga-aru', 'N1', '〜にもほどがある', 'There’s a limit to … (too much!).', '〜すぎる（非難）。', [T('にもほどがある', 'にも程がある')], { group: 'attitude', ex: '冗談にもほどがある。' }),
];
