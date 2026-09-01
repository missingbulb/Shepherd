---
name: fleet-triage
description: Survey every open issue across the whole missingbulb fleet, split the queue items from the plain ones, and attribute each parked task to the cause that actually parked it. Use when asked for a triage run, a fleet overview, a stuck-tasks analysis, or "all open issues across the fleet".
---

# Fleet triage

A standing survey of every open issue in the fleet, and a cause-level read of the queue items
among them. It **assesses and reports** — it never relabels, closes, or re-queues. Acting on what
it finds is a separate, separately-approved change.

The report has two halves, and the second is the one worth the run:

1. **Every open issue**, categorised — the complete picture, so nothing is invisible.
2. **The queue items, attributed** — not *what state is this in* (the label already says that) but
   *what put it there*, which the label frequently gets wrong.

## The one rule that makes it worth reading

**A structural argument is a hypothesis until you have sampled it.** Reason from the code about
what *can* produce a state, then read at least one real item per cohort before reporting any of it.

This is not caution for its own sake — it is the rule this skill exists because of. A previous run
proved from canon that no agent could write a `decision` park (`converge-item.mjs` cannot reach the
GitHub API session-side, so the outcome path is dead) and reported ~86 of 93 as machine mislabels.
The reasoning about the *script* was correct and the conclusion was still wrong: agents replicate
that transition **by hand over the GitHub MCP tools**, which is the path this repo's own rules
prescribe. One sampled comment thread overturned it. Sample every cohort you intend to name.

## 1. Collect

The roster comes from `mcp__Claude_Code_Remote__list_repos` (query `missingbulb`). Drop archived
repos and anything in `exclude` on the `claudinite-fleet-sheepdog` config in
`.claudinite-settings.json` — that key is the fleet's only opt-out.

Then **one `mcp__github__list_issues` per repo**, and shape the call so it survives:

```
state: "OPEN", perPage: 100, fields: ["number","title","labels","updated_at"]
```

Omitting `body` is what keeps a 99-issue repo under the token cap. Cross-check each response's
`totalCount` against the rows you got, and reconcile the sum before analysing anything.

Do **not** enumerate with `mcp__github__search_issues` — RULES.md records why its query filtering
cannot be trusted, on either search tool, and an unfiltered result overflows. `list_issues` per
repo, with the field subset, is the reliable path. If a repo is not attached, `add_repo` it;
never report a repo as unreachable without checking `list_repos` first.

**Write the rows to a TSV in the scratchpad and classify with a script.** Sixteen repos of labels
is past what eyeballing gets right, and a script makes every count reproducible and every
recategorisation free — you will want to re-cut the data two or three times before the interesting
axis appears.

## 2. Split queue items from plain issues

An issue is **queue-managed** if its title starts `[claudinite-work]`, or it carries any `task:`
label, or the retired `needs-human` / `origin:schedule` marks. Everything else is a plain issue.
Both halves belong in the report; they answer different questions.

Note the **label generation** on every queue item: canon `task:status:*` versus the retired
`needs-human` + `task:needs-human-*` pair. Nothing re-labels an already-parked item, so the
generation is a rough clock — and a large legacy population is itself a finding, because those
items sit outside the vocabulary the janitor and dashboard read.

## 3. Categorise — suggestions, not a fixed set

Start from these axes, then **find the cut that makes this particular fleet state legible.** A run
that only reproduces the axes below has under-delivered; each run should surface at least one
grouping the list does not name.

- **Park kind** — `failure`, `action`, `decision`, `approval`.
- **Label generation** — canon vs retired.
- **Lane duplication** — group by `(repo, pack/task)`. More than one open park on a lane means the
  generator kept re-filing behind a park that never held it. Report distinct lanes alongside the
  raw count; the gap is the redundancy.
