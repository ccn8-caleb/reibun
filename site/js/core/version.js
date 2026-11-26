// App version, shown in the Data panel and the ⋯ sheet.
//
// APP_VERSION: bump the patch number for every release (0.2.1, 0.2.2, …), and add a matching
//   "## [x.y.z]" entry to CHANGELOG.md — CI fails without one. The minor
//   number only moves for a milestone you choose to call out.
// BUILD / BUILD_DATE: stamped by tools/stamp-deploy.sh at deploy time
//   (commit hash and UTC date). They stay 'dev' / '' when running locally.

export const APP_VERSION = '0.2.2';
export const BUILD = 'dev';
export const BUILD_DATE = '';

export const CHANGELOG_URL = 'https://github.com/ccn8-caleb/reibun/blob/master/CHANGELOG.md';

// "v0.2.0 · build e9a6960 · 2026-11-25" (or "v0.2.0 · dev build")
export function versionLabel() {
  if (BUILD === 'dev') return `v${APP_VERSION} · dev build`;
  return `v${APP_VERSION} · build ${BUILD.slice(0, 7)}${BUILD_DATE ? ` · ${BUILD_DATE}` : ''}`;
}
