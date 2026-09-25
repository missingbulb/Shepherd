## 2026-09-02 · born · Collect fleet-triage's issues Action-side: the fleet-issues-snapshot task (#410)
- **Source:** the 2026-09-01 triage run's ~32 calls and 353-row hand transcription (#409).
- **Reason:** a session is scoped to this repo, so a fleet-wide read costs an attach per member and
  a transcription; this repo already walks the fleet Action-side with the fleet PAT.
- **Actor:** @missingbulb (owner).
- **Mechanism:** a code-work task (`agent_model: none`, `node worker.mjs`) over
  `FLEET_GITHUB_TOKEN`, delivering a GENERATED file on a self-landing PR under the usage fold's
  policy; ungated daily, since its inputs live in other repos.
- **Rejected:** collecting session-side: `list_issues` is repo-scoped and shell REST is refused by
  the session proxy.
- **Landed:** #410 (Closes #409).

## 2026-09-02 · policy-changed · fleet-issues-snapshot: declare preconditions, not a precondition function (#424)
- **Reason:** the `precondition()` function form was being retired fleet-wide; the task fired
  unconditionally, which the declarative `none` says.
- **Actor:** @missingbulb (owner).
- **Model:** Claude Opus 5, per the commit trailer.
- **Mechanism:** `preconditions: ['none']`.
- **Landed:** #424.

## 2026-09-03 · moved · Claudinite update: 8 packs upgraded (2a81e58)
- **Reason:** canon's task-declaration migration turned `task.mjs` into `task.json`; the
  declaration's comments moved to the task README.
- **Actor:** claudinite-lifecycle/update run.
- **Mechanism:** a `task.json` declaration.
- **Landed:** commit 2a81e58.

## 2026-09-05 · policy-changed · Point the snapshot task's imports at task.json (#461)
- **Reason:** the task.json migration deleted task.mjs but left the worker importing it; the worker
  stopped loading and #449 parked `failure`.
- **Actor:** @missingbulb (owner).
- **Model:** Claude, per the commit trailer.
- **Mechanism:** the worker imports `task.json`.
- **Landed:** #461 (Closes #460).

## 2026-09-07 · policy-changed · Claudinite update: 7 packs upgraded (#492)
- **Reason:** canon's trigger vocabulary replaced `frequency: daily` and `none`.
- **Actor:** claudinite-lifecycle/update run.
- **Mechanism:** `trigger: schedule`, `preconditions: ['due:daily']`.
- **Landed:** #492.

## 2026-09-08 · policy-changed · Mail three fleet repos every morning (#504)
- **Reason:** `expected_outcome: "pr"` and `required_secrets` were retired spellings; no behaviour
  change.
- **Actor:** @missingbulb (owner).
- **Model:** Claude Opus 5, per the commit trailer.
- **Mechanism:** `expected_outcome: "fresh_pr"`, `code_work_required_secrets`.
- **Landed:** #504.

## 2026-09-15 · policy-changed · Claudinite update: 5 packs upgraded, converged onto the tasks pack's public surface (#615)
- **Reason:** the worker's pack-root `deliver-generated.mjs` import was removed by the same
  converge; imports repointed to the tasks pack's `public/` surface.
- **Actor:** claudinite-lifecycle/update run.
- **Model:** Claude Opus 5, per the commit trailer.
- **Mechanism:** the worker.
- **Landed:** #615.

## 2026-09-20 · policy-changed · Converge the mount to Claudinite 4f74acb and run the queue from its src/ entry points (#677)
- **Reason:** worker imports moved off retired `public/` paths onto the surviving definitions.
- **Actor:** @missingbulb (owner).
- **Model:** Claude, per the commit trailer.
- **Mechanism:** the worker.
- **Landed:** #677.

## 2026-09-24 · policy-changed · Claudinite update: 8 packs upgraded (2e21a60)
- **Reason:** canon renamed the daily precondition.
- **Actor:** claudinite-lifecycle/update run.
- **Mechanism:** `schedule:at-most-daily`.
- **Landed:** commit 2e21a60.