- **Non-park queue states** — `blocked`, `waiting-for-executor`, bare `needs-human` with no kind,
  items with no status label at all (a torn label swap, rule D's), and an open item wearing a
  **terminal** status (`done` / `rejected` — rule H's: the close that never happened, the one
  state every other rule reads as finished).
- **Cross-repo duplicates** — the same defect filed independently in many repos is a signal about
  the *fleet*, not the repos. Seven separate issues for one converge-item dead end said more than
  any of them did alone.
- **Plain issues** — `quick-win`, `needs-decision`, `blocked`, tidy trackers, schedule boards,
  `add-packs`, `workflow-failure`, unlabelled backlog. An open `workflow-failure`, or a repo
  reporting its own scheduler frozen, means that member may not be running tasks at all — chase
  that before tallying anything else about it.

Other cuts worth trying when the data suggests them: age of the park, whether an open PR is
attached (a park holding a finished PR is a different problem from a park holding nothing), which
task dominates, and which repos are contributing disproportionately.

### More axes, each answering a different question

None of these is mandatory; each one is listed because it turns a count into a decision. Pick
the ones the data makes cheap.

- **Expected recoverer.** For every open queue item, name the janitor rule whose *premise* it
  matches — A stale ready, B dead agent, C stuck blocked, D stateless, E superseded park, F
  orphaned park, G ended park, H unclosed terminal (all in `queue/janitor-rules.mjs`) — and then
  check whether that rule's own comment is on the thread. Three buckets fall out: rule fired
  (healthy), rule matched but never fired (the *mechanically stuck* class above, now found by
  construction rather than by luck), and **no rule matches at all** — a gap in the janitor, which
  is a canon finding rather than a fleet one, and the bucket most worth reporting when it is
  non-empty.
- **Lane cost, in missed runs.** A park kind that holds a task's lane (`isBlockingPark`) stops
  every later occurrence of that task. Convert each such park's age into periods of the task's
  declared `frequency` at HEAD: a `failure` park eleven days old on a daily task is eleven runs
  that never happened. Rank by missed runs rather than by item count — one blocking park can
  outweigh fifty non-blocking ones that cost nothing but a relabel.
- **Fungible vs ad-hoc.** A scheduled occurrence is fungible — a later clean run answers it, and
  rule E may close it. A marked or ad-hoc item (`task:origin:ad-hoc`, a request someone filed by
  hand) is by design excluded from supersession and stays until a human reads it. Split the
  parked population on this axis before quoting a "self-heals" share: the ad-hoc fraction is the
  part that will not.
- **Approval parks by end condition.** Group `approval` parks by their `Ends-when` target's state:
  open (genuinely waiting), merged or closed (rule G should have fired — check the recoverer
  axis), and **no `Ends-when` at all** — a park nothing can ever end mechanically, permanent by
  construction, which is usually an older filer that predates the field.
- **Wait vs sleep on `blocked`.** A blocked item with a future `Not-before` and closed blockers is
  sleeping — the mechanism working, never stuck. One whose `Blocked-by` targets are all closed and
  is still blocked missed its release (the `readyDependents` hand-off that only an Action-side run
  performs). Chain length matters too: `do-later` deferrals chain each behind the last, so one
  dead link parks every item after it — report the chain, not each link.
- **Waiting-for-executor age against the task's period.** An item ready past ~2 of its own
  periods is rule A's, and if no such comment appears the member's executor is not picking at
  all. Cross this with the `workflow-failure` and frozen-scheduler reads in the plain-issue list:
  a repo that is not running tasks has counts that are all stale, in every other axis.
- **Member liveness from timestamps.** Bucket each repo by whether *any* of its queue items moved
  in the last sweep window. A member where nothing moved while the rest of the fleet did has a
  janitor that did not run, and every count reported for it describes a snapshot no rule has
  looked at since — say so beside its numbers.
- **Who wrote the park.** From the thread: a janitor rule (its verbatim comment), the executor (a
  code-work failure log), an agent that converged by hand (an execution record), or a human
  relabel (no comment at all). The same kind means different things per writer — a `failure` the
  executor wrote is a crash; one the janitor wrote on a dead agent is an orphaned run.
- **Plain issues by filer.** Machine-filed (`isDispatchTitle` from `dispatch.mjs`, tidy trackers,
  `workflow-failure`, fleet-drift, `verify-in-production` probes, `do-later` deferrals) against
  human-filed. RULES.md already warns that the machine wins every activity ranking; the same
  filter belongs on the open-issue picture, or the human backlog disappears under bookkeeping.
  Within the human-filed half, cut by last activity — an unlabelled issue untouched for months is
  a different report line from one filed this week.

### A worked cause taxonomy — one fleet's letter codes, not a fixed set

A prior multi-day run against this same fleet built out a fuller cause taxonomy in passes, coding
each cause tersely for reporting (`R5×16`, `R1: 53`). Reuse the codes, extend them, or renumber
them — they're a convenient shorthand for a report, nothing more. Treat the *mechanism* behind
each one as the reusable part, not the label it happens to produce today: the label already
changed once mid-investigation (a dead-agent park read `decision` for months, then was fixed to
read `failure`), and it will drift again. Re-derive which label a mechanism produces from canon
per §4, every run.

- **R1 — convergence orphaned.** An agent did the work and could not perform the deterministic
  closing steps itself (no direct GitHub API from an MCP-only session; the script that would do it
  is Action-side only). The tell is a substantive result comment followed by nothing, then a
  leash-timeout comment. Whatever kind it lands on is usually non-blocking, so it **mints a fresh
  occurrence every cycle** until the underlying gap — not the individual item — is fixed.
- **R2 — blown claim awaiting sweep.** Same root cause as R1, just caught before the janitor's next
  pass swept it. Self-heals; don't report it as backlog distinct from R1.
- **R3 — blocking failure, task still live.** A genuine crash park on a pack/task that still
  exists. Needs a human — but check whether the *crash cause* is already fixed upstream and only
  the park is stale residue; that's a one-line clear-and-resweep, not a real investigation.
- **R4 — dead pointer.** The item's title or body path names a pack/task id that no longer exists
  at HEAD (a rename, a retirement, a pre-migration directory). Should self-close under a retirement
  rule — but **verify the rule actually matches this exact item**, not just that a retirement rule
  exists. A task's identity is often stored in two places (a canonicalized id in the title, a raw
  path in the body); a rule that checks only one silently misses items where the two have
  diverged — that gap sat unnoticed until items were tested individually against it.
