# Fleet issues snapshot — every open issue in the fleet, as one file

**This task runs no agent.** It is `agent_model: none` with `code_work: node worker.mjs`, so the whole pass is the deterministic [`worker.mjs`](worker.mjs) the executor runs as code-work, over the pure [`snapshot.mjs`](snapshot.mjs) beside it. This file is the human-facing record of what that worker does.

## What it does

Daily, over the `FLEET_GITHUB_TOKEN` PAT: read this repo's `claudinite-fleet-sheepdog` config (`owner`, `exclude`), enumerate every repo that owner owns, drop archived repos, forks and the excluded ones, and read every open issue in each of the rest — number, title, labels, timestamps, comment count; never the body. It renders `.claudinite/local/fleet-issues.GENERATED.json` and delivers it on a self-landing PR under `under:.claudinite/local && generated-file-changes`. A recompute that differs from the base only in its `generated` stamp delivers nothing.

Force it when a triage wants a fresher file than the last anchor's:

```
node .claudinite/shared/packs/claudinite-tasks/queue/create-work-item.mjs shepherd/fleet-issues-snapshot
```

## Who reads it

The [fleet-triage](../../skills/fleet-triage/SKILL.md) skill's `classify.mjs`, which turns the file into the report's cuts. The file exists so that step costs one `node` invocation instead of one repository attach per member and a hand transcription — see [Shepherd#409](https://github.com/missingbulb/Shepherd/issues/409).

## What is deliberately not in it

- **Bodies.** They are the bulk of an issue read and the triage samples them by hand over MCP, a few at a time, where judgment is needed.
- **Comments.** Same reason; the park-setting comment is the last one and is read per sampled item.
- **Pull requests.** The issues endpoint lists them; `shapeIssue` drops them.
- **Canon and home special cases.** The sheepdog sweeps treat the enforcer and canon specially because they measure membership; the triage reads their issues like anyone else's.

## Why the declaration reads as it does

Carried over from the declaration's comments when it became task.json.

shepherd task: fleet-issues-snapshot — every open issue in every fleet repo, as one
tracked file the fleet-triage skill classifies from.

WHY. A session is scoped to this repo, so a fleet-wide issue read from a session
costs one attach per member before a single read, and the rows then have to be
copied out of tool output by hand. This repo already walks the fleet Action-side
with the fleet PAT for the sheepdog sweeps; the snapshot is that walk's cheapest
possible cousin — one paged read per repo — landed where a session can `cat` it.

`agent_model: 'none'` with `code_work: 'node worker.mjs'`: deterministic code the
executor runs as code-work. Like fleet-roster, an ordinary pack task whose
implementation happens to read every repo under the owner; nothing about its wiring
is fleet-shaped.

Self-contained (imports nothing): the whole contract is this default export.
the triage's own cadence is "when asked"; daily keeps the file at most a day old, and a force-run refreshes it now
pure code — no agent
The regenerated snapshot is the whole delivery, scoped to the tree it lands in.
Its merge=ours line is in .gitattributes beside the usage aggregate's.
One paged enumeration plus one paged issues read per in-scope repo (a page per
hundred open issues), serial. ~20 repos is well under a minute; 600s is far past
that while staying inside the hourly cadence so a hung read is killed before the
next run could collide with it.
the account-spanning PAT; fleet-token.mjs states the grant
