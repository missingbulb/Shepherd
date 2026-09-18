# Fleet triage — 2026-09-18 (delta run)

**There is no new fleet data today, and the reason is worth more than the run would have been.**

`origin/main` has not moved since 2026-09-17 09:28:57Z. The snapshot on disk is still
`2026-09-17T09:24:31.377Z` — the one the [09-17 report](fleet-triage-2026-09-17.md) was written
from. Forcing a fresh one is refused by the mechanism, correctly:

```
shepherd/fleet-issues-snapshot is on the schedule, so an unqualified item for it IS its
standing item — the scheduler run would close one of the two as a duplicate. To run it now,
wake its standing item (`--wake #N`, …)
```

There is no standing item to wake: yesterday's #642 closed when it converged. The lane is
healthy and simply has not come round again — Shepherd's scheduler last ran 09-17 19:41Z and
next fires at ~09:23Z. So this run classifies nothing new and reports three things instead: a
correction to yesterday's headline that canon's own sources overturn, one finding they sharpen,
and what Shepherd did overnight.

---

## 1. Correction — canon had already built the durable answer, in the same change

Yesterday's report said the re-shelve moved `queue/instructions.md` to `public/instructions.md`
with nothing guarding the move, and read `SURFACE.GENERATED.md`'s blindness to out-of-tree
readers as an oversight. **The first half is wrong.** Canon's own `claudinite-tasks/README.md`
states the contract in the terms yesterday's report proposed as a recommendation:

> One folder, one promise: **a name in `public/` does not move.** […] A member's
> `.github/workflows/`, a routine's stored prompt and a member's `.claudinite/local/packs/**`
> are all things this repository cannot rewrite: a converge refreshes the mount and touches none
> of them. Every path any of them names therefore has to be one that stays put, and
> `public/` is where those paths are kept.

`public/create-work-item.mjs`'s own header says the same, and names the failure mode exactly:

> A member spends every window between its mount refreshing (nightly) and those being re-pointed
> (whenever) running whichever path it still names — so a run that finds nothing here is a repo
> whose queue stops silently, with no run left to fix it.

And it is enforced, not merely written down: `tasks-pack-read-through-its-surface` — **blocking,
`since: 2026-09-14`**, shipped in every member that declares the pack. Canon also shipped the
in-repo legacy tolerance with a dated removal: `queue/`'s `implement-request/task.md` survives as
a redirect "for work items minted before the move (retired 2026-10-15)".

So the re-shelve was not a path move that forgot its consumers. It was the change that **named
the routine's stored prompt as an un-rewritable consumer and built the boundary to protect it** —
and `SURFACE.GENERATED.md` reporting only tracked-tree readers is a limit of that one report, not
evidence the problem was unseen.

**What survives, and it is the whole of it:** the boundary protects every path from now on and
brings nothing across it. The eight members whose stored prompts still name `queue/instructions.md`
are the one-time transition, and for that half canon has a precedent it did not repeat —
[#1322, "L2: manual fleet pass — repoint member workflows and routine prompts to the pack paths"](https://github.com/missingbulb/Claudinite/issues/1322),
filed as an explicit link in the August move's chain. A dated tolerance was shipped for the half a
converge can reach; the half it cannot reach got neither a tolerance nor a pass.

That is a smaller finding than yesterday's and a more actionable one: not "build a guard", which
exists, but "file the backfill", which is one issue.

## 2. Sharpened — the guard is JavaScript-only, and canon's own prose is already outside it

Yesterday's report flagged that `claudinite-fleet-sheepdog`'s RULES.md and its
`fleet-baseline/README.md` tell an operator to run `…/claudinite-tasks/src/schedule/create-work-item.mjs`,
reaching past the published surface. The check's own declaration says why nothing caught it:

```json
"scanFiles": "/^(\\.claudinite\\/(shared|local)\\/)?packs\\/(?!claudinite-tasks\\/).*\\.m?js$/",
"matchLines": [{ "match": "/(?:from|import\\s*\\()\\s*['\"][^'\"]*claudinite-tasks\\/(?!public\\/)[^'\"]*['\"]/" }]
```

`.m?js` only, and an `import`/`from` matcher. A Markdown line reading `node <path>` is invisible to
it on both axes. So the pack that publishes the surface has a blocking check for code and none for
the prose an operator actually follows — while `public/create-work-item.mjs`'s header says in the
same breath that a name there does not move and that "the mechanism lives under `src/`".

The fix is one line of the same check's declaration widened to `.md` with a `node …` matcher, which
is [#1475](https://github.com/missingbulb/Claudinite/issues/1475)'s own `runnable-doc-commands`
idea pointed at the destination rather than at resolvability. Canon's call, not this repo's.

## 3. Shepherd converged its whole day

All ten work items the 09-17 anchor created (#634–#643) are closed. Shepherd's open issues fell
22 → 12, its four parks are unchanged (#212, #332, #333, #396), and the eight plain issues are the
same eight. Yesterday's reading that Shepherd's lane is one of the two still fully converging is
confirmed by outcome rather than by inference.

## 4. An Actions-side cohort seven runs of this series never saw

22 of the last 40 `pull_request`-triggered `Checks` runs concluded **failure**, going back to at
least 09-11. Every one is on a `claudinite/*` machine branch; every `claude/*` branch run in the
same window succeeded. Each failing run has **zero jobs**, and each is paired with a
`workflow_dispatch` run on the identical head sha, seconds apart, that has a job and passes:

| head sha | dispatch run | pull_request run |
|---|---|---|
| `5aaa627` (fleet-issues-snapshot, 09-17) | 1 job, success | 0 jobs, failure |
| `7861472` (usage-fold, 09-17) | 1 job, success | 0 jobs, failure |
| `e33514c` (update, 09-17) | 1 job, success | 0 jobs, failure |
| `51f533d` (tasks-usage-fold, 09-17) | 1 job, success | 0 jobs, failure |

All four PRs merged. **This is noise, not breakage** — and the first reading of it was wrong.
I expected these empty runs to poison the check-runs view, which this repo's own RULES.md tells
future sessions to read when judging a PR's status. They do not: `get_check_runs` on
[#644](https://github.com/missingbulb/Shepherd/pull/644) returns exactly one run, the dispatch
job, `success`. A run with no jobs contributes no check runs, so the documented procedure is
safe and needs no change.

What is left is that the Actions tab carries a standing 55% red rate that means nothing, which is
the condition under which a real failure goes unread. Worth a line in a report; not worth a fix
until someone has been misled by it.

The broader point for this series: seven runs have classified the fleet from an issues snapshot,
and this cohort is invisible in one. A workflow run is not an issue. Nothing in the snapshot, and
nothing in the classifier, would ever have surfaced it.

---

## Still open

Unchanged from [09-17](fleet-triage-2026-09-17.md) except where noted:

1. **Eight members' stored routine prompts name `queue/instructions.md`** — MissingBulbWebsite#421,
   ClaudiniteCanary#448, VascularColoring#436, ClaudiniteWebsite#565, GoogleCalendarEventCreator#1260,
   TLDR#545, NoRFinder#102, EdFringeNow#726. **Restated:** the ask is the one-time backfill pass,
   not a guard — the guard shipped on 2026-09-14.
2. **No canon issue exists for that backfill**, and no [#1322](https://github.com/missingbulb/Claudinite/issues/1322)-shaped
   fleet pass was filed for this move.
3. **`tasks-pack-read-through-its-surface` is `.m?js`-only** — canon's own sheepdog prose already
   sits outside it.
4. **`SURFACE.GENERATED.md` reports `nobody` for two documents read only from outside the tree.**
   **Downgraded:** a limit of that report, not an unseen problem — the README names those readers
   explicitly.
5. **Approval parks predating `Ends-when:` cannot end** — [Claudinite#1428](https://github.com/missingbulb/Claudinite/issues/1428)'s
   condition was met on 09-06; #1274 and #1275 have none at all.
6. **53% of all parks sit on four `claudinite-growth` tasks.**
7. **`decision` (33) and `action` (11) are in neither `isBlockingPark` nor `SUPERSEDABLE_PARKS`**
   ([Claudinite#2010](https://github.com/missingbulb/Claudinite/issues/2010)).
8. **[Shepherd#617](https://github.com/missingbulb/Shepherd/issues/617)'s cause is unaddressed in canon.**
9. **Three members went quiet on 09-13** — CrosswordChat, ShoutsAndWhispers, hitbut.
10. **22 empty `pull_request` Checks runs** stand red in Shepherd's Actions tab and gate nothing.

The next real classification run wants a snapshot newer than 2026-09-17T09:24Z. It arrives on its
own when Shepherd's scheduler next fires.

Nothing here was relabelled, closed or re-queued.