- **R5 — a genuine outstanding question.** Real content someone owes a judgement on. Usually the
  largest bucket, and *not itself a problem* — except that a mislabelled R1/R2 lands here too, so
  don't take the raw count at face value. Two cheap cross-checks pull the wheat from the chaff:
  open-PR cross-reference and duplicate-question grouping, both in §4.
- **R6 — torn label swap.** The item carries two labels a clean state machine treats as mutually
  exclusive (an in-flight claim label *and* a parked label at once), from a swap that died
  mid-write. A torn swap has **two shapes**, and the decode treats them differently: zero status
  labels (the remove landed, the add did not) is rule D's stateless item and self-repairs to a
  park; two status labels decodes as whichever park label is worn (`statusOf` prefers a park over
  any other status), so the item is *not* invisible — it reads as an ordinary park to rules E, F
  and G, which can still clear it, and only the leash (rule B) stops seeing it. What nothing
  clears is the stray claim label itself, so confirm the shape by reading the labels, not by
  assuming; a two-label item that survived a fleet-wide sweep untouched while everything around
  it moved is one no clearing rule matched.
- **R7 — active claim, within its leash.** Running normally. Exclude from every stuck-count; report
  it only as a sanity total.
- **R8 — blocked on a dependency.** An explicit blocked-by reference. Self-heals when the blocker
  closes — but verify the blocker is *actually* still open before crediting this bucket; a stale
  pointer at a closed issue is really an R1/R2/R6 in disguise.
- **R9 — bare legacy park, no decodable kind.** Read what the current decode path falls back to for
  an unkinded park before assuming "no kind" means "harmless" — the fallback has been a blocking
  kind before.
- **Mechanically stuck — the class worth hunting for last, because it's the worst one.** An item
  whose documented recovery mechanism (a leash, a reclaim, a scheduled sweep) carries a stated SLA
  and simply hasn't fired within it. This is not "the rule doesn't match" (that's R4/R9); **the
  rule never ran at all.** Finding it means checking elapsed time against the mechanism's own
  documented window, not just the item's current label — it will look identical to an ordinary
  blocking park until you do.

## 4. Attribute cause

**Derive the writers from canon rather than trusting any table — including this one.** The park
vocabulary is under active change, so read it fresh each run, from a current checkout:

```
grep -rn "NEEDS_HUMAN_<KIND>" packs/ --include=*.mjs | grep -v test
```

Two semantics decide how a park behaves, and both live in canon:

- `isBlockingPark` (`queue/work-item.mjs`) — the kinds that **hold a task's lane**. Any other kind
  lets the generator file a fresh occurrence at the next anchor, which is where duplicate lanes
  come from.
