// Page shell shared by every tool: navigation, language/theme controls, the Data
// panel (backup, restore, erase) and the version footer. Adapted from Kanji Nexus;
// keep the two in step where they overlap.
//
// Every page's entry module starts with:
//   await initPage('breakdown');
//
// To add a tool, add it to APPS and create <file> with the same header slots.
// Data actions (e.g. a future sync plugin) register with registerDataAction().

import { store } from './store.js';
import { t, tr, isEn, setLang, getLang, toggleTheme, onPrefsChange, applyStaticText } from './prefs.js';
import { toast, openModal, closeModal, initTooltips } from './ui.js';
import { registerServiceWorker, installAvailable, promptInstall, onInstallAvailable } from './pwa.js';
import { icon, hydrateIcons } from './icons.js';
import { APP_VERSION, BUILD, CHANGELOG_URL, versionLabel } from './version.js';
import { FAMILY } from './constants.js';

export const APPS = [
  { id: 'breakdown', ja: '文の分析', en: 'Breakdown', tipJa: '文を語・文節・役割・文法に分解', tipEn: 'Break a sentence into words, phrases, roles and grammar', file: 'index.html', icon: 'breakdown' },
  { id: 'grammar', ja: '文法', en: 'Grammar', tipJa: '文法パターン一覧と例文', tipEn: 'Grammar patterns with examples', file: 'grammar.html', icon: 'dictionary' },
  { id: 'highlight', ja: '読解', en: 'Reading', tipJa: '文章に印を付けて、問題に答える', tipEn: 'Mark up a passage and answer questions about it', file: 'highlight.html', icon: 'highlighter' },
  { id: 'drill', ja: '★ドリル', en: '★ Drill', tipJa: '語の並べ替え（★問題）', tipEn: 'JLPT-style word ordering (★ questions)', file: 'drill.html', icon: 'drill' },
  { id: 'library', ja: '例文帳', en: 'Library', tipJa: '保存した例文', tipEn: 'Your saved sentences', file: 'library.html', icon: 'library' },
];

let currentApp = null;

// ---------------------------------------------------------------------------
// Navigation & deep links
// ---------------------------------------------------------------------------
// Open a sentence in the Breakdown tool (index.html?s=<text>).
export const breakdownUrl = (text) => `index.html?s=${encodeURIComponent(text)}`;

// ---------------------------------------------------------------------------
// Header: nav pills into #nexus-hub-slot, global controls into #nexus-hub-controls
// ---------------------------------------------------------------------------
function renderNav() {
  const slot = document.getElementById('nexus-hub-slot');
  if (!slot) return;
  slot.innerHTML = `<nav class="hub-nav" aria-label="Reibun">${APPS.map((app) => {
    const active = app.id === currentApp;
    return `<a class="hub-pill${active ? ' active' : ''}" href="${app.file}" ${active ? 'aria-current="page"' : ''}
      data-tip-ja="${app.tipJa}" data-tip-en="${app.tipEn}" aria-label="${tr(app)}">${icon(app.icon)}<span class="hub-pill-label">${tr(app)}</span></a>`;
  }).join('')}</nav>`;
  renderTabbar();
}

// Phones: navigation lives in a bottom tab bar; Data / language / theme in the ⋯ sheet.
function renderTabbar() {
  let bar = document.getElementById('hub-tabbar');
  if (!bar) {
    bar = document.createElement('nav');
    bar.id = 'hub-tabbar';
    bar.className = 'hub-tabbar';
    bar.setAttribute('aria-label', 'Kanji Nexus');
    document.body.appendChild(bar);
    bar.addEventListener('click', (e) => e.target.closest('#hub-tab-more') && openMoreSheet());
  }
  bar.innerHTML =
    APPS.map((app) => {
      const active = app.id === currentApp;
      return `<a class="hub-tab${active ? ' active' : ''}" href="${app.file}" ${active ? 'aria-current="page"' : ''}>
        <span class="hub-tab-icon">${icon(app.icon)}</span><span class="hub-tab-label">${tr(app)}</span></a>`;
    }).join('') +
    `<button type="button" class="hub-tab" id="hub-tab-more" aria-label="${t('その他', 'More')}">
       <span class="hub-tab-icon">${icon('more')}</span><span class="hub-tab-label">${t('その他', 'More')}</span></button>`;
  renderBadge();
}

