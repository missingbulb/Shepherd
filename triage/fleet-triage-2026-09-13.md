# Fleet triage — 2026-09-13

417 open issues across 15 in-scope repos under `missingbulb`, from the snapshot generated
2026-09-13T16:03:57.156Z. **177 queue-managed, 240 plain. 125 parked.**

The headline: **the janitor is winning against `failure` and losing the war.** Parked items are
back to exactly where this series started — 125, the same number as 2026-09-02 — but the
composition has inverted. `failure`, the one kind two rules can clear, has fallen 36 → 16. The
kinds nothing clears have risen to 95 of 125. The fleet did not stop parking; it stopped parking
on the kind that drains.

Underneath that sits one defect this run can name precisely: **the fix for
[Claudinite#1515](https://github.com/missingbulb/Claudinite/issues/1515) was applied to one of the
two interrupt leashes and not the other**, and the other one is the one every ad-hoc item runs
through.

## The two leashes disagree, and only one was fixed

Claudinite#1515 — *"Rule B parks a dead agent `decision`, the one kind no later run can clear"* —
is closed. Rule B does now park `failure`, in canon at HEAD
(`packs/claudinite-tasks/tasks/task-janitor/queue-sweep.mjs:114`):

```js
await escalate(item, deadAgentComment(...), STATUS_RUNNING_AGENT, NEEDS_HUMAN_FAILURE);
```

The **executor** leash was left as it was. `packs/claudinite-tasks/queue/scheduler-run.mjs`, job 3,
reclaiming a dead executor claim:

```js
const oneShot = parsed && policyOf.get(`${parsed.pack}/${parsed.task}`) === 'needs-human';
ops.push({
  kind: 'reclaim', issue: item.number, to: oneShot ? NEEDS_HUMAN_DECISION : READY,
```

Both fire on the same event class — the holder of an item went silent. One escalates to a kind
rules E and I can close; the other escalates to a kind **no rule can close at all**, re-derived
from canon this run:

| | `SUPERSEDABLE_PARKS` (rule E) | rule I (10-day abandon) | rule G (`Ends-when:`) |
|---|---|---|---|
| `failure` | ✅ | ✅ standing only | — |
| `action` | ✅ | ❌ | — |
| `approval` | ❌ *by design* | ❌ | ✅ when the field is present |
| `decision` | ❌ *by design* | ❌ | ❌ |

Rule E additionally excludes `ASKED_FOR_ORIGINS` outright (`janitor-rules.mjs:172`), and rule I
requires `isStandingItem` plus a parsable `[claudinite-work]` title — so **an ad-hoc item parked
`decision` is outside every rule twice over.**

The code comment at the reclaim explains the choice, and the explanation is the bug:

> ONE label either way: back into the queue, or parked at the kind that says **what the human is
> being asked for** — whether the interrupted run left anything behind

The kind was picked for what it *says*, not for what it *does*. This is the same failure mode as
the [#1452](https://github.com/missingbulb/Claudinite/issues/1452) note in the 09-10 report, one
layer down: the park vocabulary carries two meanings at once, and the mechanical one loses.

### Sampled, twice, in two repos

The comment left on the reclaimed item is verbatim identical across both:

- [Shepherd#505](https://github.com/missingbulb/Shepherd/issues/505), 2026-09-13T16:01 — *"The
  executor holding this item went silent for over 60 minutes. This task declares
  `on_interrupt: 'needs-human'`, so nothing re-queues it automatically."* Now `decision`.
- [Claudinite#1716](https://github.com/missingbulb/Claudinite/issues/1716), 2026-09-07T13:17 — the
  same sentence, same park. It has not moved in six days, and nothing will move it.

### What runs through that path

From `scheduler-run.mjs`'s own comment:

> `implement-request`, the one task that declares `needs-human`, is exactly the task every ad-hoc
> item runs.

So **every hand-filed item whose agent run is interrupted parks permanently.** That is the
generator of a cohort this series has reported as inert for four runs without knowing where it came
from. Of the 11 ad-hoc `decision` parks, **7 are `Verify in production:` items** — the mechanism
`verify-in-production` exists to guarantee a change is proven live:

| item | parked since |
|---|---|
| [ClaudiniteWebsite#285](https://github.com/missingbulb/ClaudiniteWebsite/issues/285) — the redesigned site with the compounding chart | 08-26 |
| [ClaudiniteWebsite#288](https://github.com/missingbulb/ClaudiniteWebsite/issues/288) — the desk-scene hero | 08-26 |
| [Claudinite#1160](https://github.com/missingbulb/Claudinite/issues/1160) — an extension repo still ships to the store | 08-31 |
| [Claudinite#1455](https://github.com/missingbulb/Claudinite/issues/1455) — a member's executor still starts on the single read | 09-01 |
| [Claudinite#1458](https://github.com/missingbulb/Claudinite/issues/1458) — a retry re-arms `Not-before` to a future instant | 09-02 |
| [ClaudiniteWebsite#255](https://github.com/missingbulb/ClaudiniteWebsite/issues/255) — reframed site live at claudinite.com | 09-06 |
| [Claudinite#1716](https://github.com/missingbulb/Claudinite/issues/1716) — the executor amends or supersedes a task's open PR | 09-07 |
| [Shepherd#505](https://github.com/missingbulb/Shepherd/issues/505) — the morning fleet digest actually sends | 09-13 |

Eight production changes whose proof-of-life was filed as a mechanism that comes back on its own.
The mechanism came back, died on an interrupt, and parked itself where nothing looks. The basics
rule that sends work down this path — *"the follow-up is a mechanism that comes to you, never a
human's memory"* — is currently, and silently, a human's memory.

### The one that closes the loop on itself

Shepherd#505 is *"Verify in production: the morning fleet digest actually sends"*. Its full
history, read end to end:

- 09-08 08:49 — queued, `Not-before` 09-09T05:00.
- 09-09 08:58 — claimed, handed off, agent session started.
- 09-09 19:14 — **re-queued**, `Not-before` 09-12T09:03. The 09-09 agent never converged it and
  left no result comment: the R1 convergence-orphan shape, recycled rather than reported.
- 09-12 18:19 — claimed. *"This claim is spent — the executor released this item without closing
  it."*
- 09-13 16:01 — the executor leash fires. Parked `decision`. Permanent.

Two agent runs, neither converged, and the verification of the digest lane is now stuck in the same
machinery it was verifying. The 09-10 report sampled #505 as *"the requeue mechanism working end to
end"* — **that was wrong, and this is the correction.** What I read as a healthy re-queue on 09-09
was the second of two failed pickups. The mechanism re-queues; it does not converge, and it has no
way to say so.

## The digest lane, five mornings in

[Shepherd#503](https://github.com/missingbulb/Shepherd/issues/503)'s two checkboxes are still
unticked, and the lane has filed one park a morning since:

| | filed | park |
|---|---|---|
| [#514](https://github.com/missingbulb/Shepherd/issues/514) | 09-08 | failure |
| [#526](https://github.com/missingbulb/Shepherd/issues/526) | 09-09 | failure |
| [#536](https://github.com/missingbulb/Shepherd/issues/536) | 09-10 | failure |
| [#548](https://github.com/missingbulb/Shepherd/issues/548) | 09-11 | failure |
| [#566](https://github.com/missingbulb/Shepherd/issues/566) | 09-12 | failure |
| [#581](https://github.com/missingbulb/Shepherd/issues/581) | 09-13 | waiting-for-executor |

The cause text is byte-identical on every one of them —

```
claudinite-needs-human: action — set the repository variable DIGEST_EMAIL_FROM (an address on a
domain this Cloudflare account may send from), the repository variable DIGEST_EMAIL_TO (a verified
destination address on this Cloudflare account)
```

— so this is **one condition, not six**. The 09-10 report predicted this lane converges on ~10
open items, because rule I's 10-day bound is the only exit and the generator files one a day. Five
days in there are five, the oldest 5 days old, and rule I has not fired once. The prediction is
tracking exactly; the first closure is due around 09-18.

Worth stating plainly: fixing this is two repository variables. Everything above is the cost of
them not being set.

## `fleet-baseline` cannot say "waiting on you", so it fails

The 09-10 report left open: *read GoogleCalendarEventCreator's own artifacts to settle
[Shepherd#483](https://github.com/missingbulb/Shepherd/issues/483)*. That was acted on, by hand, on
09-11 — and the answer is better than expected. From
[Shepherd#552](https://github.com/missingbulb/Shepherd/issues/552), the manual retry:

> Resolved: the fleet is now at canon, 14 of 14. The run reported `did-not-converge` for the two
> members whose update PRs were open awaiting the owner's approval, not because either member
> failed to converge.

So **fleet convergence is green** — the 09-10 report's "red on two members" is withdrawn. But note
what it cost: two consecutive `fleet-baseline` runs (#483 on 09-07, #552 on 09-11) both reported
failure, both parked, and both had to be read and closed by a person, because the follow has no
verdict for a member that is doing exactly what its configuration says. Canon at HEAD
(`packs/claudinite-fleet-sheepdog/tasks/fleet-baseline/follow-to-current.mjs`):

```js
export const ALREADY_CURRENT = 'already-current';
export const CONVERGED = 'converged';
export const NEVER_STARTED = 'never-started';
export const DID_NOT_CONVERGE = 'did-not-converge';
export const UNKNOWN = 'unknown';
```

and the README's gloss on the one it lands in: *"its scheduler ran and it is still behind — go and
read that run"* — a false instruction here. Nothing in the whole task directory mentions a pull
request, review, or approval. A member with `dailyClaudiniteUpdatesRequirePrReview` set **can never
reach a success verdict inside the sweep's window**, by construction, and the sheepdog's own rules
say no sweep retries.

[Claudinite#1556](https://github.com/missingbulb/Claudinite/issues/1556) already names this
structural gap — *"What is missing is a third state"* — for a different cause (a member owing a
withheld workflow delivery). The review-gated member is a second, distinct instance of the same
missing state, and it is the one that actually fired twice this week. Filed as
[Claudinite#2011](https://github.com/missingbulb/Claudinite/issues/2011).

## Today's failure cluster, and a scope limit

Six `failure` parks are dated 2026-09-13, all within the morning sweep:

| | task |
|---|---|
| [ClaudiniteCanary#413](https://github.com/missingbulb/ClaudiniteCanary/issues/413) | `claudinite-tasks/usage-fold` |
| [VascularColoring#410](https://github.com/missingbulb/VascularColoring/issues/410) | `claudinite-tasks/usage-fold` |
| [ShoutsAndWhispers#437](https://github.com/missingbulb/ShoutsAndWhispers/issues/437) | `claudinite-tasks/usage-fold` |
| [ClaudiniteCanary#411](https://github.com/missingbulb/ClaudiniteCanary/issues/411) | `claudinite-lifecycle/update` |
| [VascularColoring#408](https://github.com/missingbulb/VascularColoring/issues/408) | `claudinite-lifecycle/update` |
| [hitbut#286](https://github.com/missingbulb/hitbut/issues/286) | *Claudinite scheduler run failed* (ad-hoc, park-labelled) |

Two members — ClaudiniteCanary and VascularColoring — failed **both** tasks in the same window,
which points at the member rather than at either task. Shepherd's own occurrences of the same two
tasks ([#579](https://github.com/missingbulb/Shepherd/issues/579),
[#582](https://github.com/missingbulb/Shepherd/issues/582)) are still `waiting-for-executor`, so
this repo has not yet reached the point where it would fail.

**I did not read these threads.** This session is scoped to Shepherd and Claudinite, and none of
the six is in either. Per the sampling rule, that means I am reporting the *shape* — six parks, one
morning, two tasks, two members carrying both — and **not** a cause. The three `usage-fold` items
are the same title in three repos, which is usually one condition; whether it is, is unread.
Naming it needs those repos attached.

## Cohort shape, four snapshots deep

The 09-05 snapshot is absent — its collector was down, which is what that run reported.

| | 09-02 | 09-08 | 09-10 | 09-13 |
|---|---|---|---|---|
| open issues | 349 | 410 | 393 | **417** |
| queue-managed | 133 | 184 | 167 | **177** |
| parked | 125 | 120 | 112 | **125** |
| `failure` | 36 | 29 | 21 | **16** |
| `action` | 24 | 14 | 14 | **14** |
| `decision` | 40 | 36 | 36 | **38** |
| `approval` | 25 | 41 | 41 | **57** |
| `blocked` | 3 | 46 | 43 | **33** |

Read down the columns:

- **`failure` is draining, steadily and mechanically** — 36 → 16 over eleven days, and the oldest
  surviving `failure` park in the fleet is **5 days old**. Rule I's 10-day bound has therefore
  never had to fire on anything currently open. Whatever is clearing them is clearing them fast.
- **`action` has not moved since 09-08.** Fourteen items, three snapshots, zero change. Twelve of
  the fourteen are ad-hoc, and rule E excludes ad-hoc origins outright, so twelve of them have no
  exit. That flatness is not stability, it is a floor.
- **`approval` is the growth**: +16 in three days, now 46% of all parks. Rule G can end an approval
  park when its `Ends-when:` target resolves — but the snapshot carries no issue bodies, so how
  many of the 57 even have the field is still unmeasurable from here. It has been unmeasurable for
  four runs.
- **`decision` is inert**, as it has been every run: 40 → 36 → 36 → 38, median age **14 days**,
  oldest 21. No rule touches it. The section above says where it comes from.

**52 of 125 parks (42%) have no mechanical exit whatsoever** — all 38 `decision`, plus 12 ad-hoc
`action`, plus 2 ad-hoc `failure`. On 09-02 the undrainable share was smaller and the total was the
same; the fleet has spent eleven days converting drainable parks into a constant.

## Who is parked: three tasks, half the fleet

| parks | task |
|---|---|
| 35 | *(ad-hoc / hand-filed, no lane)* |
| 30 | `claudinite-growth/rule-revalidation` |
| 24 | `claudinite-growth/prose-to-checks-sweep` |
| 11 | `claudinite-growth/growth-dedup` |
| 5 | `product-wiki/wiki-growth` |
| 5 | `shepherd/fleet-repo-digest-email` |

Three tasks in one pack are **65 of 125 parks, 52% of everything parked fleet-wide**. This is a
statement about `claudinite-growth`'s cadence, not about fourteen repos independently having a bad
week: each of those tasks asks a person to approve its output, runs again on schedule regardless,
and files a fresh park each time.

Lane duplication puts a number on the redundancy: **103 items sit on 57 distinct lanes; 23 lanes
carry more than one, and 46 items are the surplus.** The worst offenders are all the same trio —
TLDR/`rule-revalidation` at 5, EdFringeNow, GoogleCalendarEventCreator and VascularColoring at 4
each. Answering one question on a lane does not stop the next occurrence being filed behind it.

## Member liveness — done the way the last run learned to do it

Ranking members by the newest `updated_at` among *open* items is the trap the 09-10 run caught
itself in: a member that drains its queue looks dead, because the items it closed take their
timestamps out of the open set. The honest cut is closed **and** new **and** moved, 09-10 → 09-13:

| repo | closed | new | moved | open |
|---|---|---|---|---|
| Claudinite | 4 | 18 | 24 | 144 |
| ClaudiniteWebsite | 8 | 5 | 1 | 34 |
| Shepherd | 6 | 14 | 2 | 29 |
| VascularColoring | 6 | 3 | 0 | 12 |
| hitbut | 2 | 5 | 0 | 23 |
| ShoutsAndWhispers | 0 | 1 | 11 | 18 |
| MissingBulbWebsite | 2 | 3 | 0 | 22 |
| GoogleCalendarEventCreator | 2 | 3 | 0 | 34 |
| TLDR | 0 | 3 | 0 | 22 |
| CrosswordChat | 2 | 1 | 0 | 12 |
| ClaudiniteCanary | 1 | 2 | 1 | 16 |
| EdFringeNow | 1 | 2 | 1 | 21 |
| LaughCounter | **2** | 0 | 0 | 3 |
| **NoRFinder** | **0** | **0** | **0** | 9 |
| **WIP** | **0** | **0** | **0** | 18 |

**Two members are frozen: NoRFinder and WIP.** Zero closures, zero new items, zero movement over
three days, while every other member moved today. NoRFinder's nine open items include four
`failure` parks all stamped 2026-09-08T09:07 — one sweep, then nothing. WIP's newest open item is
09-07.

LaughCounter is the control that proves the cut: its newest *open* item is 09-06, a week stale,
which under the naive ranking reads as the deadest member in the fleet. It closed two items in this
window. It is draining, not dead — exactly the misread the 09-10 run corrected, reproduced here on
purpose.

Every other member's queue moved inside the 09-13 09:38–09:58 band, which is the per-member janitor
cron, not one sweep.

## `blocked` fell by ten, and it is still two people's plans

33 items, down from 43. As on 09-10 they are almost entirely `task:origin:ad-hoc` in two repos:
Claudinite's decomposed `claudinite-tasks` rewrite chain (R0–R5, H2, M1, M2, V1 — ten links, every
one stamped 09-13, sleeping behind each other exactly as `do-later` chains are meant to) and
ShoutsAndWhispers' dev-console chain. Sleeping by design, not stuck. The drop of ten is the chain
advancing, which is the mechanism working.

## Plain issues remain the blind half

240 plain issues, up from 226, and **193 of them carry no label at all** — up from 178 three days
ago. The unlabelled backlog is growing faster than anything else in this report, and every triage
in this series has had to say the same thing about it: it is the largest single population in the
fleet and the only one nothing can be said about, because the snapshot carries `number`, `title`,
`labels`, `created_at`, `updated_at` and `comments`, and no bodies.

The labelled remainder: 26 tidy trackers, 6 blocked, 4 quick-win, 4 `workflow-failure`, 3
needs-decision, 2 plan-tracking, 1 fleet-drift, 1 schedule-board.

Four `workflow-failure` issues stand open, in ClaudiniteWebsite (09-06), EdFringeNow (08-18) and
hitbut (today, and park-labelled). EdFringeNow's has stood for 26 days — and per the member
liveness cut above, EdFringeNow is *not* frozen, so that issue is stale rather than symptomatic.

## What is still open

Every item below is a recommendation. This skill assesses; the relabel, the close and the re-queue
are the owner's call.

1. **Tick the two boxes on [Shepherd#503](https://github.com/missingbulb/Shepherd/issues/503).**
   Two repository variables stop a park a morning. Five so far.
2. **Decide [Claudinite#2010](https://github.com/missingbulb/Claudinite/issues/2010)** — the
   executor leash's `decision` park. It is the generator of 38 inert items and eight dead
   production verifications, and #1515 already settled the principle for the other leash.
3. **The eight dead `Verify in production:` items** need a person, whatever is decided about the
   leash — nothing else will reach them.
4. **Decide [Claudinite#2011](https://github.com/missingbulb/Claudinite/issues/2011)** — the
   `fleet-baseline` verdict for a review-gated member, alongside
   [#1556](https://github.com/missingbulb/Claudinite/issues/1556)'s same-shaped gap.
5. **Read today's six-park cluster** (usage-fold ×3, lifecycle/update ×2, hitbut scheduler) — it
   needs ClaudiniteCanary, VascularColoring, ShoutsAndWhispers and hitbut attached to a session.
   Two members failing both tasks is the thread to pull.
6. **NoRFinder and WIP have not moved in three days.** Check whether their schedulers are running
   at all; every count reported for them describes a snapshot no rule has looked at.
7. **`claudinite-growth`'s three tasks are 52% of every park in the fleet.** Their cadence, not
   their output, is the thing to change.
8. **57 `approval` parks and no way to tell which can ever end.** Adding issue bodies to
   the snapshot would settle this, the `Ends-when:` question and the `Blocked-by:` chains in one
   change — asked for in every run of this series.
9. **[Claudinite#1910](https://github.com/missingbulb/Claudinite/issues/1910) and
   [#1891](https://github.com/missingbulb/Claudinite/issues/1891)** remain open from prior runs.
10. **193 unlabelled plain issues**, growing.

Closed since the last run, and worth recording: fleet convergence (14 of 14, via #552), the
"GoogleCalendarEventCreator is not converging" open item, and 17 parks including 14 `failure`
parks on growth lanes — a real drainage, and the first sign in this series that the `failure`
half of the vocabulary works as designed.


---

# Evidence — every open issue, repo by repo

417 open issues across 15 in-scope repos under `missingbulb` (snapshot generated 2026-09-13T16:03:57.156Z).
`Q` = queue-managed. `Gen` = label generation (canon `task:status:*` vs retired `needs-human`/`task:needs-human-*`).


## missingbulb/Claudinite — 144 open (52 queue / 92 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#1972](https://github.com/missingbulb/Claudinite/issues/1972) |  | unlabelled-backlog |  | 2026-09-13 | converge-item's `--pr` stamps a "waiting on a person" line onto a `done` that closes the item |
| [#1963](https://github.com/missingbulb/Claudinite/issues/1963) | Q | park:approval | canon | 2026-09-13 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#1962](https://github.com/missingbulb/Claudinite/issues/1962) | Q | park:approval | canon | 2026-09-13 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#1957](https://github.com/missingbulb/Claudinite/issues/1957) | Q | waiting-for-executor | canon | 2026-09-13 | [claudinite-work] claudinite-canon-curation/growth-promote |
| [#1956](https://github.com/missingbulb/Claudinite/issues/1956) | Q | park:approval | canon | 2026-09-13 | [claudinite-work] claudinite-canon-curation/growth-discover-packs |
| [#1945](https://github.com/missingbulb/Claudinite/issues/1945) |  | unlabelled-backlog |  | 2026-09-12 | Two module headers cite `docs/PRINCIPLES.md` twice in one parenthesis |
| [#1944](https://github.com/missingbulb/Claudinite/issues/1944) |  | unlabelled-backlog |  | 2026-09-12 | Should a later amend run's park end the earlier run's park on the same pull request? |
| [#1938](https://github.com/missingbulb/Claudinite/issues/1938) | Q | park:approval | canon | 2026-09-12 | [claudinite-work] claudinite-canon-curation/growth-promote |
| [#1927](https://github.com/missingbulb/Claudinite/issues/1927) |  | needs-decision |  | 2026-09-10 | Decision: the fleet page's wake strip has read *not read* since it shipped — pay for the read or drop the cell |
| [#1926](https://github.com/missingbulb/Claudinite/issues/1926) |  | unlabelled-backlog |  | 2026-09-10 | The Work board draws a row per PR and a row per item, not a lane per flow — `componentsOf` has no caller |
| [#1925](https://github.com/missingbulb/Claudinite/issues/1925) |  | unlabelled-backlog |  | 2026-09-10 | `taskCost` files 89% of sessions under `(unresolved)` — the `(none)` bucket is unreachable |
| [#1924](https://github.com/missingbulb/Claudinite/issues/1924) |  | unlabelled-backlog |  | 2026-09-10 | `humanSeconds` has read 0 every day since it shipped — a human turn's gap lands on an `attachment` entry |
| [#1914](https://github.com/missingbulb/Claudinite/issues/1914) |  | unlabelled-backlog |  | 2026-09-10 | Retire the executor secrets-bag reader once no member's workflow stamps one |
| [#1913](https://github.com/missingbulb/Claudinite/issues/1913) |  | unlabelled-backlog |  | 2026-09-10 | Retire the queue's `task:*` label decoders once no open item wears one |
| [#1912](https://github.com/missingbulb/Claudinite/issues/1912) |  | unlabelled-backlog |  | 2026-09-10 | Retire the integer version spelling — the canon's own migration records still declare it |
| [#1911](https://github.com/missingbulb/Claudinite/issues/1911) |  | unlabelled-backlog |  | 2026-09-10 | Retire the engine exports kept alive only by fielded pack imports |
| [#1910](https://github.com/missingbulb/Claudinite/issues/1910) |  | unlabelled-backlog |  | 2026-09-10 | The dashboard ranks `failure` parks `critical` on a lane hold the scheduler no longer performs |
| [#1909](https://github.com/missingbulb/Claudinite/issues/1909) | Q | blocked | canon | 2026-09-13 | Retire the `barriers` and `tidy-repo` pack id tolerances |
| [#1904](https://github.com/missingbulb/Claudinite/issues/1904) |  | unlabelled-backlog |  | 2026-09-09 | A forced wake ignores `taskScheduler.disabledTasks` and runs a task the repo turned off |
| [#1892](https://github.com/missingbulb/Claudinite/issues/1892) | Q | park:approval | canon | 2026-09-08 | [claudinite-work] claudinite-canon-curation/growth-promote |
| [#1891](https://github.com/missingbulb/Claudinite/issues/1891) |  | unlabelled-backlog |  | 2026-09-08 | Rule I's rationale cites a lane-hold that planSchedulerRun no longer performs |
| [#1885](https://github.com/missingbulb/Claudinite/issues/1885) |  | unlabelled-backlog |  | 2026-09-07 | Retrospective-lane review: the 0–3 / &gt;5 weekly filing bound reads a heavy-refactor week as overuse |
| [#1884](https://github.com/missingbulb/Claudinite/issues/1884) |  | unlabelled-backlog |  | 2026-09-07 | production-retrospective filing has no dedup guard — #1609 and #1624 duplicate the same subject |
| [#1881](https://github.com/missingbulb/Claudinite/issues/1881) | Q | blocked | canon | 2026-09-13 | Retrospective: the claudinite-tasks reorganization — roles, harness, principles, rewrites, measurement |
| [#1880](https://github.com/missingbulb/Claudinite/issues/1880) | Q | blocked | canon | 2026-09-13 | claudinite-tasks R5: rewrite src/recover/, src/adopt/ and the pack's own tasks to simplify, under frozen contracts and frozen tests |
| [#1879](https://github.com/missingbulb/Claudinite/issues/1879) | Q | blocked | canon | 2026-09-13 | claudinite-tasks R4: rewrite src/session/ and src/deliver/ to simplify, under frozen contracts and frozen tests |
| [#1878](https://github.com/missingbulb/Claudinite/issues/1878) | Q | blocked | canon | 2026-09-13 | claudinite-tasks R3: rewrite src/execute/ to simplify, under frozen contracts and frozen tests |
| [#1877](https://github.com/missingbulb/Claudinite/issues/1877) | Q | blocked | canon | 2026-09-13 | claudinite-tasks R2: rewrite src/schedule/ and src/signals/ to simplify, under frozen contracts and frozen tests |
| [#1876](https://github.com/missingbulb/Claudinite/issues/1876) | Q | blocked | canon | 2026-09-13 | claudinite-tasks R1: rewrite src/contract/ and src/items/ to simplify, under frozen contracts and frozen tests |
| [#1875](https://github.com/missingbulb/Claudinite/issues/1875) | Q | blocked | canon | 2026-09-13 | claudinite-tasks R0: pin every contract before the rewrites — ports, published exports, wire vocabulary, task names, workflow ABI |
| [#1874](https://github.com/missingbulb/Claudinite/issues/1874) | Q | blocked | canon | 2026-09-13 | claudinite-tasks M2: the dashboard's reliability and cost panel for the task machinery |
| [#1873](https://github.com/missingbulb/Claudinite/issues/1873) | Q | blocked | canon | 2026-09-13 | claudinite-tasks V1: this repo's scheduler and executor run green from the queue/ shims after the re-shelve |
| [#1872](https://github.com/missingbulb/Claudinite/issues/1872) | Q | blocked | canon | 2026-09-13 | claudinite-tasks M1: the machinery's own usage file — runs, billed minutes, spend, API calls, outcomes, parks, latencies |
| [#1871](https://github.com/missingbulb/Claudinite/issues/1871) | Q | blocked | canon | 2026-09-13 | claudinite-tasks H2: every scenario runs the real code through the fake world; sim.mjs keeps no model |
| [#1869](https://github.com/missingbulb/Claudinite/issues/1869) |  | unlabelled-backlog |  | 2026-09-07 | Reorganize claudinite-tasks: roles as folders, the simulator as the harness, principles as the spec |
| [#1868](https://github.com/missingbulb/Claudinite/issues/1868) |  | unlabelled-backlog |  | 2026-09-07 | dedup-prune-integrity misfires on any local-pack-confined branch whose commit message says "dedup" |
| [#1861](https://github.com/missingbulb/Claudinite/issues/1861) | Q | park:approval | canon | 2026-09-07 | [claudinite-work] claudinite-canon-curation/growth-promote |
| [#1849](https://github.com/missingbulb/Claudinite/issues/1849) |  | unlabelled-backlog |  | 2026-09-07 | `INCLUDE_DORMANT=true` is a no-op — the scheduler's dormancy gate runs before the forced wake |
| [#1847](https://github.com/missingbulb/Claudinite/issues/1847) |  | unlabelled-backlog |  | 2026-09-07 | claudinite-lifecycle/update's task.md narrates how its PR lands |
| [#1846](https://github.com/missingbulb/Claudinite/issues/1846) |  | unlabelled-backlog |  | 2026-09-07 | Retire the top-level `dormant` tolerance once the fleet has converged onto the pack-entry spelling |
| [#1837](https://github.com/missingbulb/Claudinite/issues/1837) |  | unlabelled-backlog |  | 2026-09-06 | The repo ledger counts a person's close of a park as "no outcome", and flags it bad |
| [#1823](https://github.com/missingbulb/Claudinite/issues/1823) |  | unlabelled-backlog |  | 2026-09-06 | forbidRemovedLinesMatching cannot see a deleted file, so updates-export-removed misses the worst case |
| [#1816](https://github.com/missingbulb/Claudinite/issues/1816) | Q | blocked | canon | 2026-09-06 | Retrospective: the claudinite-tasks pack boundary |
| [#1807](https://github.com/missingbulb/Claudinite/issues/1807) | Q | blocked | canon | 2026-09-06 | Retrospective: the stateless scheduler and the task trigger |
| [#1806](https://github.com/missingbulb/Claudinite/issues/1806) |  | unlabelled-backlog |  | 2026-09-06 | Check that a migration record's `version` is above its pack's current version |
| [#1789](https://github.com/missingbulb/Claudinite/issues/1789) | Q | blocked | canon | 2026-09-06 | Retire the trigger derivation: a task declaration must state its own `trigger` |
| [#1783](https://github.com/missingbulb/Claudinite/issues/1783) |  | unlabelled-backlog |  | 2026-09-06 | A pack migration record cannot name the version it lands at now that versions are cut on main |
| [#1759](https://github.com/missingbulb/Claudinite/issues/1759) |  | unlabelled-backlog |  | 2026-09-06 | merge-to-main's prompt trigger misses a lowercase "lgtm" |
| [#1749](https://github.com/missingbulb/Claudinite/issues/1749) |  | unlabelled-backlog |  | 2026-09-06 | Move .claudinite-settings.json into .claudinite/ |
| [#1732](https://github.com/missingbulb/Claudinite/issues/1732) | Q | blocked | canon | 2026-09-06 | Retire the frequency door: a task declaration states its cadence as a precondition term |
| [#1725](https://github.com/missingbulb/Claudinite/issues/1725) |  | unlabelled-backlog |  | 2026-09-06 | Scheduling as preconditions: retire `frequency` and the schedule board |
| [#1724](https://github.com/missingbulb/Claudinite/issues/1724) | Q | blocked | canon | 2026-09-05 | Retrospective: the local-pack consolidation and the three packs it promoted |
| [#1720](https://github.com/missingbulb/Claudinite/issues/1720) |  | unlabelled-backlog |  | 2026-09-05 | A merge resolution can silently delete a VERSIONS.md row, and nothing catches it |
| [#1716](https://github.com/missingbulb/Claudinite/issues/1716) | Q | park:decision | canon | 2026-09-07 | Verify in production: the executor amends or supersedes a task's open pull request |
| [#1710](https://github.com/missingbulb/Claudinite/issues/1710) |  | unlabelled-backlog |  | 2026-09-04 | Waking verify-production mints a standing item that can only park |
| [#1704](https://github.com/missingbulb/Claudinite/issues/1704) |  | unlabelled-backlog |  | 2026-09-04 | guardToolCalls needs a session-context predicate — guard a tool in trigger-fired sessions only |
| [#1703](https://github.com/missingbulb/Claudinite/issues/1703) | Q | running-executor | canon | 2026-09-13 | Retrospective: the four-moment declared-check mechanism |
| [#1698](https://github.com/missingbulb/Claudinite/issues/1698) | Q | park:approval | canon | 2026-09-12 | Retire the target hand-off tolerances: the update worker's own disposal and the generated lane's prefix discovery |
| [#1683](https://github.com/missingbulb/Claudinite/issues/1683) | Q | blocked | canon | 2026-09-13 | Retrospective: barriers folded into basics |
| [#1682](https://github.com/missingbulb/Claudinite/issues/1682) | Q | park:failure | canon | 2026-09-12 | Retire the barrier check's legacy read of packConfig.barriers |
| [#1678](https://github.com/missingbulb/Claudinite/issues/1678) |  | unlabelled-backlog |  | 2026-09-04 | Three defects bootstrap.md's fast path hit on a fresh adoption (codeload 403, retired endpoints key, a "rebuild" step that doesn't exist) |
| [#1672](https://github.com/missingbulb/Claudinite/issues/1672) |  | unlabelled-backlog |  | 2026-09-04 | Declarative checks: categorize every corpus rule, and design the mechanism additions (two-pass derive→assert, declarative work/action scope, deterministic skill triggers) |
| [#1670](https://github.com/missingbulb/Claudinite/issues/1670) |  | unlabelled-backlog |  | 2026-09-03 | The executor cannot read CLAUDINITE_TASKS_SUSPEND_ALL live (403), so a mid-run hold never reaches a running drain |
| [#1669](https://github.com/missingbulb/Claudinite/issues/1669) |  | unlabelled-backlog |  | 2026-09-03 | Update apply-stage agents park on an `action_required` conformance run instead of dispatching it on the head sha |
| [#1668](https://github.com/missingbulb/Claudinite/issues/1668) |  | unlabelled-backlog |  | 2026-09-03 | Path-scoped skill guard reads the parent transcript, so a subagent's skill loads never count |
| [#1644](https://github.com/missingbulb/Claudinite/issues/1644) |  | unlabelled-backlog |  | 2026-09-03 | Three packs' RULES.md are manuals: research-project, spec-driven-product, executable-requirements |
| [#1643](https://github.com/missingbulb/Claudinite/issues/1643) | Q | park:approval | canon | 2026-09-10 | Retire the remaining scattered legacy residues |
| [#1642](https://github.com/missingbulb/Claudinite/issues/1642) | Q | park:approval | canon | 2026-09-10 | Retire the task contract and queue vocabulary legacy tolerances |
| [#1641](https://github.com/missingbulb/Claudinite/issues/1641) | Q | park:approval | canon | 2026-09-10 | Retire the renamed and absorbed pack id tolerances |
| [#1640](https://github.com/missingbulb/Claudinite/issues/1640) | Q | park:approval | canon | 2026-09-10 | Retire the member declaration and stamp legacy shapes |
| [#1638](https://github.com/missingbulb/Claudinite/issues/1638) |  | unlabelled-backlog |  | 2026-09-12 | Retire Claudinite's live legacy tolerances |
| [#1633](https://github.com/missingbulb/Claudinite/issues/1633) |  | unlabelled-backlog |  | 2026-09-03 | Task declarations move from task.mjs to task.json |
| [#1617](https://github.com/missingbulb/Claudinite/issues/1617) |  | unlabelled-backlog |  | 2026-09-04 | Retire the legacy precondition() function form — one mechanism, engine cleaned |
| [#1609](https://github.com/missingbulb/Claudinite/issues/1609) | Q | park:decision | canon | 2026-09-10 | Retrospective: the dashboard redesign, a week in production |
| [#1603](https://github.com/missingbulb/Claudinite/issues/1603) |  | unlabelled-backlog |  | 2026-09-02 | Dashboard redesign phase 1: the usage fold's new counters |
| [#1602](https://github.com/missingbulb/Claudinite/issues/1602) |  | plan-tracking |  | 2026-09-02 | Dashboard redesign: the fleet ledger, the repo page and the Work board |
| [#1589](https://github.com/missingbulb/Claudinite/issues/1589) |  | unlabelled-backlog |  | 2026-09-02 | A second push to an agent-opened PR gets no CI, and nothing says so |
| [#1580](https://github.com/missingbulb/Claudinite/issues/1580) |  | unlabelled-backlog |  | 2026-09-01 | Retrospective: the declarative preconditions in production |
| [#1579](https://github.com/missingbulb/Claudinite/issues/1579) | Q | park:decision | canon | 2026-09-09 | Validate the preconditions system live |
| [#1572](https://github.com/missingbulb/Claudinite/issues/1572) |  | unlabelled-backlog |  | 2026-09-09 | Declarative task preconditions + the repo-active silence gate |
| [#1570](https://github.com/missingbulb/Claudinite/issues/1570) | Q | park:action | canon | 2026-09-01 | [claudinite-work] claudinite-canon-curation/upstream-watch |
| [#1556](https://github.com/missingbulb/Claudinite/issues/1556) |  | unlabelled-backlog |  | 2026-09-06 | A member owing a withheld delivery reads as "behind", so a fleet baseline reports it as failed |
| [#1555](https://github.com/missingbulb/Claudinite/issues/1555) |  | unlabelled-backlog |  | 2026-09-01 | The staging sweep deletes on "I didn't write it this pass", which is not the same as "it was delivered" |
| [#1550](https://github.com/missingbulb/Claudinite/issues/1550) |  | unlabelled-backlog |  | 2026-09-06 | Self-test gate passes a `--root` flag `selftest.mjs` never parses |
| [#1547](https://github.com/missingbulb/Claudinite/issues/1547) |  | unlabelled-backlog |  | 2026-09-02 | Reconsider the update flow from requirements, not from the existing structure |
| [#1538](https://github.com/missingbulb/Claudinite/issues/1538) |  | unlabelled-backlog |  | 2026-08-31 | The four park kinds conflate two independent questions, and `decision` absorbs the overflow |
| [#1517](https://github.com/missingbulb/Claudinite/issues/1517) | Q | park:action | canon | 2026-09-01 | Verify in production: the re-opened withhold lane converges members without regression |
| [#1495](https://github.com/missingbulb/Claudinite/issues/1495) | Q | park:action | canon | 2026-09-01 | Verify in production: an agentic session converges its own item instead of parking |
| [#1485](https://github.com/missingbulb/Claudinite/issues/1485) |  | unlabelled-backlog |  | 2026-09-06 | task-declaration-shape passes an unresolvable `automerge` policy, and the task then silently stops being scheduled |
| [#1478](https://github.com/missingbulb/Claudinite/issues/1478) | Q | park:approval | canon | 2026-09-07 | Re-shelve claudinite-tasks by stage: src/ for the code, queue/ frozen as workflow ABI |
| [#1469](https://github.com/missingbulb/Claudinite/issues/1469) | Q | park:action | canon | 2026-08-31 | Verify in production: rename-stranded parks close, and their task starts running again |
| [#1458](https://github.com/missingbulb/Claudinite/issues/1458) | Q | park:decision | canon | 2026-09-02 | Verify in production: a retry re-arms Not-before to a future instant |
| [#1455](https://github.com/missingbulb/Claudinite/issues/1455) | Q | park:decision | canon | 2026-09-01 | Verify in production: a member's executor still starts on the single ready trigger |
| [#1428](https://github.com/missingbulb/Claudinite/issues/1428) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#1399](https://github.com/missingbulb/Claudinite/issues/1399) |  | unlabelled-backlog |  | 2026-09-06 | The update flow labels its PR with the retired bare `needs-human` |
| [#1388](https://github.com/missingbulb/Claudinite/issues/1388) |  | unlabelled-backlog |  | 2026-08-27 | Verify in production: fleet-usage task retired reaches Shepherd |
| [#1382](https://github.com/missingbulb/Claudinite/issues/1382) |  | unlabelled-backlog |  | 2026-09-06 | Retire the deleted slot scheduler's leftovers — its labels, its session-side resolver, its janitor rules |
| [#1353](https://github.com/missingbulb/Claudinite/issues/1353) | Q | park:action | canon | 2026-08-31 | Delete the updates/ shims, once no member's vendored worker names them |
| [#1347](https://github.com/missingbulb/Claudinite/issues/1347) | Q | blocked | canon | 2026-09-13 | Merge the dispatch simulator into the scheduler codebase — the sim becomes a test harness |
| [#1346](https://github.com/missingbulb/Claudinite/issues/1346) | Q | blocked | none | 2026-09-13 | Move taskScheduler from a top-level settings key into the claudinite-tasks pack's own config |
| [#1341](https://github.com/missingbulb/Claudinite/issues/1341) |  | unlabelled-backlog |  | 2026-08-24 | Eliminate the task-janitor: fold its recovery into the scheduler run, its visibility into the dashboard |
| [#1333](https://github.com/missingbulb/Claudinite/issues/1333) |  | unlabelled-backlog |  | 2026-09-06 | claudinite-canary-repo: the withhold lane it probes no longer exists |
| [#1317](https://github.com/missingbulb/Claudinite/issues/1317) |  | unlabelled-backlog |  | 2026-09-06 | Extract the task execution/scheduling surface into a claudinite-tasks pack |
| [#1313](https://github.com/missingbulb/Claudinite/issues/1313) |  | unlabelled-backlog |  | 2026-09-06 | Gate packs/* against .claudinite/local in the barriers config |
| [#1295](https://github.com/missingbulb/Claudinite/issues/1295) |  | unlabelled-backlog |  | 2026-09-06 | A member whose Actions jobs cannot start has no escalation path — report-failure dies with everything else |
| [#1275](https://github.com/missingbulb/Claudinite/issues/1275) | Q | park:approval | retired | 2026-08-23 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#1274](https://github.com/missingbulb/Claudinite/issues/1274) | Q | park:approval | retired | 2026-08-23 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#1264](https://github.com/missingbulb/Claudinite/issues/1264) |  | unlabelled-backlog |  | 2026-09-06 | Delete the two-name settings-file tolerance once no member carries .claudinite-checks.json |
| [#1237](https://github.com/missingbulb/Claudinite/issues/1237) | Q | blocked | none | 2026-09-13 | Chain 3/3: retire the twice-daily-cron migration tolerances |
| [#1236](https://github.com/missingbulb/Claudinite/issues/1236) | Q | park:action | canon | 2026-09-06 | Chain 2/3: verify the twice-daily cron in production — 2 scheduler runs a day, not 24 |
| [#1224](https://github.com/missingbulb/Claudinite/issues/1224) |  | unlabelled-backlog |  | 2026-09-06 | Eliminate avoidable GitHub-platform assumptions from packs |
| [#1214](https://github.com/missingbulb/Claudinite/issues/1214) |  | unlabelled-backlog |  | 2026-09-06 | Engine: executor drains until empty; scheduler drain job dispatches only when work is pickable |
| [#1174](https://github.com/missingbulb/Claudinite/issues/1174) |  | unlabelled-backlog |  | 2026-09-06 | fleet-baseline can only force `update` — there is no lever for any other task fleet-wide |
| [#1169](https://github.com/missingbulb/Claudinite/issues/1169) | Q | park:approval | canon | 2026-09-06 | Dissolve docs/skill-usage-metrics/DESIGN.md into the packs that own its subjects |
| [#1160](https://github.com/missingbulb/Claudinite/issues/1160) | Q | park:decision | canon | 2026-08-31 | Verify in production: an extension repo still ships to the store now the pipeline never bumps |
| [#1137](https://github.com/missingbulb/Claudinite/issues/1137) |  | unlabelled-backlog |  | 2026-09-06 | Verify in production: the next real adoption is fast, measured from its captured bootstrap log |
| [#1113](https://github.com/missingbulb/Claudinite/issues/1113) |  | unlabelled-backlog |  | 2026-09-06 | Verify in production: members re-stamp with date-anchored versions |
| [#1112](https://github.com/missingbulb/Claudinite/issues/1112) |  | unlabelled-backlog |  | 2026-09-06 | Verify in production: a member's un-converged workflow still starts a scheduler run through the `tick.mjs` shim |
| [#1106](https://github.com/missingbulb/Claudinite/issues/1106) |  | unlabelled-backlog |  | 2026-08-20 | Remove the legacy single-integer version tolerance |
| [#1096](https://github.com/missingbulb/Claudinite/issues/1096) |  | unlabelled-backlog |  | 2026-09-06 | Every executor run logs `could not reconcile label "claude-automerge": 404` |
| [#1078](https://github.com/missingbulb/Claudinite/issues/1078) |  | unlabelled-backlog |  | 2026-08-19 | Human-only: trace the request mode refusing an unauthorized mark, live |
| [#1073](https://github.com/missingbulb/Claudinite/issues/1073) |  | unlabelled-backlog |  | 2026-09-06 | Move the Chrome Web Store release pipeline into Claudinite tasks |
| [#1072](https://github.com/missingbulb/Claudinite/issues/1072) |  | unlabelled-backlog |  | 2026-09-06 | Production code must not reference its tests — land it as a check |
| [#1050](https://github.com/missingbulb/Claudinite/issues/1050) |  | unlabelled-backlog |  | 2026-09-06 | Collapse the `needs-human` pair into one label — by 2026-08-26 |
| [#1010](https://github.com/missingbulb/Claudinite/issues/1010) |  | unlabelled-backlog |  | 2026-09-06 | Ad-hoc tasks: let the owner mark an issue for Claude to implement |
| [#1003](https://github.com/missingbulb/Claudinite/issues/1003) |  | unlabelled-backlog |  | 2026-08-18 | Manual: register this fleet owner's GitHub App and deploy its token exchange |
| [#996](https://github.com/missingbulb/Claudinite/issues/996) |  | unlabelled-backlog |  | 2026-09-06 | dashboard: sign-in is the only route to a usable rate limit — wire it for the fleet deployment |
| [#991](https://github.com/missingbulb/Claudinite/issues/991) |  | unlabelled-backlog |  | 2026-08-18 | Promote conformance-work-scope to blocking once the fleet carries the step |
| [#952](https://github.com/missingbulb/Claudinite/issues/952) |  | unlabelled-backlog |  | 2026-09-06 | bootstrap.md Part 9 names a vendored path that cannot exist |
| [#926](https://github.com/missingbulb/Claudinite/issues/926) |  | unlabelled-backlog |  | 2026-09-06 | The declarative vocabulary has never reached a member's local pack — fleet census, and the one key that is missing |
| [#923](https://github.com/missingbulb/Claudinite/issues/923) |  | unlabelled-backlog |  | 2026-09-06 | Fold the last comment-stripper twin into `stripComments` with a `preserveOffsets` option |
| [#920](https://github.com/missingbulb/Claudinite/issues/920) |  | unlabelled-backlog |  | 2026-09-06 | sharedMount's path regex is mount-only, so the signal is dead in the canon home |
| [#841](https://github.com/missingbulb/Claudinite/issues/841) |  | unlabelled-backlog |  | 2026-08-14 | pack.json migration plan: engine reader + canon conversion, then a versioned fleet migration |
| [#840](https://github.com/missingbulb/Claudinite/issues/840) |  | unlabelled-backlog |  | 2026-09-06 | Engine-driven format changes to consumer-held files need a first-class migration class |
| [#766](https://github.com/missingbulb/Claudinite/issues/766) |  | unlabelled-backlog |  | 2026-09-06 | Wrap the remaining 17 RULES.md files to the 100-byte line limit |
| [#748](https://github.com/missingbulb/Claudinite/issues/748) |  | unlabelled-backlog |  | 2026-09-06 | conformance-backlog: committed-build-artifact check (promote cannot land a check — fixtures sit outside its write surface) |
| [#722](https://github.com/missingbulb/Claudinite/issues/722) |  | unlabelled-backlog |  | 2026-09-06 | Align the website repos' release flows on one github-pages-serving standard |
| [#590](https://github.com/missingbulb/Claudinite/issues/590) |  | unlabelled-backlog |  | 2026-09-06 | Adoption never sets the two repo settings baselining depends on — add them to bootstrap (both are scriptable) |
| [#498](https://github.com/missingbulb/Claudinite/issues/498) |  | unlabelled-backlog |  | 2026-09-06 | scheduler-workflow-shape should validate the scopes a repo's tasks actually need, not a fixed two |
| [#409](https://github.com/missingbulb/Claudinite/issues/409) |  | plan-tracking |  | 2026-07-30 | Tracking-issue freshness: keep the plan issue in sync after every merge |
| [#334](https://github.com/missingbulb/Claudinite/issues/334) |  | unlabelled-backlog |  | 2026-09-06 | DESIGN.md trade-offs: delivery mode is now a security knob; name the vendored mount's supply-chain improvement |
| [#239](https://github.com/missingbulb/Claudinite/issues/239) |  | unlabelled-backlog |  | 2026-09-07 | Follow-up: wire existing legacy tolerances to the migration resolver |
| [#230](https://github.com/missingbulb/Claudinite/issues/230) |  | unlabelled-backlog |  | 2026-09-06 | Workflows pin Node 20, now deprecated on Actions runners (forced to Node 24) |
| [#223](https://github.com/missingbulb/Claudinite/issues/223) |  | unlabelled-backlog |  | 2026-09-07 | Conformance-backlog: check for chrome-extension:// in API Gateway v2 CORS AllowOrigins |

## missingbulb/ClaudiniteWebsite — 34 open (15 queue / 19 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#526](https://github.com/missingbulb/ClaudiniteWebsite/issues/526) | Q | waiting-for-executor | canon | 2026-09-13 | [claudinite-work] claudinite-growth/logs-prune |
| [#525](https://github.com/missingbulb/ClaudiniteWebsite/issues/525) |  | unlabelled-backlog |  | 2026-09-13 | Adopt canon pack: cloudflare-pages |
| [#524](https://github.com/missingbulb/ClaudiniteWebsite/issues/524) | Q | blocked | canon | 2026-09-13 | Retrospective: the site-release task as claudinite.com's only path to production |
| [#509](https://github.com/missingbulb/ClaudiniteWebsite/issues/509) | Q | park:approval | canon | 2026-09-13 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#496](https://github.com/missingbulb/ClaudiniteWebsite/issues/496) | Q | park:approval | canon | 2026-09-11 | [claudinite-work] claudinite-growth/growth-dedup |
| [#437](https://github.com/missingbulb/ClaudiniteWebsite/issues/437) | Q | park:action | canon | 2026-09-06 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#376](https://github.com/missingbulb/ClaudiniteWebsite/issues/376) |  | unlabelled-backlog |  | 2026-08-30 | The site's release pipeline is a hand-rolled copy of the static-website standard, on its retired version scheme |
| [#366](https://github.com/missingbulb/ClaudiniteWebsite/issues/366) |  | blocked |  | 2026-09-07 | Canon patch (blocked on push scope): dedup-prune-integrity false-positives on VERSIONS.md growth |
| [#356](https://github.com/missingbulb/ClaudiniteWebsite/issues/356) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] product-wiki/wiki-growth |
| [#351](https://github.com/missingbulb/ClaudiniteWebsite/issues/351) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#348](https://github.com/missingbulb/ClaudiniteWebsite/issues/348) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/growth-dedup |
| [#325](https://github.com/missingbulb/ClaudiniteWebsite/issues/325) | Q | park:action | canon | 2026-08-31 | Verify https://claudinite.com/ serves the live site, not a GitHub Pages error |
| [#316](https://github.com/missingbulb/ClaudiniteWebsite/issues/316) |  | blocked |  | 2026-09-07 | Canon patch (blocked on push scope): dedup-prune-integrity flags the VERSIONS.md row growth-dedup's own task doc mandates |
| [#308](https://github.com/missingbulb/ClaudiniteWebsite/issues/308) | Q | park:decision | retired | 2026-08-26 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#288](https://github.com/missingbulb/ClaudiniteWebsite/issues/288) | Q | park:decision | retired | 2026-08-26 | Verify in production: the desk-scene hero |
| [#285](https://github.com/missingbulb/ClaudiniteWebsite/issues/285) | Q | park:decision | retired | 2026-08-26 | Verify in production: the redesigned site with the compounding chart |
| [#282](https://github.com/missingbulb/ClaudiniteWebsite/issues/282) |  | unlabelled-backlog |  | 2026-08-23 | site/README.md links a renamed file: .claudinite-checks.json → .claudinite-settings.json |
| [#277](https://github.com/missingbulb/ClaudiniteWebsite/issues/277) |  | unlabelled-backlog |  | 2026-08-23 | converge-item.mjs can't run from a routine-fired Claude Code Web session (MCP-only GitHub access) |
| [#274](https://github.com/missingbulb/ClaudiniteWebsite/issues/274) |  | unlabelled-backlog |  | 2026-08-23 | Canon defect: converge-item.mjs cannot run session-side — this session type has no direct GitHub API access |
| [#270](https://github.com/missingbulb/ClaudiniteWebsite/issues/270) |  | tidy-tracker |  | 2026-08-23 | Claudinite tracker: Product Wiki Growth |
| [#255](https://github.com/missingbulb/ClaudiniteWebsite/issues/255) | Q | park:decision | retired | 2026-09-06 | Verify in production: reframed site live at claudinite.com |
| [#244](https://github.com/missingbulb/ClaudiniteWebsite/issues/244) | Q | park:decision | retired | 2026-08-24 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#204](https://github.com/missingbulb/ClaudiniteWebsite/issues/204) |  | workflow-failure |  | 2026-09-06 | Claudinite scheduler run failed |
| [#192](https://github.com/missingbulb/ClaudiniteWebsite/issues/192) |  | unlabelled-backlog |  | 2026-09-06 | Vendored queue engine: invoke.mjs points at a missing instructions.md (and prose-to-checks skill's DESIGN.md link is also dead) |
| [#185](https://github.com/missingbulb/ClaudiniteWebsite/issues/185) | Q | waiting-for-executor | canon | 2026-09-13 | Add packs: suspected from this repo’s shape |
| [#77](https://github.com/missingbulb/ClaudiniteWebsite/issues/77) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Tidy Branches |
| [#62](https://github.com/missingbulb/ClaudiniteWebsite/issues/62) |  | unlabelled-backlog |  | 2026-09-06 | One-time GitHub settings for the static-site release pipeline |
| [#60](https://github.com/missingbulb/ClaudiniteWebsite/issues/60) |  | unlabelled-backlog |  | 2026-09-06 | Adopt the static-website pack — replace the hand-rolled deploy and version bump |
| [#59](https://github.com/missingbulb/ClaudiniteWebsite/issues/59) |  | unlabelled-backlog |  | 2026-09-06 | Canon patch (blocked on push scope): executor-routine fixes for #53–#57 |
| [#57](https://github.com/missingbulb/ClaudiniteWebsite/issues/57) |  | unlabelled-backlog |  | 2026-09-06 | comment-classification fires on routine triggers, which are not owner comments |
| [#55](https://github.com/missingbulb/ClaudiniteWebsite/issues/55) |  | unlabelled-backlog |  | 2026-09-06 | task-lifecycle's remedy tells the agent to amend an already-pushed commit |
| [#54](https://github.com/missingbulb/ClaudiniteWebsite/issues/54) |  | unlabelled-backlog |  | 2026-09-06 | resolve-dispatch exit 13 renders as a failed command when it is the normal handshake |
| [#53](https://github.com/missingbulb/ClaudiniteWebsite/issues/53) |  | unlabelled-backlog |  | 2026-09-06 | task-lifecycle fires on the scheduler's maintenance branch, which can never satisfy it |
| [#44](https://github.com/missingbulb/ClaudiniteWebsite/issues/44) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Product Wiki Growth |

## missingbulb/GoogleCalendarEventCreator — 34 open (13 queue / 21 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#1224](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1224) | Q | park:approval | canon | 2026-09-13 | [claudinite-work] product-wiki/wiki-growth |
| [#1220](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1220) | Q | park:approval | canon | 2026-09-13 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#1219](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1219) | Q | park:approval | canon | 2026-09-13 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#1188](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1188) | Q | park:approval | canon | 2026-09-07 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#1133](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1133) | Q | park:action | canon | 2026-09-02 | Align local pack rules and skills to the writing-pack-prose references convention |
| [#1129](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1129) | Q | park:approval | canon | 2026-09-01 | [claudinite-work] gcec/create-extractor |
| [#1118](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1118) |  | unlabelled-backlog |  | 2026-09-01 | Event source request - www.tzavta.co.il |
| [#1103](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1103) |  | unlabelled-backlog |  | 2026-08-30 | Chrome Web Store release pipeline is a generation behind the chrome-extension pack |
| [#1092](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1092) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] product-wiki/wiki-growth |
| [#1089](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1089) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#1088](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1088) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#1085](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1085) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] basics/ci-performance |
| [#1066](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1066) | Q | park:decision | retired | 2026-08-26 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#1041](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1041) |  | unlabelled-backlog |  | 2026-08-25 | prose-to-checks conversion backlog: gcec pack |
| [#980](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/980) | Q | park:decision | retired | 2026-08-24 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#939](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/939) |  | tidy-tracker |  | 2026-08-18 | Claudinite tracker: Tidy Issues |
| [#829](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/829) |  | tidy-tracker |  | 2026-08-23 | Claudinite tracker: Tidy Branches |
| [#826](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/826) |  | tidy-tracker |  | 2026-08-23 | Claudinite tracker: Tidy PRs |
| [#749](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/749) |  | unlabelled-backlog |  | 2026-09-06 | product-requirements/README.md cites dev/procedures/technicalGotchas.md, which no longer exists |
| [#748](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/748) | Q | bare-needs-human | retired | 2026-08-15 | Scheduler appears to be firing multiple concurrent executor sessions against the same dispatch issues |
| [#744](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/744) |  | unlabelled-backlog |  | 2026-09-06 | Untracked .claude/worktrees/ dirs trip the Stop hook's untracked-files check |
| [#727](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/727) |  | unlabelled-backlog |  | 2026-09-06 | .gitignore misses the Agent tool's isolated-worktree scratch dir |
| [#724](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/724) |  | unlabelled-backlog |  | 2026-09-06 | Untracked .claude/worktrees/ noise from worktree-isolated background agents |
| [#699](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/699) |  | unlabelled-backlog |  | 2026-09-06 | Re-paste the Claudinite environment Setup script |
| [#692](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/692) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Product Wiki Growth |
| [#679](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/679) |  | unlabelled-backlog |  | 2026-09-06 | Proof of concept: move local capture into Claudinite local packs (.claudinite/local_packs/) |
| [#648](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/648) |  | unlabelled-backlog |  | 2026-09-06 | Add a Claudinite conformance-checks job to CI (backstop for the Stop hook) |
| [#617](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/617) |  | unlabelled-backlog |  | 2026-09-06 | Generate the project's working-instructions doc per Claudinite's generator prompt |
| [#616](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/616) |  | unlabelled-backlog |  | 2026-09-06 | Generate the project's working-instructions doc (category: Chrome MV3 extension) |
| [#592](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/592) |  | unlabelled-backlog |  | 2026-09-06 | Superseded local instructions (optimize-procedures) |
| [#438](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/438) |  | unlabelled-backlog |  | 2026-09-06 | Add a periodic "edge-case review" routine for the UI requirements |
| [#435](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/435) |  | unlabelled-backlog |  | 2026-09-06 | Faithfully verify the behavioral UI leaves (events-view-actions stubs the boundary) |
| [#430](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/430) |  | unlabelled-backlog |  | 2026-09-06 | Add a daily automated UI-test improvement routine (with its own doc + tracking issue) |
| [#366](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/366) |  | unlabelled-backlog |  | 2026-08-09 | 🤖 Auto-Improvements Tracker - Fallback Extractor Coverage |

## missingbulb/Shepherd — 29 open (20 queue / 9 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#582](https://github.com/missingbulb/Shepherd/issues/582) | Q | waiting-for-executor | canon | 2026-09-13 | [claudinite-work] claudinite-lifecycle/update |
| [#581](https://github.com/missingbulb/Shepherd/issues/581) | Q | waiting-for-executor | canon | 2026-09-13 | [claudinite-work] shepherd/fleet-repo-digest-email |
| [#580](https://github.com/missingbulb/Shepherd/issues/580) | Q | running-executor | canon | 2026-09-13 | [claudinite-work] shepherd/fleet-issues-snapshot |
| [#579](https://github.com/missingbulb/Shepherd/issues/579) | Q | waiting-for-executor | canon | 2026-09-13 | [claudinite-work] claudinite-tasks/usage-fold |
| [#578](https://github.com/missingbulb/Shepherd/issues/578) | Q | waiting-for-executor | canon | 2026-09-13 | [claudinite-work] claudinite-tasks/task-janitor |
| [#576](https://github.com/missingbulb/Shepherd/issues/576) | Q | waiting-for-executor | canon | 2026-09-13 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#575](https://github.com/missingbulb/Shepherd/issues/575) | Q | waiting-for-executor | canon | 2026-09-13 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#573](https://github.com/missingbulb/Shepherd/issues/573) | Q | running-agent | canon | 2026-09-13 | [claudinite-work] claudinite-growth/growth-dedup |
| [#571](https://github.com/missingbulb/Shepherd/issues/571) | Q | waiting-for-executor | canon | 2026-09-13 | [claudinite-work] claudinite-fleet-sheepdog/fleet-pack-seeds |
| [#569](https://github.com/missingbulb/Shepherd/issues/569) | Q | waiting-for-executor | canon | 2026-09-13 | [claudinite-work] basics/ci-performance |
| [#566](https://github.com/missingbulb/Shepherd/issues/566) | Q | park:failure | canon | 2026-09-12 | [claudinite-work] shepherd/fleet-repo-digest-email |
| [#548](https://github.com/missingbulb/Shepherd/issues/548) | Q | park:failure | canon | 2026-09-11 | [claudinite-work] shepherd/fleet-repo-digest-email |
| [#540](https://github.com/missingbulb/Shepherd/issues/540) |  | unlabelled-backlog |  | 2026-09-10 | Dashboard sign-in: no way to measure button use vs. token-box use |
| [#536](https://github.com/missingbulb/Shepherd/issues/536) | Q | park:failure | canon | 2026-09-10 | [claudinite-work] shepherd/fleet-repo-digest-email |
| [#526](https://github.com/missingbulb/Shepherd/issues/526) | Q | park:failure | canon | 2026-09-09 | [claudinite-work] shepherd/fleet-repo-digest-email |
| [#514](https://github.com/missingbulb/Shepherd/issues/514) | Q | park:failure | canon | 2026-09-08 | [claudinite-work] shepherd/fleet-repo-digest-email |
| [#505](https://github.com/missingbulb/Shepherd/issues/505) | Q | park:decision | canon | 2026-09-13 | Verify in production: the morning fleet digest actually sends |
| [#503](https://github.com/missingbulb/Shepherd/issues/503) |  | unlabelled-backlog |  | 2026-09-07 | Hand-over: the Cloudflare setup the morning fleet digest needs |
| [#480](https://github.com/missingbulb/Shepherd/issues/480) |  | unlabelled-backlog |  | 2026-09-06 | Delete the retired tidy-issues label definitions across the fleet |
| [#420](https://github.com/missingbulb/Shepherd/issues/420) |  | unlabelled-backlog |  | 2026-09-02 | Fleet triage 2026-09-02: 53% of parks sit in a kind no rule can drain |
| [#396](https://github.com/missingbulb/Shepherd/issues/396) | Q | park:action | canon | 2026-09-02 | Align local pack rules and skills to the writing-pack-prose references convention |
| [#395](https://github.com/missingbulb/Shepherd/issues/395) |  | unlabelled-backlog |  | 2026-09-01 | Fleet: file ad-hoc tasks to align every member's local packs to the writing-pack-prose convention |
| [#352](https://github.com/missingbulb/Shepherd/issues/352) |  | unlabelled-backlog |  | 2026-09-10 | Turn dashboard sign-in on: register the GitHub App, then run deploy-oauth-exchange |
| [#333](https://github.com/missingbulb/Shepherd/issues/333) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#332](https://github.com/missingbulb/Shepherd/issues/332) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#212](https://github.com/missingbulb/Shepherd/issues/212) | Q | park:approval | retired | 2026-08-23 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#169](https://github.com/missingbulb/Shepherd/issues/169) |  | fleet-drift |  | 2026-09-07 | Claudinite mount has fallen behind on missingbulb/vascularcoloring |
| [#137](https://github.com/missingbulb/Shepherd/issues/137) |  | unlabelled-backlog |  | 2026-09-06 | The dashboard's morning-brief panel is off, on the repo that writes the briefs |
| [#3](https://github.com/missingbulb/Shepherd/issues/3) |  | unlabelled-backlog |  | 2026-08-19 | Claudinite adoption: the setup steps only a human can do |

## missingbulb/hitbut — 23 open (8 queue / 15 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#291](https://github.com/missingbulb/hitbut/issues/291) |  | unlabelled-backlog |  | 2026-09-13 | Adopt canon pack: cloudflare-pages |
| [#289](https://github.com/missingbulb/hitbut/issues/289) |  | unlabelled-backlog |  | 2026-09-13 | A local-pack task can never be woken: taskIdFromPath does not accept .claudinite/local/packs/ |
| [#287](https://github.com/missingbulb/hitbut/issues/287) |  | unlabelled-backlog |  | 2026-09-13 | The console cannot tell an empty registry from a crawler that stopped firing |
| [#286](https://github.com/missingbulb/hitbut/issues/286) | Q | park:failure | canon | 2026-09-13 | Claudinite scheduler run failed |
| [#284](https://github.com/missingbulb/hitbut/issues/284) |  | unlabelled-backlog |  | 2026-09-13 | ci-performance worker's top-100-across-all-workflows fetch starves low-frequency workflows' previous-window sample |
| [#236](https://github.com/missingbulb/hitbut/issues/236) | Q | park:approval | canon | 2026-09-07 | Add packs: suspected from this repo’s shape |
| [#220](https://github.com/missingbulb/hitbut/issues/220) |  | unlabelled-backlog |  | 2026-09-06 | Adopt canon pack: cloudflare-workers |
| [#151](https://github.com/missingbulb/hitbut/issues/151) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] product-wiki/wiki-growth |
| [#147](https://github.com/missingbulb/hitbut/issues/147) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#108](https://github.com/missingbulb/hitbut/issues/108) | Q | park:decision | retired | 2026-08-24 | [claudinite-work] claudinite-growth/growth-extract |
| [#87](https://github.com/missingbulb/hitbut/issues/87) | Q | park:action | retired | 2026-08-25 | Verify in production: the operator console is published and reads the live Worker |
| [#86](https://github.com/missingbulb/hitbut/issues/86) |  | unlabelled-backlog |  | 2026-08-23 | Turn on GitHub Pages for the operator console (human-only steps) |
| [#83](https://github.com/missingbulb/hitbut/issues/83) |  | tidy-tracker |  | 2026-08-23 | Claudinite tracker: Product Wiki Growth |
| [#70](https://github.com/missingbulb/hitbut/issues/70) | Q | park:approval | retired | 2026-08-25 | Move the deploy off GitHub Actions and onto Claudinite tasks |
| [#60](https://github.com/missingbulb/hitbut/issues/60) |  | unlabelled-backlog |  | 2026-08-23 | Adopt canon pack: cloudflare-workers |
| [#36](https://github.com/missingbulb/hitbut/issues/36) |  | unlabelled-backlog |  | 2026-08-23 | The deploy has no smoke test and no rollback path |
| [#34](https://github.com/missingbulb/hitbut/issues/34) |  | unlabelled-backlog |  | 2026-09-04 | Implement the utterance/stance architecture: ingestion, embeddings, backfill |
| [#33](https://github.com/missingbulb/hitbut/issues/33) |  | unlabelled-backlog |  | 2026-08-23 | Nothing names an emergent cluster, so every subject chip is empty |
| [#32](https://github.com/missingbulb/hitbut/issues/32) |  | unlabelled-backlog |  | 2026-08-21 | Reconnaissance and the first two sources |
| [#28](https://github.com/missingbulb/hitbut/issues/28) |  | unlabelled-backlog |  | 2026-08-23 | Honest gaps: what green in the requirements harness does not yet prove |
| [#24](https://github.com/missingbulb/hitbut/issues/24) |  | tidy-tracker |  | 2026-08-21 | Claudinite tracker: Product Wiki Growth |
| [#21](https://github.com/missingbulb/hitbut/issues/21) |  | unlabelled-backlog |  | 2026-08-25 | Adoption hand-over: the two settings no session can reach |
| [#6](https://github.com/missingbulb/hitbut/issues/6) | Q | park:action | retired | 2026-08-25 | Verify in production: the executor hand-off actually dispatches a work item |

## missingbulb/MissingBulbWebsite — 22 open (11 queue / 11 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#389](https://github.com/missingbulb/MissingBulbWebsite/issues/389) | Q | waiting-for-executor | canon | 2026-09-13 | [claudinite-work] claudinite-growth/logs-prune |
| [#388](https://github.com/missingbulb/MissingBulbWebsite/issues/388) | Q | waiting-for-executor | canon | 2026-09-13 | Add packs: suspected from this repo’s shape |
| [#380](https://github.com/missingbulb/MissingBulbWebsite/issues/380) | Q | park:approval | canon | 2026-09-13 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#346](https://github.com/missingbulb/MissingBulbWebsite/issues/346) | Q | park:approval | canon | 2026-09-07 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#344](https://github.com/missingbulb/MissingBulbWebsite/issues/344) | Q | park:approval | canon | 2026-09-07 | [claudinite-work] claudinite-growth/growth-dedup |
| [#298](https://github.com/missingbulb/MissingBulbWebsite/issues/298) | Q | park:action | canon | 2026-09-02 | Align local pack rules and skills to the writing-pack-prose references convention |
| [#276](https://github.com/missingbulb/MissingBulbWebsite/issues/276) |  | unlabelled-backlog |  | 2026-08-30 | The site's release pipeline is a hand-rolled copy of the static-website standard, on its retired version scheme |
| [#263](https://github.com/missingbulb/MissingBulbWebsite/issues/263) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#262](https://github.com/missingbulb/MissingBulbWebsite/issues/262) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#260](https://github.com/missingbulb/MissingBulbWebsite/issues/260) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/growth-dedup |
| [#240](https://github.com/missingbulb/MissingBulbWebsite/issues/240) | Q | park:decision | retired | 2026-08-26 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#227](https://github.com/missingbulb/MissingBulbWebsite/issues/227) |  | unlabelled-backlog |  | 2026-09-06 | Agent sessions can't converge Claudinite work items — converge-item.mjs needs direct GitHub REST, sessions are MCP-only |
| [#217](https://github.com/missingbulb/MissingBulbWebsite/issues/217) |  | unlabelled-backlog |  | 2026-08-23 | Claudinite scheduler fails at job start on every run — the mount has been frozen since 2026-08-21 |
| [#208](https://github.com/missingbulb/MissingBulbWebsite/issues/208) | Q | park:decision | retired | 2026-08-25 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#169](https://github.com/missingbulb/MissingBulbWebsite/issues/169) |  | unlabelled-backlog |  | 2026-08-17 | core pack required by basics but never materialized in .claudinite-checks.json |
| [#60](https://github.com/missingbulb/MissingBulbWebsite/issues/60) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Product Wiki Growth |
| [#55](https://github.com/missingbulb/MissingBulbWebsite/issues/55) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Tidy Branches |
| [#54](https://github.com/missingbulb/MissingBulbWebsite/issues/54) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Growth Dedup |
| [#51](https://github.com/missingbulb/MissingBulbWebsite/issues/51) |  | tidy-tracker |  | 2026-08-09 | Claudinite tracker: Tidy PRs |
| [#40](https://github.com/missingbulb/MissingBulbWebsite/issues/40) |  | unlabelled-backlog |  | 2026-09-06 | One-time GitHub settings for the static-site release pipeline |
| [#38](https://github.com/missingbulb/MissingBulbWebsite/issues/38) |  | unlabelled-backlog |  | 2026-08-15 | Adopt the static-website pack — replace the hand-rolled deploy and version bump |
| [#28](https://github.com/missingbulb/MissingBulbWebsite/issues/28) |  | tidy-tracker |  | 2026-08-15 | Claudinite tracker: Tidy Issues |

## missingbulb/TLDR — 22 open (8 queue / 14 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#509](https://github.com/missingbulb/TLDR/issues/509) | Q | park:approval | canon | 2026-09-13 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#508](https://github.com/missingbulb/TLDR/issues/508) | Q | park:approval | canon | 2026-09-13 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#507](https://github.com/missingbulb/TLDR/issues/507) | Q | park:approval | canon | 2026-09-13 | [claudinite-work] claudinite-growth/growth-dedup |
| [#466](https://github.com/missingbulb/TLDR/issues/466) | Q | park:approval | canon | 2026-09-06 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#397](https://github.com/missingbulb/TLDR/issues/397) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#394](https://github.com/missingbulb/TLDR/issues/394) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/growth-dedup |
| [#367](https://github.com/missingbulb/TLDR/issues/367) | Q | park:decision | retired | 2026-08-24 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#336](https://github.com/missingbulb/TLDR/issues/336) | Q | park:decision | retired | 2026-08-24 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#282](https://github.com/missingbulb/TLDR/issues/282) |  | unlabelled-backlog |  | 2026-09-06 | Adopt the canon packs this repo's stack matches but never declared: `aws-sam` and `google-identity` |
| [#280](https://github.com/missingbulb/TLDR/issues/280) |  | unlabelled-backlog |  | 2026-08-16 | Claudinite: queue/instructions.md (and its DESIGN.md) are missing from the vendored mount |
| [#245](https://github.com/missingbulb/TLDR/issues/245) |  | unlabelled-backlog |  | 2026-09-06 | chrome-release-vendoring materialize would delete the root-package.json version-align step (PR #241) |
| [#179](https://github.com/missingbulb/TLDR/issues/179) |  | tidy-tracker |  | 2026-09-06 | Claudinite tracker: Tidy PRs |
| [#142](https://github.com/missingbulb/TLDR/issues/142) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Tidy Issues |
| [#104](https://github.com/missingbulb/TLDR/issues/104) |  | unlabelled-backlog |  | 2026-09-06 | Re-paste the Claudinite environment Setup script |
| [#94](https://github.com/missingbulb/TLDR/issues/94) |  | workflow-failure |  | 2026-08-15 | ⚠️ Workflow failing: Release: Daily Auto-Release — 2026-07-13 (run 29229001858) |
| [#93](https://github.com/missingbulb/TLDR/issues/93) |  | workflow-failure |  | 2026-08-15 | ⚠️ Workflow failing: Release: Publish to Chrome Web Store — 2026-07-13 (run 29229001858) |
| [#51](https://github.com/missingbulb/TLDR/issues/51) |  | unlabelled-backlog |  | 2026-07-01 | Daily routine: incrementally improve the executable-requirements suite (gap-finder + breakdown + show-the-result auditor) |
| [#50](https://github.com/missingbulb/TLDR/issues/50) |  | unlabelled-backlog |  | 2026-07-01 | Server integration testing via an in-process fake API Gateway (the server's `fake-chrome`) |
| [#42](https://github.com/missingbulb/TLDR/issues/42) |  | unlabelled-backlog |  | 2026-09-06 | Side panel ignores the server's nextToken — only the first 50 comments are reachable |
| [#38](https://github.com/missingbulb/TLDR/issues/38) |  | unlabelled-backlog |  | 2026-09-06 | Client-side log shipping to AWS (POST /logs → CloudWatch) |
| [#23](https://github.com/missingbulb/TLDR/issues/23) |  | unlabelled-backlog |  | 2026-09-06 | Consider anonymous or pseudonymous comments |
| [#17](https://github.com/missingbulb/TLDR/issues/17) |  | unlabelled-backlog |  | 2026-09-06 | Replace placeholder extension icons with real branding |

## missingbulb/EdFringeNow — 21 open (7 queue / 14 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#695](https://github.com/missingbulb/EdFringeNow/issues/695) |  | unlabelled-backlog |  | 2026-09-13 | scrape.yml commits generated data with no retry on a rejected push |
| [#677](https://github.com/missingbulb/EdFringeNow/issues/677) |  | unlabelled-backlog |  | 2026-09-11 | sw/version-bumped and improve-comments-scope conflict when a comment fix touches a published file |
| [#629](https://github.com/missingbulb/EdFringeNow/issues/629) | Q | park:approval | canon | 2026-09-06 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#615](https://github.com/missingbulb/EdFringeNow/issues/615) |  | unlabelled-backlog |  | 2026-09-04 | ui-requirements goldens flap: the same tree fails different cases run to run |
| [#610](https://github.com/missingbulb/EdFringeNow/issues/610) |  | unlabelled-backlog |  | 2026-09-04 | UX research services: what's available, what they cost, and a case for a claudinite pack |
| [#575](https://github.com/missingbulb/EdFringeNow/issues/575) | Q | park:action | canon | 2026-09-02 | Align local pack rules and skills to the writing-pack-prose references convention |
| [#535](https://github.com/missingbulb/EdFringeNow/issues/535) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#532](https://github.com/missingbulb/EdFringeNow/issues/532) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/growth-dedup |
| [#491](https://github.com/missingbulb/EdFringeNow/issues/491) | Q | park:decision | retired | 2026-08-24 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#440](https://github.com/missingbulb/EdFringeNow/issues/440) | Q | park:decision | retired | 2026-08-24 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#401](https://github.com/missingbulb/EdFringeNow/issues/401) |  | workflow-failure |  | 2026-08-18 | Claudinite scheduler run failed |
| [#382](https://github.com/missingbulb/EdFringeNow/issues/382) | Q | running-executor | canon | 2026-09-13 | Add packs: suspected from this repo’s shape |
| [#314](https://github.com/missingbulb/EdFringeNow/issues/314) |  | unlabelled-backlog |  | 2026-08-09 | Replace per-file cache TTLs with a published manifest |
| [#295](https://github.com/missingbulb/EdFringeNow/issues/295) |  | needs-decision |  | 2026-09-07 | The site lists shows edfringe has withdrawn — nothing removes them from the master |
| [#294](https://github.com/missingbulb/EdFringeNow/issues/294) |  | needs-decision |  | 2026-09-07 | Prices exclude the booking fee edfringe advertises — and the recorded `fee` is wrong |
| [#237](https://github.com/missingbulb/EdFringeNow/issues/237) |  | unlabelled-backlog |  | 2026-08-17 | Upstream: baselining's deliver() leaves the scheduler checkout on its maintenance branch |
| [#223](https://github.com/missingbulb/EdFringeNow/issues/223) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Product Wiki Growth |
| [#164](https://github.com/missingbulb/EdFringeNow/issues/164) |  | quick-win |  | 2026-09-07 | Monetization: join Booking.com + Omio and paste the IDs into shared/affiliates.js |
| [#161](https://github.com/missingbulb/EdFringeNow/issues/161) |  | quick-win |  | 2026-09-07 | Monetization: join the 4 affiliate programmes and paste the IDs into js/places.js |
| [#143](https://github.com/missingbulb/EdFringeNow/issues/143) |  | tidy-tracker |  | 2026-09-07 | Claudinite tracker: Tidy Issues |
| [#70](https://github.com/missingbulb/EdFringeNow/issues/70) |  | quick-win |  | 2026-09-07 | Re-paste the Claudinite environment Setup script |

## missingbulb/ShoutsAndWhispers — 18 open (13 queue / 5 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#437](https://github.com/missingbulb/ShoutsAndWhispers/issues/437) | Q | park:failure | canon | 2026-09-13 | [claudinite-work] claudinite-tasks/usage-fold |
| [#395](https://github.com/missingbulb/ShoutsAndWhispers/issues/395) | Q | blocked | canon | 2026-09-13 | Generate and commit the dev Firebase client config |
| [#394](https://github.com/missingbulb/ShoutsAndWhispers/issues/394) | Q | blocked | canon | 2026-09-13 | Retrospective: the dev console and the Appetize preview, one week on |
| [#393](https://github.com/missingbulb/ShoutsAndWhispers/issues/393) |  | blocked |  | 2026-09-07 | Confirm the Appetize preview is usable end to end |
| [#392](https://github.com/missingbulb/ShoutsAndWhispers/issues/392) | Q | blocked | canon | 2026-09-13 | Upload the preview to Appetize and document the link |
| [#391](https://github.com/missingbulb/ShoutsAndWhispers/issues/391) | Q | blocked | canon | 2026-09-13 | Android build wiring and the Appetize preview workflow |
| [#390](https://github.com/missingbulb/ShoutsAndWhispers/issues/390) | Q | blocked | canon | 2026-09-13 | Email/password sign-in path in the app |
| [#389](https://github.com/missingbulb/ShoutsAndWhispers/issues/389) |  | blocked |  | 2026-09-07 | Validation gate: drive the dev console and confirm it works |
| [#388](https://github.com/missingbulb/ShoutsAndWhispers/issues/388) | Q | blocked | canon | 2026-09-13 | Deploy the dev backend and the console, and post the URL |
| [#387](https://github.com/missingbulb/ShoutsAndWhispers/issues/387) | Q | blocked | canon | 2026-09-13 | Deploy workflow for the dev project, and Hosting for the console |
| [#386](https://github.com/missingbulb/ShoutsAndWhispers/issues/386) | Q | blocked | canon | 2026-09-13 | Compressed replay against the emulator suite |
| [#385](https://github.com/missingbulb/ShoutsAndWhispers/issues/385) | Q | blocked | canon | 2026-09-13 | Console replay engine and observation views, real-time against dev |
| [#384](https://github.com/missingbulb/ShoutsAndWhispers/issues/384) | Q | blocked | canon | 2026-09-13 | Dev console package: plan model, plan editor, and its requirements suite |
| [#383](https://github.com/missingbulb/ShoutsAndWhispers/issues/383) | Q | blocked | canon | 2026-09-13 | Sim-time wire contract and the four guards that keep it out of production |
| [#382](https://github.com/missingbulb/ShoutsAndWhispers/issues/382) |  | unlabelled-backlog |  | 2026-09-06 | Console and secret setup for the dev console and the Appetize preview |
| [#379](https://github.com/missingbulb/ShoutsAndWhispers/issues/379) |  | blocked |  | 2026-09-07 | Dev console for scripted sim accounts, then the Appetize preview |
| [#344](https://github.com/missingbulb/ShoutsAndWhispers/issues/344) | Q | park:decision | canon | 2026-09-07 | Align local pack rules and skills to the writing-pack-prose references convention |
| [#99](https://github.com/missingbulb/ShoutsAndWhispers/issues/99) |  | blocked |  | 2026-09-07 | Get the app running on Appetize.io (browser-based device preview) |

## missingbulb/WIP — 18 open (6 queue / 12 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#210](https://github.com/missingbulb/WIP/issues/210) | Q | park:approval | canon | 2026-09-07 | Add packs: suspected from this repo’s shape |
| [#208](https://github.com/missingbulb/WIP/issues/208) |  | unlabelled-backlog |  | 2026-09-06 | README pack badge row references a retired "barriers" pack |
| [#205](https://github.com/missingbulb/WIP/issues/205) |  | unlabelled-backlog |  | 2026-09-06 | README pack-badge block: dangling reference to absorbed barriers pack |
| [#202](https://github.com/missingbulb/WIP/issues/202) |  | unlabelled-backlog |  | 2026-09-06 | README pack badge row references nonexistent "barriers" pack and omits "claudinite-tasks" |
| [#193](https://github.com/missingbulb/WIP/issues/193) | Q | park:approval | canon | 2026-09-06 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#189](https://github.com/missingbulb/WIP/issues/189) |  | unlabelled-backlog |  | 2026-09-06 | Adopt canon pack: cloudflare-workers |
| [#130](https://github.com/missingbulb/WIP/issues/130) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] product-wiki/wiki-growth |
| [#127](https://github.com/missingbulb/WIP/issues/127) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#126](https://github.com/missingbulb/WIP/issues/126) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#124](https://github.com/missingbulb/WIP/issues/124) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/growth-dedup |
| [#72](https://github.com/missingbulb/WIP/issues/72) |  | tidy-tracker |  | 2026-08-23 | Claudinite tracker: Product Wiki Growth |
| [#62](https://github.com/missingbulb/WIP/issues/62) |  | unlabelled-backlog |  | 2026-08-24 | converge-item.mjs cannot run from a web session — the exact place invoke.mjs sends work |
| [#54](https://github.com/missingbulb/WIP/issues/54) |  | unlabelled-backlog |  | 2026-08-23 | Verify in production: the native recorders capture a real set on a real device |
| [#41](https://github.com/missingbulb/WIP/issues/41) |  | unlabelled-backlog |  | 2026-08-22 | Phase 0 — human-only setup for the Flutter conversion |
| [#40](https://github.com/missingbulb/WIP/issues/40) |  | unlabelled-backlog |  | 2026-08-23 | Tracking: convert the client to Flutter — cross-platform, offline laugh detection, macOS-runner-free CI |
| [#7](https://github.com/missingbulb/WIP/issues/7) |  | tidy-tracker |  | 2026-08-20 | Claudinite tracker: Product Wiki Growth |
| [#6](https://github.com/missingbulb/WIP/issues/6) |  | unlabelled-backlog |  | 2026-08-24 | Tracking: build Set list — Phase A client MVP to App Store, Phase B Cloudflare pipeline + QR share |
| [#5](https://github.com/missingbulb/WIP/issues/5) |  | unlabelled-backlog |  | 2026-08-20 | Phase 0 — human-only setup for Set list build (accounts, secrets, domain) |

## missingbulb/ClaudiniteCanary — 16 open (8 queue / 8 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#413](https://github.com/missingbulb/ClaudiniteCanary/issues/413) | Q | park:failure | canon | 2026-09-13 | [claudinite-work] claudinite-tasks/usage-fold |
| [#411](https://github.com/missingbulb/ClaudiniteCanary/issues/411) | Q | park:failure | canon | 2026-09-13 | [claudinite-work] claudinite-lifecycle/update |
| [#373](https://github.com/missingbulb/ClaudiniteCanary/issues/373) |  | unlabelled-backlog |  | 2026-09-07 | Issue #322 stuck: closed by its own PR's `Closes #N` before queue convergence, still wearing task:status:running-agent |
| [#362](https://github.com/missingbulb/ClaudiniteCanary/issues/362) |  | quick-win |  | 2026-09-07 | Dangling badge reference in README.md: barriers pack no longer declared |
| [#354](https://github.com/missingbulb/ClaudiniteCanary/issues/354) | Q | park:approval | canon | 2026-09-06 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#283](https://github.com/missingbulb/ClaudiniteCanary/issues/283) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#247](https://github.com/missingbulb/ClaudiniteCanary/issues/247) | Q | park:approval | retired | 2026-08-24 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#239](https://github.com/missingbulb/ClaudiniteCanary/issues/239) |  | unlabelled-backlog |  | 2026-08-23 | converge-item.mjs has no MCP-compatible agent-lane path — a session cannot perform queue instructions.md step 6 |
| [#235](https://github.com/missingbulb/ClaudiniteCanary/issues/235) | Q | park:decision | retired | 2026-08-24 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#153](https://github.com/missingbulb/ClaudiniteCanary/issues/153) |  | unlabelled-backlog |  | 2026-08-21 | claudinite-dashboard adoption: the setup steps only a human can do |
| [#133](https://github.com/missingbulb/ClaudiniteCanary/issues/133) | Q | park:approval | retired | 2026-08-19 | [claudinite-work] claudinite-lifecycle/adopt-requested-packs |
| [#129](https://github.com/missingbulb/ClaudiniteCanary/issues/129) | Q | park:approval | retired | 2026-08-23 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#95](https://github.com/missingbulb/ClaudiniteCanary/issues/95) |  | tidy-tracker |  | 2026-09-07 | Claudinite tracker: Tidy Issues |
| [#47](https://github.com/missingbulb/ClaudiniteCanary/issues/47) |  | tidy-tracker |  | 2026-08-10 | Claudinite tracker: Growth Extract |
| [#41](https://github.com/missingbulb/ClaudiniteCanary/issues/41) |  | tidy-tracker |  | 2026-09-13 | Claudinite tracker: Prose to Checks |
| [#39](https://github.com/missingbulb/ClaudiniteCanary/issues/39) |  | tidy-tracker |  | 2026-08-30 | Claudinite tracker: Tidy PRs |

## missingbulb/CrosswordChat — 12 open (4 queue / 8 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#453](https://github.com/missingbulb/CrosswordChat/issues/453) | Q | park:approval | canon | 2026-09-13 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#421](https://github.com/missingbulb/CrosswordChat/issues/421) |  | unlabelled-backlog |  | 2026-09-07 | ci-performance worker.mjs: unpaginated top-100 fetch starves the previous-window sample for low-frequency workflows |
| [#419](https://github.com/missingbulb/CrosswordChat/issues/419) | Q | park:approval | canon | 2026-09-07 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#418](https://github.com/missingbulb/CrosswordChat/issues/418) | Q | park:approval | canon | 2026-09-07 | [claudinite-work] claudinite-growth/growth-dedup |
| [#352](https://github.com/missingbulb/CrosswordChat/issues/352) |  | unlabelled-backlog |  | 2026-08-30 | Chrome Web Store release pipeline is a generation behind the chrome-extension pack |
| [#304](https://github.com/missingbulb/CrosswordChat/issues/304) |  | unlabelled-backlog |  | 2026-08-23 | Connect the Claude GitHub App: converge-item.mjs can't reach the GitHub API from a dispatched session |
| [#256](https://github.com/missingbulb/CrosswordChat/issues/256) | Q | park:decision | retired | 2026-08-23 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#211](https://github.com/missingbulb/CrosswordChat/issues/211) |  | unlabelled-backlog |  | 2026-09-06 | Recurring vitest cold-start timeout in visual-snapshots.test.js (help-page) |
| [#63](https://github.com/missingbulb/CrosswordChat/issues/63) |  | unlabelled-backlog |  | 2026-07-19 | Manual check: mic indicator clears on bfcache/back-forward teardown (verifies PR #62 pagehide path) |
| [#11](https://github.com/missingbulb/CrosswordChat/issues/11) |  | unlabelled-backlog |  | 2026-07-05 | Live check: mic never goes deaf after clicks; barge-in reliability (MT-13, MT-27) |
| [#9](https://github.com/missingbulb/CrosswordChat/issues/9) |  | unlabelled-backlog |  | 2026-07-09 | Live check: grid-full "next" moves on; "seven across" jumps to the clue (MT-09) |
| [#6](https://github.com/missingbulb/CrosswordChat/issues/6) |  | unlabelled-backlog |  | 2026-07-09 | Live check: penciling on forced answers works on the real page (MT-29, MT-07) |

## missingbulb/VascularColoring — 12 open (7 queue / 5 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#410](https://github.com/missingbulb/VascularColoring/issues/410) | Q | park:failure | canon | 2026-09-13 | [claudinite-work] claudinite-tasks/usage-fold |
| [#408](https://github.com/missingbulb/VascularColoring/issues/408) | Q | park:failure | canon | 2026-09-13 | [claudinite-work] claudinite-lifecycle/update |
| [#406](https://github.com/missingbulb/VascularColoring/issues/406) | Q | park:approval | canon | 2026-09-13 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#375](https://github.com/missingbulb/VascularColoring/issues/375) |  | unlabelled-backlog |  | 2026-09-07 | README pack-badge block links to two undeclared packs |
| [#370](https://github.com/missingbulb/VascularColoring/issues/370) | Q | park:approval | canon | 2026-09-07 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#369](https://github.com/missingbulb/VascularColoring/issues/369) | Q | park:approval | canon | 2026-09-07 | [claudinite-work] claudinite-growth/growth-dedup |
| [#361](https://github.com/missingbulb/VascularColoring/issues/361) |  | unlabelled-backlog |  | 2026-09-06 | Dangling README badge link: .claudinite/shared/packs/barriers/badge.svg |
| [#294](https://github.com/missingbulb/VascularColoring/issues/294) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#258](https://github.com/missingbulb/VascularColoring/issues/258) | Q | park:approval | retired | 2026-08-24 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#86](https://github.com/missingbulb/VascularColoring/issues/86) |  | tidy-tracker |  | 2026-08-23 | Claudinite tracker: Tidy Branches |
| [#85](https://github.com/missingbulb/VascularColoring/issues/85) |  | tidy-tracker |  | 2026-08-23 | Claudinite tracker: Tidy PRs |
| [#8](https://github.com/missingbulb/VascularColoring/issues/8) |  | unlabelled-backlog |  | 2026-09-06 | Re-paste the Claudinite environment Setup script |

## missingbulb/NoRFinder — 9 open (4 queue / 5 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#40](https://github.com/missingbulb/NoRFinder/issues/40) |  | unlabelled-backlog |  | 2026-09-07 | README badge row references packs that are no longer declared or vendored |
| [#32](https://github.com/missingbulb/NoRFinder/issues/32) |  | unlabelled-backlog |  | 2026-09-06 | Hand-over: three repository settings Claudinite delivery depends on |
| [#23](https://github.com/missingbulb/NoRFinder/issues/23) | Q | park:failure | canon | 2026-09-08 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#22](https://github.com/missingbulb/NoRFinder/issues/22) | Q | park:failure | canon | 2026-09-08 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#20](https://github.com/missingbulb/NoRFinder/issues/20) | Q | park:failure | canon | 2026-09-08 | [claudinite-work] claudinite-growth/growth-dedup |
| [#17](https://github.com/missingbulb/NoRFinder/issues/17) |  | unlabelled-backlog |  | 2026-09-05 | tests/test_invariance.py runs in no gate |
| [#16](https://github.com/missingbulb/NoRFinder/issues/16) |  | unlabelled-backlog |  | 2026-09-05 | Declare the Python imaging stack as a local-pack env requirement |
| [#11](https://github.com/missingbulb/NoRFinder/issues/11) | Q | park:failure | canon | 2026-09-08 | [claudinite-work] claudinite-growth/growth-extract |
| [#4](https://github.com/missingbulb/NoRFinder/issues/4) |  | schedule-board |  | 2026-09-07 | [claudinite-schedule] the schedule board |

## missingbulb/LaughCounter — 3 open (1 queue / 2 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#343](https://github.com/missingbulb/LaughCounter/issues/343) |  | unlabelled-backlog |  | 2026-09-06 | This repo fingerprints the `macos` pack but does not declare it, and its DMG release plumbing is unowned |
| [#174](https://github.com/missingbulb/LaughCounter/issues/174) |  | unlabelled-backlog |  | 2026-09-06 | Distribute LaughCounter via Homebrew Cask (own tap) |
| [#26](https://github.com/missingbulb/LaughCounter/issues/26) | Q | bare-needs-human | retired | 2026-08-17 | [needs-human] Enable Developer ID signing + notarization for the DMG |
