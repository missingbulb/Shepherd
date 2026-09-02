// shepherd task: fleet-issues-snapshot — every open issue in every fleet repo, as one
// tracked file the fleet-triage skill classifies from.
//
// WHY. A session is scoped to this repo, so a fleet-wide issue read from a session
// costs one attach per member before a single read, and the rows then have to be
// copied out of tool output by hand. This repo already walks the fleet Action-side
// with the fleet PAT for the sheepdog sweeps; the snapshot is that walk's cheapest
// possible cousin — one paged read per repo — landed where a session can `cat` it.
//
// `agent_model: 'none'` with `code_work: 'node worker.mjs'`: deterministic code the
// executor runs as code-work. Like fleet-roster, an ordinary pack task whose
// implementation happens to read every repo under the owner; nothing about its wiring
// is fleet-shaped.
//
// Self-contained (imports nothing): the whole contract is this default export.

export default {
  id: 'fleet-issues-snapshot',
  frequency: 'daily',                    // the triage's own cadence is "when asked"; daily keeps the file at most a day old, and a force-run refreshes it now
  agent_model: 'none',                   // pure code — no agent
  expected_outcome: 'pr',
  // The regenerated snapshot is the whole delivery, scoped to the tree it lands in.
  // Its merge=ours line is in .gitattributes beside the usage aggregate's.
  automerge: ['under:.claudinite/local && generated-file-changes'],
  code_work: 'node worker.mjs',
  // One paged enumeration plus one paged issues read per in-scope repo (a page per
  // hundred open issues), serial. ~20 repos is well under a minute; 600s is far past
  // that while staying inside the hourly cadence so a hung read is killed before the
  // next run could collide with it.
  code_work_timeout: 600,
  required_secrets: ['FLEET_GITHUB_TOKEN'], // the account-spanning PAT; fleet-token.mjs states the grant

  preconditions: ['none'],
};
