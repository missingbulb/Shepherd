// The pure half of the fleet issues snapshot: who is in the roster, what one issue row
// carries, and a render that is a pure function of the fleet so an unchanged fleet
// produces a byte-identical file (stamp aside) and delivers nothing.
//
// Roster scope mirrors the sheepdog sweeps' classifyScope — archived repos and forks
// are out, `exclude` is the config's opt-out — minus their canon/home special cases:
// the triage reads canon's and the enforcer's own issues like anyone else's.

export function inScope(repo, { exclude }) {
  if (repo.archived || repo.fork) return false;
  return !exclude.has(String(repo.full_name).toLowerCase());
}

// Why a repo was left out, for the file's `skipped` list — a reader must be able to
// tell "not in the fleet" from "the read failed".
export function skipReason(repo, { exclude }) {
  if (repo.archived) return 'archived';
  if (repo.fork) return 'fork';
  if (exclude.has(String(repo.full_name).toLowerCase())) return 'excluded';
  return null;
}

// One issue as triage reads it. The issues endpoint lists pull requests too; a PR is
// not an issue and answers null. Bodies are dropped on purpose — they are what pushed
// a session-side read past its token cap, and the triage samples them by hand.
export function shapeIssue(issue) {
  if (issue.pull_request) return null;
  return {
    number: issue.number,
    title: issue.title,
    labels: (issue.labels ?? []).map((l) => (typeof l === 'string' ? l : l?.name)).filter(Boolean),
    created_at: issue.created_at,
    updated_at: issue.updated_at,
    comments: issue.comments ?? 0,
  };
}

export function renderSnapshot({ generated, owner, repos, skipped = [] }) {
  const byName = (a, b) => a.repo.localeCompare(b.repo);
  const shaped = [...repos].sort(byName).map((r) => {
    const issues = [...r.issues].sort((a, b) => b.number - a.number);
    return { repo: r.repo, openIssues: issues.length, issues };
  });
  const out = {
    generated,
    owner,
    total: shaped.reduce((n, r) => n + r.openIssues, 0),
    repos: shaped,
    skipped: [...skipped].sort(byName),
  };
  return `${JSON.stringify(out, null, 2)}\n`;
}

// The stamp is the one line that moves on every run by construction.
export const withoutStamp = (text) => text.replace(/^\s*"generated": "[^"]*",?\n/m, '');