function openMoreSheet() {
  let el = document.getElementById('hub-more-sheet');
  if (!el) {
    el = document.createElement('div');
    el.className = 'modal-backdrop';
    el.id = 'hub-more-sheet';
    document.body.appendChild(el);
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-more]');
      if (!b) return;
      const what = b.dataset.more;
      if (what === 'data') {
        closeModal('hub-more-sheet');
        openDataPanel();
      } else if (what === 'theme') toggleTheme();
      else if (what === 'ja' || what === 'en') setLang(what);
      else if (what === 'install') promptInstall().then(() => closeModal('hub-more-sheet'));
      if (what !== 'data' && what !== 'install') openMoreSheet(); // re-render state
    });
  }
  el.innerHTML = `
    <div class="modal-card">
      <div class="modal-title"><span>${t('その他', 'More')}</span><button type="button" class="icon-btn small" data-close-modal="hub-more-sheet" aria-label="Close">${icon('close')}</button></div>
      <div class="menu-list">
        <button type="button" class="menu-row" data-more="data"><span class="row-label">${icon('data')}${t('データ・同期・バックアップ', 'Data, sync & backup')}</span>${badgeHtml()}</button>
        <div class="menu-row static"><span class="row-label">${icon('language')}${t('表示言語', 'Language')}</span>
          <div class="lang-switch"><button type="button" data-more="ja" class="${getLang() === 'ja' ? 'active' : ''}">日本語</button><button type="button" data-more="en" class="${getLang() === 'en' ? 'active' : ''}">EN</button></div>
        </div>
        <button type="button" class="menu-row" data-more="theme"><span class="row-label">${icon('theme')}${t('ライト/ダーク切替', 'Light / dark theme')}</span></button>
        ${installAvailable() ? `<button type="button" class="menu-row" data-more="install"><span class="row-label">${icon('install')}${t('ホーム画面に追加', 'Install app')}</span></button>` : ''}
        ${familyRows()}
      </div>
      ${versionFooter()}
    </div>`;
  openModal('hub-more-sheet');
}

function familyRows() {
  return FAMILY.map(
    (app) => `<a class="menu-row" href="${app.url}" target="_blank" rel="noopener"><span class="row-label">${icon('external')}${tr(app)}</span></a>`
  ).join('');
}

