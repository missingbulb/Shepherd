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
