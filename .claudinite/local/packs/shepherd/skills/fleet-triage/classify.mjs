// The fleet-triage skill's classifier: reads `.claudinite/local/fleet-issues.GENERATED.json`
// (the fleet-issues-snapshot task's output) and prints the report's standard cuts, plus the
// per-repo evidence markdown on `--evidence <path>`.
//
//   node .claudinite/local/packs/shepherd/skills/fleet-triage/classify.mjs [snapshot.json] [--evidence out.md]
//
// The rules below are the ones the counts rest on and are pinned by the test beside the
// skill. The park vocabulary is read fresh from canon by the skill's step 4 — this file
// only DECODES spellings, it does not decide what a kind means.

import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const KINDS = ['failure', 'action', 'decision', 'approval'];
const WORK = '[claudinite-work]';

export const isQueue = (r) => r.title.startsWith(WORK)
  || r.labels.some((l) => l.startsWith('task:'))
  || r.labels.includes('needs-human') || r.labels.includes('origin:schedule');

export function parkKind(r) {
  const L = new Set(r.labels);
  for (const k of KINDS) if (L.has(`task:status:needs-human-${k}`) || L.has(`task:needs-human-${k}`)) return k;
  if (L.has('task:status:blocked') || L.has('task:blocked')) return 'blocked';
  if (L.has('task:status:running-executor')) return 'running-executor';
  if (L.has('task:status:running-agent') || L.has('task:agent')) return 'running-agent';
  if (L.has('task:status:waiting-for-executor') || L.has('task:ready')) return 'waiting-for-executor';
  if (L.has('needs-human')) return 'bare-needs-human';
  return 'no-status';
}

export function labelGeneration(r) {
  if (r.labels.some((l) => l.startsWith('task:status:'))) return 'canon';
  if (r.labels.some((l) => l.startsWith('task:needs-human-')) || ['task:agent', 'origin:schedule', 'needs-human'].some((l) => r.labels.includes(l))) return 'retired';
  return 'none';
}

const PLAIN_LABELS = ['workflow-failure', 'fleet-drift', 'add-packs', 'needs-decision', 'blocked', 'quick-win', 'plan-tracking'];
export function plainBucket(r) {
  for (const l of PLAIN_LABELS) if (r.labels.includes(l)) return l;
  if (r.title.startsWith('[claudinite-schedule]')) return 'schedule-board';
  if (r.title.startsWith('Claudinite tracker:')) return 'tidy-tracker';
  return 'unlabelled-backlog';
}

export const laneOf = (r) => (r.title.startsWith(WORK) ? r.title.slice(WORK.length).trim().split(/\s+/)[0] : null);

