// The digest's pure half: which three repos this morning's mail is about, and what
// it says. No I/O, no clock of its own — worker.mjs reads the snapshot and passes the
// day in, so every branch here is reachable from a test with a fixed date.

import { WORK_PREFIX } from '../../../../../shared/packs/claudinite-tasks/queue/work-item.mjs';
import { isDispatchTitle } from '../../../../../shared/packs/claudinite-tasks/dispatch.mjs';

export const REPOS_PER_DIGEST = 3;
export const ISSUES_PER_REPO = 5;

// The machinery is the busiest actor in this fleet, and a queue item outnumbers the
// project work it dispatches — five titles per repo would be five work items on every
// active member. Recognized by the engine's own constant and its own predicate, since
// both title formats are the scheduler's to change: `[claudinite-work]` today, and
// `[claudinite-task]` in the history the snapshot still carries.
//
// COUNTED, NOT DROPPED: how much of the fleet's day went on servicing itself is a true
// thing about the repo, so it is tallied on its own line rather than made invisible.
export const isMaintenance = (issue) =>
  String(issue?.title ?? '').trim().startsWith(WORK_PREFIX) || isDispatchTitle(issue?.title);

// Whole days since the Unix epoch, in UTC. The rotation's only input, so the digest
// is a function of the date rather than of when in the night the run happened: a run
// at 03:59 and a re-run at 04:01 pick the same three repos.
export const dayNumber = (now) => Math.floor(Date.UTC(
  now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
) / 86_400_000);

// Day N takes the roster's entries 3N, 3N+1 and 3N+2, wrapping. The roster is sorted,
// so the sequence depends on the fleet's membership rather than on the order the
// snapshot happened to enumerate it in — and a repo joining or leaving shifts the
// rotation without ever stalling it on one member.
//
// Every repo comes round before any repeats while the fleet is larger than three:
// consecutive days start three apart, so the whole roster is covered in
// ceil(n / 3) days whatever n is. A fleet of three or fewer sends all of it.
export function chooseRepos(roster, day) {
  const names = [...roster].sort();
  if (names.length <= REPOS_PER_DIGEST) return names;
  const start = ((day * REPOS_PER_DIGEST) % names.length + names.length) % names.length;
  return Array.from({ length: REPOS_PER_DIGEST }, (_, i) => names[(start + i) % names.length]);
}

// The snapshot's repos as { repo, openIssues, issues }, keyed for lookup. A repo in
// the roster with no entry is not possible today — the roster IS the snapshot's repo
// list — but the digest states an absent count as unknown rather than as zero, so a
// future roster from elsewhere degrades honestly.
export function digestFor(snapshot, day) {
  const byName = new Map((snapshot.repos ?? []).map((r) => [r.repo, r]));
  const chosen = chooseRepos([...byName.keys()], day);
  return chosen.map((name) => {
    const entry = byName.get(name);
    const issues = entry?.issues ?? [];
    const theirs = issues.filter((i) => !isMaintenance(i));
    return {
      repo: name,
      url: `https://github.com/${name}`,
      // `openIssues` is the repo's own count; `issues` is what the snapshot carried,
      // which the snapshot's own paging can leave shorter. Neither stands in for a
      // missing other.
      openIssues: entry?.openIssues ?? (entry ? issues.length : null),
      maintenance: issues.length - theirs.length,
      // Newest first: the snapshot lists them in the API's default order, which is
      // already newest-updated, and the digest is a nudge rather than a backlog.
      top: theirs.slice(0, ISSUES_PER_REPO),
    };
  });
}

// A repo whose only open issues are the queue's is a different thing from a repo with
// an empty tracker, and the digest says which.
const nothingToShow = (r) => (r.maintenance
  ? 'Nothing open but the queue\'s own items.'
  : 'No open issues.');

const escapeHtml = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const countLine = (r) => {
  const open = r.openIssues === null
    ? 'open issues unknown'
    : `${r.openIssues} open issue${r.openIssues === 1 ? '' : 's'}`;
  return r.maintenance ? `${open}, ${r.maintenance} of them the queue's own` : open;
};

export const subjectFor = (entries, now) =>
  `Fleet digest ${now.toISOString().slice(0, 10)}: ${entries.map((e) => e.repo.split('/').pop()).join(', ')}`;

// Inline styles and no images: a mail client applies no stylesheet and blocks remote
// content by default, so anything in a <style> block or an <img> is decoration the
// recipient may never see.
export function htmlBody(entries, { generated }) {
  const blocks = entries.map((r) => {
    const issues = r.top.length
      ? `<ul style="margin:8px 0 0;padding-left:20px">${r.top.map((i) =>
        `<li style="margin:2px 0"><a href="${escapeHtml(r.url)}/issues/${i.number}">#${i.number}</a> ${escapeHtml(i.title)}</li>`).join('')}</ul>`
      : `<p style="margin:8px 0 0;color:#666">${escapeHtml(nothingToShow(r))}</p>`;
    return `<div style="margin:0 0 24px">`
      + `<h2 style="margin:0;font-size:16px"><a href="${escapeHtml(r.url)}">${escapeHtml(r.repo)}</a></h2>`
      + `<p style="margin:2px 0 0;color:#666;font-size:13px">${countLine(r)}</p>`
      + `${issues}</div>`;
  }).join('');
  return `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5">`
    + `<p style="margin:0 0 24px;color:#666">Three repos from the fleet, in rotation.</p>`
    + `${blocks}`
    + `<p style="margin:32px 0 0;color:#999;font-size:12px">From the fleet issues snapshot taken ${escapeHtml(generated)}.</p></div>`;
}

export function textBody(entries, { generated }) {
  const blocks = entries.map((r) => {
    const issues = r.top.length
      ? r.top.map((i) => `  #${i.number} ${i.title}`).join('\n')
      : `  ${nothingToShow(r)}`;
    return `${r.repo} — ${countLine(r)}\n${r.url}\n${issues}`;
  }).join('\n\n');
  return `Three repos from the fleet, in rotation.\n\n${blocks}\n\nFrom the fleet issues snapshot taken ${generated}.\n`;
}