- `SUPERSEDABLE_PARKS` (`queue/janitor-rules.mjs`) — the kinds a later clean run can **clear
  automatically**. A park outside that set is permanent until a human touches it.

A kind that is in neither set is a trap: it accumulates and it never drains. Check whether the
kind dominating your data is one, and say so plainly if it is.

### Discriminators that settle a cause

- **The janitor's own comment, verbatim.** Rule B (dead agent leash) reads *"carried
  `task:status:running-agent` for over 3h with no activity — the agent session that claimed it …
  never converged it"*; older items say `task:agent` and *"Labeling `needs-human`"*. Finding that
  text ends the question.
- **An execution record** — a `claudinite-task-exec v1 <pack>/<task> [#n] <status>` comment — means
  an **agent** converged the item deliberately. That park is genuine whatever else it looks like.
- **Timestamp clustering.** Many items across many repos moving within a minute or two is a
  scheduled sweep (each member's own janitor on a shared cron), never agent work. Scattered
  timestamps are per-repo runs. This separates two cohorts cheaply, before you read a single
  comment.
- **A result comment followed by a machine park** is the important sub-case: the agent *did the
  work*, posted its findings, and never closed the lane. That is a convergence failure, not a
  failed run, and it should never be reported as the same thing as a session that genuinely died.
- **A repeated park across repos in one window** is usually **one** condition, not N — check
  whether the threads name the same blocker before reporting a count.

### Cross-checks that separate real backlog from artifact

- **Open-PR cross-reference.** Per repo, count open PRs (`list_pull_requests`) against that repo's
  count of "genuine question" parks. An item sitting in that bucket whose own last comment names an
  open PR it's waiting on should really be an approval park — the same convergence failure that
  left it unclosed is what left it mislabelled. In one run this cross-check moved ~40% of the
  bucket.
- **Duplicate-question grouping.** Group the "genuine question" bucket by `(repo, pack/task)`. The
  distinct-lane count, not the raw item count, is the real backlog; the gap is redundant re-filings
  of a lane that never actually closed. In one run this was 45% of the bucket — 128 items, 70
  distinct questions.
- **Task concentration.** Rank by `(pack/task)` across the *whole* fleet, not per repo. A handful of
  tasks can carry most of the backlog — one run found four tasks in one pack were 64% of every
  parked item fleet-wide. That's a statement about the task, not about many repos independently
  having bad luck, and it points the fix at one place instead of fourteen.
- **Recurring-cause grouping over time.** A non-blocking park whose worker message names a
  concrete, fixable gap (a missing repo secret, an absent credential) re-files **every cycle**
  against the same unfixed cause. Group by `(repo, task, cause text)` across multiple occurrences
  rather than counting each day's occurrence as independent backlog — the fix is one action (add
  the secret), not N relabels, and reporting it as N items overstates the problem and understates
  how cheap the fix is.
- **A rule's existence is not evidence it applies.** Twice in one investigation a structural rule
  that read as complete — a retirement matcher, a supersession rule — missed real items once tested
  against them individually, for two different reasons: a task's identity stored in two places that
  had quietly diverged, and a park kind excluded from supersession *by design* that a different
  rule was also hardcoding for an unrelated reason nobody had connected to it. Test a rule against
  a concrete item it's supposed to cover, not just its presence in canon — this is the same
  discipline as the sampling rule at the top of this skill, applied one level deeper.

### Reading comments without blowing the cap

`mcp__github__issue_read` with `method: "get_comments"` and `perPage: 8`–`10`. On an overflow,
parse the saved `tool-results/*.txt` with a small python slice rather than re-fetching:
`get_comments` returns a bare list; the search tools return GitHub's
`{total_count, incomplete_results, items}` envelope.

The park-setting comment is the **last** one, so when an item is long, page to the end rather than
reading from the start.

## 5. Report

Lead with the totals and the split, then the cause table, then the deep dive on whatever the run
found most interesting. State the fleet-wide mechanism where there is one — *why* these items
accumulated beats any per-item enumeration.

Deliver the complete per-repo listing as a **file**, grouped repo by repo with status and label
generation per row, so the conversation carries the analysis and the file carries the evidence.

Where a previous run's finding is corrected, **say so plainly and give the evidence that
overturned it.** A triage series that never revises itself is not being sampled.

Close with what is still open and what acting on it would take — as a recommendation. The relabel,
the close, the re-queue are all somebody's explicit call, and this skill does not make it.