function renderControls() {
  const slot = document.getElementById('nexus-hub-controls');
  if (!slot) return;
  slot.innerHTML = `
    ${FAMILY.map((app) => `<a class="tb-btn wide-only family-link" href="${app.url}" target="_blank" rel="noopener" data-tip-ja="姉妹アプリ: ${app.ja}" data-tip-en="Sister app: ${app.en}">${icon('external')}<span>${tr(app)}</span></a>`).join('')}
    <button type="button" class="tb-btn wide-only" id="hub-btn-data" data-tip-ja="同期・バックアップ・リセット" data-tip-en="Sync, backup & reset">${icon('data')}<span>${t('データ', 'Data')}</span></button>
    <div class="lang-switch wide-only" data-tip-ja="表示言語切替" data-tip-en="Switch Interface Language">
      <button type="button" data-set-lang="ja" class="${getLang() === 'ja' ? 'active' : ''}">日本語</button>
      <button type="button" data-set-lang="en" class="${getLang() === 'en' ? 'active' : ''}">EN</button>
    </div>
    <button type="button" class="icon-btn wide-only" id="hub-btn-theme" aria-label="Theme" data-tip-ja="ライト/ダークテーマ切替" data-tip-en="Toggle Light / Dark Theme">${icon('theme')}</button>
    <button type="button" class="icon-btn narrow-only" id="hub-btn-more" aria-label="${t('その他', 'More')}" data-tip-ja="データ・言語・テーマ" data-tip-en="Data, language & theme">${icon('more')}</button>`;
  slot.querySelector('#hub-btn-data').addEventListener('click', openDataPanel);
  renderBadge();
  slot.querySelector('#hub-btn-theme').addEventListener('click', toggleTheme);
  slot.querySelector('#hub-btn-more').addEventListener('click', openMoreSheet);
  slot.querySelectorAll('[data-set-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.setLang)));
}

// ---------------------------------------------------------------------------
// Data panel
// ---------------------------------------------------------------------------
// Pages and plugins contribute buttons:
//   { id, section: 'sync' | 'transfer' | 'tools', ja, en, run(ctx),
//     label?(): string,     // dynamic text instead of ja/en
//     hidden?(): boolean,   // e.g. "Disconnect" only while connected
//     primary?(): boolean }
const dataActions = [];
export function registerDataAction(action) {
  dataActions.push(action);
}

const SECTIONS = [
  { id: 'sync', ja: 'クラウド同期', en: 'Cloud sync' },
  { id: 'transfer', ja: '端末間の転送', en: 'Move to another device' },
  { id: 'tools', ja: 'メンテナンス', en: 'Maintenance' },
];

// Sync status shown on the Data button (badge) and in the panel (detail).
// tone: 'ok' | 'busy' | 'warn' | 'error'
let syncStatus = null;
export function setSyncStatus(status) {
  syncStatus = status;
  renderBadge();
  refreshDataPanel();
}

// Status icon per tone: synced, syncing (spins), needs attention, error/offline.
const BADGE_ICONS = { ok: 'cloudOk', busy: 'loading', warn: 'alert', error: 'cloudOff' };
function badgeHtml() {
  if (!syncStatus?.tone) return '';
  return `<span class="sync-badge ${syncStatus.tone}" data-state="${syncStatus.tone}" title="${(syncStatus.detail || '').replace(/"/g, '&quot;')}">${icon(BADGE_ICONS[syncStatus.tone] || 'cloud')}</span>`;
}
function renderBadge() {
  for (const id of ['hub-btn-data', 'hub-tab-more', 'hub-btn-more']) {
    const btn = document.getElementById(id);
    if (!btn) continue;
    btn.querySelector('.sync-badge')?.remove();
    btn.insertAdjacentHTML('beforeend', badgeHtml());
  }
}

export function refreshDataPanel() {
  if (document.getElementById('hub-data-panel')?.classList.contains('open')) openDataPanel();
}

const pluginCtx = {
  store,
  toast,
  t,
  closePanel: () => closeModal('hub-data-panel'),
  refreshPanel: refreshDataPanel,
  setSyncStatus,
};

function downloadBackup() {
  const blob = new Blob([store.exportText()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `reibun_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function importText(text, { confirmFirst = false } = {}) {
  try {
    const parsed = JSON.parse(text);
    if (confirmFirst && !confirm(t('現在のデータを置き換えますか？', 'Replace your current data?'))) return false;
    store.importData(parsed);
    toast(t('データを読み込みました', 'Data loaded'));
    return true;
  } catch (err) {
    alert(t('JSONの解析に失敗しました: ', 'Could not parse JSON: ') + err.message);
    return false;
  }
}

function buildDataPanel() {
  const el = document.createElement('div');
  el.className = 'modal-backdrop';
  el.id = 'hub-data-panel';
  document.body.appendChild(el);
  return el;
}

const visibleActions = (section) => dataActions.filter((a) => a.section === section && !a.hidden?.());

function sectionHtml(section) {
  const actions = visibleActions(section.id);
  if (!actions.length) return '';
  const detail = section.id === 'sync' && syncStatus?.detail ? `<p class="panel-note sync-detail ${syncStatus.tone || ''}">${syncStatus.detail}</p>` : '';
  const buttons = actions
    .map((a) => `<button type="button" class="tb-btn${a.primary?.() ? ' primary' : ''}" data-hub-action="${a.id}">${a.icon ? icon(a.icon) : ''}${a.label ? a.label() : tr(a)}</button>`)
    .join('');
  return `
      <div class="field-group">
        <label class="field-label">${tr(section)}</label>
        ${detail}
        <div class="chip-row">${buttons}</div>
      </div>`;
}

export function openDataPanel() {
  const el = document.getElementById('hub-data-panel') || buildDataPanel();
  el.innerHTML = `
    <div class="modal-card wide">
      <div class="modal-title">
        <span class="title-with-icon">${icon('data')}${t('データ管理', 'Your Data')}</span>
        <button type="button" class="icon-btn small" data-close-modal="hub-data-panel" aria-label="Close">${icon('close')}</button>
      </div>
      <p class="panel-note">${t(
        `データはこのブラウザに保存されています（${store.summary().ja}）。他の端末へ移すにはバックアップファイルを使ってください。`,
        `Your data lives in this browser (${store.summary().en}). Use a backup file to move it to another device.`
      )}</p>

      <div class="field-group">
        <label class="field-label">${t('バックアップ', 'Backup')}</label>
        <div class="chip-row">
          <button type="button" class="tb-btn primary" id="hub-export">${icon('fileDown')}${t('ファイルに保存', 'Download .json')}</button>
          <label class="tb-btn">${icon('fileUp')}${t('ファイルから読込', 'Load .json')}<input type="file" id="hub-import-file" accept=".json,application/json" hidden></label>
        </div>
      </div>

      ${SECTIONS.map(sectionHtml).join('')}

      <div class="field-group">
        <label class="field-label">${t('初期化', 'Reset')}</label>
        <div class="chip-row">
          <button type="button" class="tb-btn danger" id="hub-wipe">${icon('delete')}${t('保存した例文をすべて消去', 'Erase all saved sentences')}</button>
        </div>
      </div>

      <details class="field-group">
        <summary class="field-label">${t('生JSONを直接編集', 'Edit raw JSON')}</summary>
        <textarea id="hub-json-text" class="field-textarea mono" spellcheck="false"></textarea>
        <div class="modal-actions"><button type="button" class="tb-btn primary" id="hub-json-apply">${t('テキストから適用', 'Apply text')}</button></div>
      </details>
      ${versionFooter()}
    </div>`;

  const textArea = el.querySelector('#hub-json-text');
  el.querySelector('details').addEventListener('toggle', (e) => {
    if (e.target.open) textArea.value = store.exportText();
  });
  el.querySelector('#hub-json-apply').addEventListener('click', () => {
    if (importText(textArea.value)) closeModal('hub-data-panel');
  });
  el.querySelector('#hub-export').addEventListener('click', downloadBackup);
  el.querySelector('#hub-import-file').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (file && importText(await file.text(), { confirmFirst: true })) closeModal('hub-data-panel');
  });
  el.querySelector('#hub-wipe').addEventListener('click', () => {
    if (!confirm(t('保存した例文をすべて消去しますか？', 'Erase all saved sentences?'))) return;
    store.wipe();
    closeModal('hub-data-panel');
    toast(t('データを消去しました', 'All data erased'));
  });
  el.querySelectorAll('[data-hub-action]').forEach((btn) => {
    const action = dataActions.find((a) => a.id === btn.dataset.hubAction);
    btn.addEventListener('click', () => action.run(pluginCtx));
    // Note: plugin run() may be async; errors are the plugin's to report.
  });
  openModal('hub-data-panel');
}

// ---------------------------------------------------------------------------
// Version: footer line, one-time "updated" notice, debugging handle
// ---------------------------------------------------------------------------
function versionFooter() {
  return `<div class="app-version">Reibun ${versionLabel()} · <a href="${CHANGELOG_URL}" target="_blank" rel="noopener noreferrer">${t('変更履歴', 'Changelog')}</a>
    <br>${t('辞書データ', 'Dictionary data')}: <a href="https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project" target="_blank" rel="noopener noreferrer">JMdict</a> © <a href="https://www.edrdg.org/edrdg/licence.html" target="_blank" rel="noopener noreferrer">EDRDG, CC BY-SA 4.0</a>
    <br>${t('例文', 'Example sentences')}: <a href="https://tatoeba.org" target="_blank" rel="noopener noreferrer">Tatoeba</a> (<a href="https://creativecommons.org/licenses/by/2.0/fr/" target="_blank" rel="noopener noreferrer">CC BY 2.0 FR</a>)
    <br>${t('形態素解析', 'Morphological analysis')}: <a href="https://github.com/takuyaa/kuromoji.js" target="_blank" rel="noopener noreferrer">kuromoji.js</a> (Apache-2.0) · IPADIC</div>`;
}

const SEEN_VERSION_KEY = 'reibun_seen_version';
function announceUpdate() {
  window.REIBUN_VERSION = { version: APP_VERSION, build: BUILD };
  console.info(`Reibun ${versionLabel()}`);
  if (BUILD === 'dev') return;
  let previous = null;
  try {
    previous = localStorage.getItem(SEEN_VERSION_KEY);
    localStorage.setItem(SEEN_VERSION_KEY, APP_VERSION);
  } catch (_) {}
  // First visit ever: nothing to announce. Only a change of app version is news.
  if (previous && previous !== APP_VERSION) {
    toast(t(`v${APP_VERSION} に更新されました`, `Updated to v${APP_VERSION}`), {
      action: { label: t('変更点', "What's new"), run: () => window.open(CHANGELOG_URL, '_blank', 'noopener') },
    });
  }
}

// ---------------------------------------------------------------------------
// Page bootstrap
// ---------------------------------------------------------------------------
export async function initPage(appId) {
  currentApp = appId;
  const render = () => {
    renderNav();
    renderControls();
    applyStaticText();
    hydrateIcons();
  };
  render();
  onPrefsChange((what) => what === 'lang' && render());
  onInstallAvailable(() => document.getElementById('hub-more-sheet')?.classList.contains('open') && openMoreSheet());
  initTooltips();
  registerServiceWorker();
  announceUpdate();

  await store.load();
  return { store };
}
