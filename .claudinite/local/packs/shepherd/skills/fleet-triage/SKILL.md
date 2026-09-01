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
  and items with no status label at all (a torn label swap).
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
