// Library: saved sentences with an optional translation and note. Each opens in
// Breakdown; edits save as you type; delete has undo.

import { initPage, breakdownUrl } from '../core/hub.js';
import { t, onPrefsChange } from '../core/prefs.js';
import { toast } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { escapeHtml as esc, fold, debounce } from '../core/util.js';

const { store } = await initPage('library');

const $ = (id) => document.getElementById(id);
const search = $('lib-search');
const list = $('lib-list');

const dateText = (ms) => new Date(ms).toLocaleDateString(t('ja-JP', 'en-US'), { year: 'numeric', month: 'short', day: 'numeric' });

function render() {
  const all = store.sentences;
  const q = fold(search.value.trim());
  const shown = q ? all.filter((s) => [s.ja, s.en, s.note].some((f) => fold(f).includes(q))) : all;
  $('lib-count').textContent = t(`${all.length} 件`, `${all.length} sentence${all.length === 1 ? '' : 's'}`);
  if (!all.length) {
    list.innerHTML = `<div class="card empty-state">${icon('library')}
      <p>${esc(t('まだ例文がありません。文の分析で 🔖 を押すと、ここに保存されます。', 'No sentences yet. Press the bookmark on any sentence in Breakdown to save it here.'))}</p>
      <a class="tb-btn primary" href="index.html">${icon('breakdown')}${esc(t('文の分析へ', 'Go to Breakdown'))}</a></div>`;
    return;
  }
  if (!shown.length) {
    list.innerHTML = `<div class="card empty-state">${esc(t('該当する例文がありません。', 'No sentences match.'))}</div>`;
    return;
  }
  list.innerHTML = shown
    .map(
      (s) => `<article class="card lib-item" data-id="${esc(s.id)}">
        <a class="lib-ja" href="${breakdownUrl(s.ja)}" lang="ja">${esc(s.ja)}</a>
        <div class="lib-fields">
          <input class="field-input" data-field="en" value="${esc(s.en)}" placeholder="${esc(t('訳（任意）', 'Translation (optional)'))}" aria-label="${esc(t('訳', 'Translation'))}">
          <input class="field-input" data-field="note" value="${esc(s.note)}" placeholder="${esc(t('メモ（任意）', 'Note (optional)'))}" aria-label="${esc(t('メモ', 'Note'))}">
        </div>
        <div class="lib-actions">
          <a class="tb-btn small" href="${breakdownUrl(s.ja)}">${icon('breakdown')}${esc(t('分析', 'Break down'))}</a>
          <span class="spacer"></span>
          <span class="lib-date">${esc(dateText(s.added))}</span>
          <button type="button" class="icon-btn small" data-delete aria-label="${esc(t('削除', 'Delete'))}" data-tip-ja="削除" data-tip-en="Delete">${icon('delete')}</button>
        </div>
      </article>`
    )
    .join('');
}

// Saving re-renders other tabs; in this tab, keep focus by not re-rendering on our own edits.
let ownEdit = false;
const saveField = debounce((id, field, value) => {
  ownEdit = true;
  store.update(id, { [field]: value });
  ownEdit = false;
}, 400);

list.addEventListener('input', (e) => {
  const field = e.target.dataset.field;
  if (!field) return;
  saveField(e.target.closest('[data-id]').dataset.id, field, e.target.value);
});
list.addEventListener('click', (e) => {
  if (!e.target.closest('[data-delete]')) return;
  const removed = store.remove(e.target.closest('[data-id]').dataset.id);
  toast(t('削除しました', 'Deleted'), { action: { label: t('元に戻す', 'Undo'), run: () => store.restore(removed) } });
});

store.onChange(() => !ownEdit && render());
search.addEventListener('input', debounce(render, 120));
onPrefsChange((what) => what === 'lang' && render());
render();