// (repo, pack/task) → the open queue items on that lane, ascending by number.
export function lanes(rows) {
  const m = new Map();
  for (const r of rows) {
    const lane = laneOf(r);
    if (!lane) continue;
    const k = `${r.repo}\t${lane}`;
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  for (const v of m.values()) v.sort((a, b) => a.number - b.number);
  return m;
}

export function flatten(snapshot) {
  return snapshot.repos.flatMap((rep) => rep.issues.map((i) => ({ ...i, repo: rep.repo })));
}

const count = (xs, key) => {
  const m = new Map();
  for (const x of xs) { const k = key(x); m.set(k, (m.get(k) ?? 0) + 1); }
  return [...m.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
};

export function cuts(rows) {
  const queue = rows.filter(isQueue);
  const plain = rows.filter((r) => !isQueue(r));
  const l = lanes(queue);
  const duplicatedLanes = [...l.entries()].filter(([, v]) => v.length > 1).sort((a, b) => b[1].length - a[1].length);
  return {
    total: rows.length, queue, plain,
    perRepo: count(rows, (r) => r.repo).map(([repo, n]) => [repo, n, queue.filter((r) => r.repo === repo).length, plain.filter((r) => r.repo === repo).length]),
    kindByGen: count(queue, (r) => `${parkKind(r)}\t${labelGeneration(r)}`),
    kinds: count(queue, parkKind),
    generations: count(queue, labelGeneration),
    lanes: l, duplicatedLanes,
    redundant: duplicatedLanes.reduce((n, [, v]) => n + v.length - 1, 0),
    byTask: count(queue.filter(laneOf), laneOf),
    minutes: count(queue, (r) => r.updated_at.slice(0, 16)).slice(0, 12),
    crossRepo: count(rows, (r) => r.title.slice(0, 60)).filter(([, n]) => n >= 3),
    plainBuckets: count(plain, plainBucket),
  };
}

export function renderCuts(c) {
  const out = [];
  const pad = (s, n) => String(s).padEnd(n);
  out.push(`TOTAL ${c.total}  queue ${c.queue.length}  plain ${c.plain.length}`, '');
  out.push('--- per repo (total / queue / plain) ---');
  for (const [repo, n, q, p] of c.perRepo) out.push(`${pad(repo, 40)} ${String(n).padStart(4)} ${String(q).padStart(4)} ${String(p).padStart(4)}`);
  out.push('', '--- queue: kind x generation ---');
  for (const [k, n] of c.kindByGen) { const [kind, gen] = k.split('\t'); out.push(`${pad(kind, 20)} ${pad(gen, 8)} ${String(n).padStart(4)}`); }
  out.push('', '--- queue: kind totals ---');
  for (const [k, n] of c.kinds) out.push(`${pad(k, 20)} ${String(n).padStart(4)}`);
  out.push('', '--- queue: generation totals ---');
  for (const [g, n] of c.generations) out.push(`${pad(g, 10)} ${String(n).padStart(4)}`);
  out.push('', '--- lane duplication ---');
  out.push(`distinct ${WORK} lanes: ${c.lanes.size}  items on them: ${[...c.lanes.values()].reduce((n, v) => n + v.length, 0)}`);
  out.push(`lanes with >1: ${c.duplicatedLanes.length}  redundant items: ${c.redundant}`);
  for (const [k, v] of c.duplicatedLanes) {
    const [repo, lane] = k.split('\t');
    out.push(`  ${repo}/${lane}: ${v.length}  ->  ${v.map((r) => `#${r.number} ${parkKind(r)}/${labelGeneration(r)}`).join(', ')}`);
  }
  out.push('', `--- ${WORK} items by pack/task ---`);
  for (const [t, n] of c.byTask) out.push(`${pad(t, 50)} ${String(n).padStart(3)}`);
  out.push('', '--- top updated_at minutes among queue items (a cluster is one sweep) ---');
  for (const [t, n] of c.minutes) out.push(`${t}  ${n}`);
  out.push('', '--- same title across >=3 repos ---');
  for (const [t, n] of c.crossRepo) out.push(`${String(n).padStart(3)}  ${t}`);
  out.push('', '--- plain issue buckets ---');
  for (const [b, n] of c.plainBuckets) out.push(`${pad(b, 22)} ${String(n).padStart(4)}`);
  return `${out.join('\n')}\n`;
}

export function renderEvidence(snapshot, rows) {
  const out = [`# Fleet triage — every open issue, ${snapshot.generated.slice(0, 10)}`, ''];
  out.push(`${rows.length} open issues across ${snapshot.repos.length} in-scope repos under \`${snapshot.owner}\` (snapshot generated ${snapshot.generated}).`);
  out.push('`Q` = queue-managed. `Gen` = label generation (canon `task:status:*` vs retired `needs-human`/`task:needs-human-*`).', '');
  const repos = [...snapshot.repos].sort((a, b) => b.openIssues - a.openIssues || a.repo.localeCompare(b.repo));
  for (const rep of repos) {
    const rr = rows.filter((r) => r.repo === rep.repo);
    const q = rr.filter(isQueue).length;
    out.push('', `## ${rep.repo} — ${rr.length} open (${q} queue / ${rr.length - q} plain)`, '');
    out.push('| # | Q | State | Gen | Updated | Title |', '|---|---|-------|-----|---------|-------|');
    for (const r of rr) {
      const state = isQueue(r) ? (KINDS.includes(parkKind(r)) ? `park:${parkKind(r)}` : parkKind(r)) : plainBucket(r);
      out.push(`| [#${r.number}](https://github.com/${r.repo}/issues/${r.number}) | ${isQueue(r) ? 'Q' : ''} | ${state} | ${isQueue(r) ? labelGeneration(r) : ''} | ${r.updated_at.slice(0, 10)} | ${r.title.replace(/\|/g, '\\|')} |`);
    }
  }
  return `${out.join('\n')}\n`;
}

export function main(argv) {
  const args = argv.slice(2);
  const ev = args.indexOf('--evidence');
  const evidencePath = ev >= 0 ? args[ev + 1] : null;
  const positional = args.filter((a, i) => a !== '--evidence' && i !== ev + 1);
  const file = positional[0] ?? '.claudinite/local/fleet-issues.GENERATED.json';
  const snapshot = JSON.parse(readFileSync(file, 'utf8'));
  const rows = flatten(snapshot);
  const c = cuts(rows);
  process.stdout.write(`snapshot: ${file} generated ${snapshot.generated}\n\n${renderCuts(c)}`);
  if (evidencePath) { writeFileSync(evidencePath, renderEvidence(snapshot, rows)); process.stdout.write(`\nevidence: ${evidencePath}\n`); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv);
