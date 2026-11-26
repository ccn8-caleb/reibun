// ★ drill sentences: one longer sentence per grammar point, with the point in the middle
// so the blanks always have context on both sides, as in the exam. The short `ex`
// sentences on the Grammar page are too short for that.
//
// Left out on purpose: quiet basics (は, が, です…), connectives (they open a sentence,
// so nothing comes before them), and patterns whose pieces would repeat
// (〜といい〜といい gives いい twice). tests/star.test.mjs checks every entry.

import N5 from './drill-n5.js';
import N4 from './drill-n4.js';
import N3 from './drill-n3.js';
import N2 from './drill-n2.js';
import N1 from './drill-n1.js';

export const DRILL_SENTENCES = { ...N5, ...N4, ...N3, ...N2, ...N1 };
export const NO_DRILL = new Set(['to-ii-to-ii']);
