// Logic functions: what a pattern does in an argument. They let a paragraph be read as
// a chain (claim → cause → example → contrast → conclusion…). Connectives (connectives.js)
// carry their function inline; JLPT patterns that link ideas are tagged here, in one
// place, so the tagging is easy to review.

export const LOGIC = [
  { id: 'addition', ja: '添加', en: 'Adding', hint: { ja: '内容を付け加える', en: 'Adds another point' } },
  { id: 'contrast', ja: '対比・逆接', en: 'Contrast', hint: { ja: '反対・違う内容を示す', en: 'Sets up an opposing or different point' } },
  { id: 'concession', ja: '譲歩', en: 'Concession', hint: { ja: '一部を認めつつ主張する', en: 'Grants a point, then holds the claim' } },
  { id: 'cause', ja: '理由・原因', en: 'Cause', hint: { ja: '理由や原因を述べる', en: 'Gives a reason or cause' } },
  { id: 'result', ja: '結果・帰結', en: 'Result', hint: { ja: '結果やそこから導かれることを述べる', en: 'States what follows from it' } },
  { id: 'condition', ja: '条件', en: 'Condition', hint: { ja: '成り立つ条件を示す', en: 'Says when or if something holds' } },
  { id: 'purpose', ja: '目的', en: 'Purpose', hint: { ja: '何のためかを示す', en: 'Says what it is for' } },
  { id: 'example', ja: '例示', en: 'Example', hint: { ja: '具体例・根拠を挙げる', en: 'Gives an example or evidence' } },
  { id: 'rephrase', ja: '言い換え・要約', en: 'Rephrasing', hint: { ja: '別の言葉で言い直す・まとめる', en: 'Restates or condenses' } },
  { id: 'conclusion', ja: '結論', en: 'Conclusion', hint: { ja: '結論・まとめを述べる', en: 'Draws the conclusion' } },
  { id: 'sequence', ja: '順序', en: 'Sequence', hint: { ja: '順番・時間の流れを示す', en: 'Orders steps or events' } },
  { id: 'topic', ja: '話題', en: 'Topic', hint: { ja: '話題を示す・変える', en: 'Introduces or shifts the topic' } },
];

// JLPT patterns by logic function (pattern ids from n5.js … n1.js).
export const LOGIC_OF_PATTERN = {
  addition: ['shi', 'dake-de-naku', 'ni-kuwaete', 'bakari-ka', 'mo-ba-mo', 'yara', 'wa-mochiron', 'nomi-narazu', 'wa-oroka', 'mo-saru-koto-nagara', 'ni-todomarazu', 'ni-kagirazu', 'to-ii-to-ii'],
  contrast: ['kedo', 'noni', 'kuse-ni', 'wari-ni', 'kawari-ni', 'ni-hikubete', 'ni-taishite', 'hanmen', 'ippou-de', 'ni-hanshite', 'ni-shite-wa', 'ni-hikikae', 'dokoro-ka', 'to-omoikiya', 'yori', 'no-hou-ga'],
  concession: ['te-mo', 'tatoe-temo', 'to-shite-mo', 'ni-mo-kakawarazu', 'mono-no', 'nagara-mo', 'to-ittemo', 'to-iedomo', 'kara-to-itte', 'ta-tokoro-de', 'de-are', 'ou-ga', 'nai-made-mo', 'ni-kakawarazu', 'wo-towazu', 'wa-tomokaku', 'mo-kamawazu', 'ni-shita-tokoro-de', 'wake-dewa-nai', 'to-wa-kagiranai'],
  cause: ['kara-reason', 'node', 'okage-de', 'sei-de', 'no-da-kara', 'mono-da-kara', 'koto-kara', 'koto-da-kara', 'bakari-ni', 'kara-koso', 'dake-atte', 'dake-ni', 'amari', 'yue', 'to-atte', 'koto-tote', 'ba-koso', 'ni-yotte'],
  result: ['ageku', 'sue-ni', 'shimatsu-da', 'koto-ni-naru', 'you-ni-naru', 'wake'],
  condition: ['ba', 'tara', 'to-conditional', 'nara', 'to-shitara', 'sae-ba', 'baai', 'kagiri', 'nai-koto-ni-wa', 'mono-nara', 'kara-ni-wa', 'ijou-wa', 'ue-wa', 'ni-yotte-wa', 'ga-saigo', 'to-areba', 'naku-shite-wa', 'ba-sore-made', 'you-mono-nara', 'tomo-naru-to', 'ikan', 'te-kara-denai-to', 'ba-hodo', 'shidai'],
  purpose: ['tame-ni', 'you-ni', 'ni-iku', 'n-ga-tame', 'beku', 'ni-mukete'],
  example: ['nado', 'toka', 'to-itta', 'wo-hajime', 'tari', 'no-you-na', 'nante', 'demo', 'sae', 'sura'],
  rephrase: ['to-iu-no-wa', 'to-iu-yori', 'to-iu-koto-da', 'to-iu-mono-da', 'ni-hoka-naranai', 'ni-suginai'],
  conclusion: ['ni-chigainai', 'ni-kimatte-iru', 'beki', 'koto-da', 'hazu', 'to-iu-mono-dewa-nai', 'zaru-wo-enai', 'hoka-nai', 'shika-nai-must'],
  sequence: ['te-kara', 'mae-ni', 'ato-de', 'ue-de', 'te-irai', 'totan', 'ya-ina-ya', 'ga-hayai-ka', 'nari', 'te-kara-to-iu-mono'],
  topic: ['ni-tsuite', 'ni-kanshite', 'to-ieba', 'to-kitara', 'wo-megutte', 'ni-kakete-wa', 'kara-suru-to', 'ni-shitara', 'ni-totte', 'wa-topic'],
};
