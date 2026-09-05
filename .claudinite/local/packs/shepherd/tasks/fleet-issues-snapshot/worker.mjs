// The fleet-issues-snapshot code-work entry point — `node worker.mjs`, cwd = this task
// dir, bounded by code_work_timeout. Deterministic: enumerate the fleet over the PAT,
// read every open issue in every in-scope repo, render, and deliver the regenerated
// `.claudinite/local/fleet-issues.GENERATED.json` on a self-landing PR — or nothing,
// when the recompute matches what the base already carries.
//
// The read is the cross-repo part and needs the fleet PAT (`required_secrets`); the
// delivery is this repo's own and rides the Action token, exactly as usage-fold's does.
// The two never mix: FLEET_GITHUB_TOKEN reads other people's repos, GITHUB_TOKEN writes
// this one.
//
// The five imports below reach into two other packs on purpose, and `file-placement`
// says so at distance 8. Each is that pack's one declared entry for exactly this job:
// fleet-api.mjs is "the ONE place a Claudinite process talks GitHub over raw REST", and
// deliver-generated.mjs exists so tasks that land a regenerated file "must not each grow
// their own copy". A local copy of either would be the third copy the basics rules
// forbid; a nearer home for this task would take it out of the pack that owns it.

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { makeGh, paged, fleetWorkerFailed } from '../../../../../shared/packs/claudinite-fleet-sheepdog/fleet-api.mjs';
import { parseSheepdogConfig } from '../../../../../shared/packs/claudinite-fleet-sheepdog/fleet-config.mjs';
import { FLEET_TOKEN, missingFleetTokenError } from '../../../../../shared/packs/claudinite-fleet-sheepdog/fleet-token.mjs';
import { deliverGenerated, baseTip, readAt, remoteUrl } from '../../../../../shared/packs/claudinite-tasks/deliver-generated.mjs';
import { AUTOMERGE_TRAILER, policyExpression } from '../../../../../shared/packs/claudinite-tasks/merge-policy.mjs';
import { settingsPath } from '../../../../../shared/engine/settings-file.mjs';
import task from './task.json' with { type: 'json' };
import { inScope, skipReason, shapeIssue, renderSnapshot, withoutStamp } from './snapshot.mjs';

export const SNAPSHOT_PATH = '.claudinite/local/fleet-issues.GENERATED.json';
const PR_BRANCH_PREFIX = 'claudinite/fleet-issues-snapshot';
const SWEEP = 'fleet-issues-snapshot';

const item = process.env.CLAUDINITE_ITEM || '';
const log = (s) => console.log(`${SWEEP}${item ? ` [#${item}]` : ''}: ${s}`);

export async function main() {
  const root = process.env.CLAUDINITE_REPO_ROOT || process.cwd();
  const home = process.env.CLAUDINITE_REPO;
  const base = process.env.CLAUDINITE_DEFAULT_BRANCH || 'main';
  const actionToken = process.env.GITHUB_TOKEN;
  const fleetToken = process.env[FLEET_TOKEN];
  if (!home) throw new Error('CLAUDINITE_REPO is not set (owner/repo)');
  if (!actionToken) throw new Error('GITHUB_TOKEN is not set — the snapshot cannot deliver its PR');
  if (!fleetToken) throw missingFleetTokenError(SWEEP, 'the cross-repo issue read needs it');

  const cfg = JSON.parse(readFileSync(settingsPath(root), 'utf8'));
  const { owner, exclude } = parseSheepdogConfig(cfg, home);
  const gh = makeGh(fleetToken);

  const mine = (await paged(gh, '/user/repos?affiliation=owner'))
    .filter((r) => String(r.owner?.login ?? '').toLowerCase() === owner);
  if (!mine.length) throw new Error(`the fleet PAT enumerated no repositories under ${owner} — nothing to snapshot`);

  const repos = [];
  const skipped = [];
  for (const r of mine) {
    if (!inScope(r, { exclude })) { skipped.push({ repo: r.full_name, why: skipReason(r, { exclude }) }); continue; }
    // `state=open` still lists pull requests; shapeIssue drops them.
    const raw = await paged(gh, `/repos/${r.full_name}/issues?state=open`);
    const issues = raw.map(shapeIssue).filter(Boolean);
    repos.push({ repo: r.full_name, issues });
    log(`${r.full_name}: ${issues.length} open issue(s)`);
  }

  const text = renderSnapshot({ generated: new Date().toISOString(), owner, repos, skipped });
  const total = repos.reduce((n, r) => n + r.issues.length, 0);

  // Compared against the BASE, never the working tree, and without the stamp: an
  // unchanged fleet must deliver nothing.
  const remote = remoteUrl(home, actionToken);
  const baseSha = baseTip(root, remote, base);
  const landed = readAt(root, baseSha, SNAPSHOT_PATH);
  if (landed !== null && withoutStamp(landed) === withoutStamp(text)) {
    log(`${repos.length} repo(s), ${total} open issue(s) — recompute is byte-identical, nothing to deliver`);
    return;
  }

  const pr = await deliverGenerated({
    root, repo: home, base, token: actionToken, stamp: new Date().toISOString().slice(0, 10),
    branchPrefix: PR_BRANCH_PREFIX, log,
    files: { [SNAPSHOT_PATH]: text },
    message: `Claudinite: snapshot the fleet's open issues\n\n${AUTOMERGE_TRAILER}: ${policyExpression(task.automerge)}`,
    title: 'Claudinite: fleet issues snapshot',
    body: [
      `Regenerated \`${SNAPSHOT_PATH}\`: every open issue in every in-scope repo under`,
      `\`${owner}\` (${repos.length} repos, ${total} issues), read over the fleet PAT.`,
      '',
      'The fleet-triage skill classifies from this file instead of reading each repo',
      'from a session. A recompute that differs only in its `generated` stamp opens no',
      'PR at all. Machine-written — never hand-edit it.',
    ].join('\n'),
  });
  log(`${repos.length} repo(s), ${total} open issue(s) — `
    + `${pr.reused ? 'updated' : 'opened'} PR ${pr.number !== null ? `#${pr.number}` : `on ${pr.branch}`}`
    + `${pr.merged ? ' (landed)' : pr.delivery === 'review' ? ' (left for review)' : ''}`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main().catch((e) => fleetWorkerFailed(SWEEP, e));
