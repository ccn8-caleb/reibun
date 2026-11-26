// Connectives outside the JLPT grammar lists (しかし, したがって, つまり…): the words
// that link sentences into an argument. Each has a logic function (see logic.js) so a
// paragraph's line of reasoning can be traced. `initial`: only at the start of a
// sentence or clause (after 、, 。 or 「), where they work as connectives.

import { T, P } from './common.js';

// One connective token (接続詞) as is; any other spelling only when a comma follows,
// so ただで or 実際に行った don't count.
const CONN = (texts) => ({ alt: [[{ s: texts, pos: '接続詞' }], [T(...texts), { ahead: { s: ['、', ','] } }]] });

// C(id, logic, label, en, ja, texts, ex)
const C = (id, logic, label, en, ja, texts, ex) => P(id, 'extra', label, en, ja, [CONN(texts)], { group: 'connectives', logic, initial: true, ex });

export default [
  // --- Adding ----------------------------------------------------------------------------
  C('c-soshite', 'addition', 'そして', 'And (then) — adds the next point or step.', '前の内容に付け加える・続ける。', ['そして'], 'そして、彼は家に帰った。'),
  C('c-mata', 'addition', 'また', 'Also / in addition (formal).', '別の事柄を付け加える。', ['また'], 'また、この町は温泉でも有名だ。'),
  C('c-sarani', 'addition', 'さらに', 'Furthermore / what’s more.', 'それに加えて（程度を高める）。', ['さらに', '更に'], 'さらに、値段も安い。'),
  C('c-shikamo', 'addition', 'しかも', 'Moreover / and on top of that (often surprising).', 'その上（意外さ・強調）。', ['しかも'], 'しかも、彼は一度も遅刻したことがない。'),
  C('c-soreni', 'addition', 'それに', 'Besides / and also (conversational).', 'その上（話し言葉）。', ['それに'], 'それに、今日は雨も降っている。'),
  C('c-sono-ue', 'addition', 'その上', 'On top of that / in addition.', 'それに加えて。', ['その上', 'そのうえ'], 'その上、駅からも近い。'),
  C('c-omakeni', 'addition', 'おまけに', 'To make matters worse / and what’s more.', 'さらに（よくないことが重なる）。', ['おまけに'], 'おまけに、財布まで忘れてしまった。'),
  C('c-kuwaete', 'addition', '加えて', 'In addition (formal).', 'それに加えて（書き言葉）。', ['加えて', 'くわえて'], '加えて、交通の便もいい。'),
  C('c-nao', 'addition', 'なお', 'Note that … / additionally (an extra remark).', '補足の情報を付け加える。', ['なお', '尚'], 'なお、詳細は後日お知らせします。'),

  // --- Contrast ----------------------------------------------------------------------------
  C('c-shikashi', 'contrast', 'しかし', 'However / but.', '前の内容と反対のことを述べる。', ['しかし', 'しかしながら'], 'しかし、結果は予想と違った。'),
  C('c-demo', 'contrast', 'でも', 'But (conversational).', 'しかし（話し言葉）。', ['でも', 'だけど', 'けど', 'けれども', 'けれど'], 'でも、それは無理だと思う。'),
  C('c-daga', 'contrast', 'だが', 'But / however (plain written style).', 'しかし（書き言葉・普通体）。', ['だが', 'ですが'], 'だが、誰も気づかなかった。'),
  C('c-tokoroga', 'contrast', 'ところが', 'But (unexpectedly) / however, it turned out …', '予想に反して。', ['ところが'], 'ところが、店は閉まっていた。'),
  C('c-ippou', 'contrast', '一方', 'Meanwhile / on the other hand.', '別の面・別の状況と比べて。', ['一方', 'いっぽう', '他方'], '一方、地方では人口が減っている。'),
  C('c-sore-ni-taishite', 'contrast', 'それに対して', 'In contrast (to that).', '前の内容と対比して。', ['それに対して', 'これに対して', 'それに対し'], 'それに対して、弟はとても静かだ。'),
  C('c-gyaku-ni', 'contrast', '逆に／反対に', 'Conversely / on the contrary.', '前の内容と反対に。', ['逆に', '反対に', 'むしろ'], '逆に、高すぎる物は売れない。'),

  // --- Concession --------------------------------------------------------------------------
  C('c-motto-mo', 'concession', 'もっとも', 'Mind you / admittedly … (a qualification).', '前の内容に条件・例外を付け加える。', ['もっとも'], 'もっとも、例外もある。'),
  C('c-tadashi', 'concession', 'ただし', 'However / provided that (a condition or exception).', '条件・例外を付け加える。', ['ただし', '但し'], 'ただし、日曜日は休みです。'),
  C('c-to-wa-ie', 'concession', 'とはいえ', 'That said / even so.', 'そうは言っても。', ['とはいえ', 'とは言え', 'とはいっても', 'そうはいっても', 'そうは言っても'], 'とはいえ、油断はできない。'),
  C('c-soredemo', 'concession', 'それでも', 'Even so / still.', 'そうであっても。', ['それでも', 'それにしても', 'にもかかわらず', 'それにもかかわらず'], 'それでも、彼は諦めなかった。'),
  C('c-tashika-ni', 'concession', '確かに〜が', 'Admittedly / it’s true that … (but).', '相手の意見を一部認める。', ['確かに', 'たしかに', 'もちろん', '無論'], '確かに、便利だが値段が高い。'),

  // --- Cause ---------------------------------------------------------------------------------
  C('c-nazenara', 'cause', 'なぜなら', 'Because / the reason is … (a reason follows).', '理由を後から説明する。', ['なぜなら', 'なぜならば', 'なぜかというと', 'なぜかと言うと', 'どうしてかというと'], 'なぜなら、時間が足りなかったからだ。'),
  C('c-to-iu-no-mo', 'cause', 'というのも', 'That’s because … / the thing is …', '理由を付け加えて説明する。', ['というのも', 'というのは'], 'というのも、彼は昔ここに住んでいたからだ。'),
  C('c-sono-riyuu', 'cause', 'その理由は', 'The reason for that is …', '理由を述べる。', ['その理由は', 'その原因は', '理由は', '原因は'], 'その理由は、天気が悪かったことだ。'),

  // --- Result ----------------------------------------------------------------------------------
  C('c-dakara', 'result', 'だから／ですから', 'So / therefore (conversational).', '前の内容の結果として。', ['だから', 'ですから', 'なので', 'だもんで'], 'だから、明日は休みます。'),
  C('c-shitagatte', 'result', 'したがって', 'Therefore / consequently (formal).', 'その結果として（書き言葉）。', ['したがって', '従って', 'よって', 'ゆえに', '故に'], 'したがって、この計画は中止する。'),
  C('c-sono-tame', 'result', 'そのため', 'Because of that / for that reason.', 'それが原因で。', ['そのため', 'そのために', 'このため'], 'そのため、電車が止まった。'),
  C('c-sorede', 'result', 'それで', 'And so / that’s why.', 'それが理由で（話し言葉）。', ['それで', 'で'], 'それで、会社を辞めることにした。'),
  C('c-sono-kekka', 'result', 'その結果', 'As a result.', '結果として。', ['その結果', '結果として', '結果的に'], 'その結果、売り上げが二倍になった。'),
  C('c-sokode', 'result', 'そこで', 'So (in response to that) / thereupon.', 'その状況を受けて（対応する）。', ['そこで'], 'そこで、専門家に相談することにした。'),
  C('c-suruto', 'result', 'すると', 'Then / thereupon (what happened next).', 'その後すぐに・その結果。', ['すると', 'そうすると'], 'すると、ドアが開いた。'),

  // --- Condition -------------------------------------------------------------------------------
  C('c-sorenara', 'condition', 'それなら', 'In that case / if so.', 'その場合は。', ['それなら', 'それならば', 'だったら', 'でしたら', 'そうしたら', 'そしたら'], 'それなら、私が行きます。'),
  C('c-sou-sureba', 'condition', 'そうすれば', 'If you do that / then …', 'そのようにすれば。', ['そうすれば', 'そうすると', 'こうすれば'], 'そうすれば、もっと早く終わる。'),
  C('c-samonaito', 'condition', 'さもないと', 'Otherwise / or else.', 'そうしないと。', ['さもないと', 'さもなければ', 'でないと', 'そうでないと', 'そうでなければ'], 'さもないと、電車に遅れるよ。'),

  // --- Example -------------------------------------------------------------------------------
  C('c-tatoeba', 'example', '例えば', 'For example.', '具体的な例を挙げる。', ['例えば', 'たとえば', '例として', '一例として'], '例えば、魚や野菜がいい。'),
  C('c-gutaiteki', 'example', '具体的には', 'Specifically / concretely.', '詳しく具体的に述べる。', ['具体的には', '具体的に言うと', '具体的にいうと'], '具体的には、毎日三十分歩くことだ。'),
  C('c-jissai', 'example', '実際', 'In fact / indeed (supporting evidence).', '事実を挙げて裏付ける。', ['実際', '実際に', '現に', '事実'], '実際、去年は雪が多かった。'),
  C('c-tokuni', 'example', '特に', 'In particular / especially.', 'その中でも特別に。', ['特に', 'とりわけ', 'なかでも', '中でも'], '特に、子供に人気がある。'),

  // --- Rephrasing & summary ----------------------------------------------------------------------
  C('c-tsumari', 'rephrase', 'つまり', 'In other words / that is.', '前の内容を別の言葉で言い直す。', ['つまり', 'すなわち', '即ち', 'いわば', '言わば'], 'つまり、彼は来ないということだ。'),
  C('c-iikaereba', 'rephrase', '言い換えれば', 'To put it another way.', '別の言い方をすると。', ['言い換えれば', 'いいかえれば', '言い換えると', '換言すれば'], '言い換えれば、時間はお金だ。'),
  C('c-yousuruni', 'rephrase', '要するに', 'In short / basically.', '要点をまとめると。', ['要するに', '要は', 'ようするに', '一言で言えば', '一言でいえば'], '要するに、準備が足りなかったのだ。'),

  // --- Conclusion -------------------------------------------------------------------------------
  C('c-kekkyoku', 'conclusion', '結局', 'In the end / after all.', '最終的に。', ['結局', 'けっきょく', '最終的に'], '結局、誰も来なかった。'),
  C('c-kono-you-ni', 'conclusion', 'このように', 'As shown above / in this way (wrapping up).', '前に述べたことをまとめる。', ['このように', '以上のように', 'こうして', 'このようにして'], 'このように、環境問題は深刻だ。'),
  C('c-matomeru-to', 'conclusion', 'まとめると', 'To sum up / in conclusion.', '全体をまとめると。', ['まとめると', '結論として', '結論から言うと', '以上から', '以上により'], 'まとめると、この方法が一番いい。'),

  // --- Sequence -------------------------------------------------------------------------------
  C('c-mazu', 'sequence', 'まず', 'First (of all).', '最初に。', ['まず', '最初に', '初めに', 'はじめに', '第一に', 'まずは'], 'まず、材料を全部切ります。'),
  C('c-tsugini', 'sequence', '次に', 'Next.', 'その次に。', ['次に', '第二に', '続いて', '続けて', 'それから', 'その後', 'そのあと', 'その次に'], '次に、鍋に水を入れます。'),
  C('c-saigoni', 'sequence', '最後に', 'Finally / lastly.', '一番終わりに。', ['最後に', '最終的には', 'おわりに', '終わりに'], '最後に、塩で味を整えます。'),

  // --- Topic ----------------------------------------------------------------------------------
  C('c-tokorode', 'topic', 'ところで', 'By the way (changing the subject).', '話題を変える。', ['ところで', '話は変わりますが', '話は変わるが'], 'ところで、明日は暇ですか。'),
  C('c-sate', 'topic', 'さて', 'Well then / now (moving to the next topic).', '次の話題・本題に移る。', ['さて', 'では', 'それでは', 'じゃあ', 'じゃ'], 'さて、本題に入りましょう。'),
  C('c-chinamini', 'topic', 'ちなみに', 'Incidentally / for reference.', '関連する補足の話題を出す。', ['ちなみに', '因みに'], 'ちなみに、この店は創業百年だ。'),
];
