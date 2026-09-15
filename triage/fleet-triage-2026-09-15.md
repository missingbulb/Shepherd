# Fleet triage — 2026-09-15

392 open issues across 15 in-scope repos, from the snapshot generated **2026-09-14T09:51Z**.
**159 queue-managed, 233 plain, 114 parked.**

The snapshot is a day old because **today's collector run parked**, and the reason it parked is this
run's headline: canon re-shelved `claudinite-tasks`, and two of this repo's own local tasks import
canon modules by paths that no longer exist. [Shepherd#617](https://github.com/missingbulb/Shepherd/issues/617)
filed the symptom this morning and left the cause as an explicit hypothesis. This run settles it
from the job log.

## The re-shelve broke the workers that reached past the published surface

[Run 34952194122](https://github.com/missingbulb/Shepherd/actions/runs/34952194122), one `execute`
job, eight items against one shared working tree. In order:

| time | item | outcome |
|---|---|---|
| 09:22:45 | **#610 `claudinite-lifecycle/update`** | converged the tree in place, opened PR #615 |
| 09:23:08 | | `PR #615 not landable this run (failing CI: Checks failure)` |
| **09:23:20** | **#613 `shepherd/fleet-issues-snapshot`** | **died: `deliver-generated.mjs`** |
| 09:23:34 | #612 `claudinite-tasks/usage-fold` | done |
| 09:24:22 | #608 `fleet-pack-seeds` | done |
| 09:24:40 | #607 `claudinite-dashboard/publish-pages` | done |
| 09:25:19 | #611 `claudinite-tasks/task-janitor` | done |
| 09:25:42 | #609 `fleet-roster` | done |
| **09:26:04** | **#614 `shepherd/fleet-repo-digest-email`** | **died: `queue/work-item.mjs`** |

**#610 is the mutating item**, and it says so itself:

```
update: engine — ok: the converged tree passed its self-test
update: packs — ok: the converged tree passed its self-test
```

That is the `update` task vendoring canon's **current** `.claudinite/shared/` into the runner's
working directory. Everything scheduled behind it ran against that tree instead of against
`55887dc`. The five items that survived import nothing that moved; the two that died import
exactly what did.

This is worse than #617's stated hypothesis in one specific way. **PR #615 never landed** — CI
failed and the run left it open — so the tree six later items executed against is a canon version
this repo *rejected*. The converge is not gated on its own delivery succeeding.

### Where the modules went, and why they were reachable at all

Canon's `packs/claudinite-tasks/` at `main` (v60915.1) is the re-shelve from
[Claudinite#1478](https://github.com/missingbulb/Claudinite/issues/1478) / PR
[#1890](https://github.com/missingbulb/Claudinite/pull/1890): `src/` for the code, `queue/` frozen
as workflow ABI, `shared-code/` as the published surface. Read live:

- `packs/claudinite-tasks/queue/` now holds **nine entries** — `scheduler-run`, `drain-dispatch`,
  `workflow-failure`, `executor`, `executor-continuation`, `tick`, `create-work-item`,
  `instructions.md`, `tasks/`. **`work-item.mjs` is not among them.**
- The pack root holds `pack.mjs`, `converge-workflows.mjs`, `queue/`, `src/`, `shared-code/`,
  `stubs/`, `tasks/`, `test/`, the rule dirs and the metadata files. **`deliver-generated.mjs`,
  `merge-policy.mjs`, `task-contract.mjs` and `dispatch.mjs` are all gone from it.**

Shepherd's three local files reach into both of the places that moved:

```
local/packs/shepherd/tasks/fleet-issues-snapshot/worker.mjs:24
  ← ../../../../../shared/packs/claudinite-tasks/deliver-generated.mjs
local/packs/shepherd/tasks/fleet-issues-snapshot/worker.mjs:25
  ← ../../../../../shared/packs/claudinite-tasks/merge-policy.mjs
local/packs/shepherd/tasks/fleet-repo-digest-email/digest.mjs:5
  ← ../../../../../shared/packs/claudinite-tasks/queue/work-item.mjs
local/packs/shepherd/tasks/fleet-repo-digest-email/digest.mjs:6
  ← ../../../../../shared/packs/claudinite-tasks/dispatch.mjs
local/packs/shepherd/tasks/fleet-issues-snapshot/task.test.mjs:4
  ← ../../../../../shared/packs/claudinite-tasks/task-contract.mjs
```

Not one of them goes through `shared-code/`, which is the one path the barrier allows another pack
to import and which publishes `work-items.mjs`, `delivery.mjs`, `merge-policy.mjs` and
`task-contract.mjs` — the very things these files want.

**The check had already said so.** Every run of this series reported `check_the_world.mjs` as "0
blocking, 8 advisory" and moved on. Three of those eight advisories are `file-placement` on these
exact two files:

> `digest.mjs:5` references `../../../../../shared/packs/claudinite-tasks/queue/work-item.mjs` at
> distance 9 — *the folder tree should encode the dependency graph; far reaches make it lie*

The advisory named the fault line, by file and by line, days before it broke. It was filed as
advisory rather than blocking, and four consecutive triages — mine — recorded it as background
noise. That is the lesson of this run: an advisory that names a reach into another pack's internals
is a prediction, not a style note.

### The fleet is queued up behind the same edge

`fleet-roster` ran in that same job and printed the version gap for every member:

> 8 behind, 1 fresh, 4 dormant. Seven of the eight are behind by
> `claudinite-tasks v60913.6 → v60915.1`; ClaudiniteWebsite and MissingBulbWebsite by
> `v60907.3 → v60915.1`.

Every one of those members converges to the new layout on its next successful update. Any local
task in any of them that imports a moved canon module breaks at that moment, exactly as Shepherd's
did. **I have confirmed this for Shepherd only** — the other members' local packs are not readable
from this session, so whether they carry the same reach is unmeasured, not clear.

## #503 is done, and the digest lane drained

The item this series led with for three consecutive runs closed this morning:
[Shepherd#503](https://github.com/missingbulb/Shepherd/issues/503), `completed`, 2026-09-15T10:01Z,
nine of ten boxes ticked — destination address verified, `DIGEST_EMAIL_FROM` and `DIGEST_EMAIL_TO`
set (visible in the run's `CLAUDINITE_VARS`), account id set, the token reissued with Email Sending
Write. #617 records that a later run "ran `fleet-repo-digest-email` cleanly and the digest
delivered."

All five stale parks on that lane — #514, #526, #536, #548, #566 — were closed alongside it, with
**no closing comment on any of them**. Neither rule E nor rule I closes silently; both write their
reason. So this was a person clearing the lane by hand.

**This corrects the 09-13 report.** It predicted the lane would converge on ~10 open items, because
rule I's ten-day bound looked like the only exit and the generator filed one a day. The lane went
6 → 2 on day seven instead, by the route the report treated as hypothetical: somebody did the two
repository variables. The prediction was arithmetically right and wrong about the world — the
mechanism was never going to be what resolved it.

What remains on the lane is residue: [#581](https://github.com/missingbulb/Shepherd/issues/581) and
[#600](https://github.com/missingbulb/Shepherd/issues/600) are both `failure` parks that, as #617
puts it, "no longer reflect a real failure."

## ClaudiniteWebsite emptied

| | 09-10 | 09-14 |
|---|---|---|
| open issues | 37 | **5** |

Thirty-five issues closed in four days — eleven of them parks, including two of the eight dead
`Verify in production:` items the 09-13 report listed ([#288](https://github.com/missingbulb/ClaudiniteWebsite/issues/288),
[#255](https://github.com/missingbulb/ClaudiniteWebsite/issues/255)), plus a long tail of canon-defect
reports, trackers and adoption issues. No other member closed more than six in the same window.

That is a deliberate repo cleanup, not janitor drainage — no rule closes trackers and hand-filed
canon reports together. **I could not read those threads**; ClaudiniteWebsite is not attached to
this session, so who closed them and on what basis is unmeasured. It is the largest single move in
the fleet this week and it is worth someone confirming it was intended.

## Cohort shape, five snapshots

| | 09-02 | 09-08 | 09-10 | 09-13 | 09-14 |
|---|---|---|---|---|---|
| open issues | 349 | 410 | 393 | 417 | **392** |
| queue-managed | 133 | 184 | 167 | 177 | **159** |
| parked | 125 | 120 | 112 | 125 | **114** |
| `failure` | 36 | 29 | 21 | 16 | **10** |
| `action` | 24 | 14 | 14 | 14 | **12** |
| `decision` | 40 | 36 | 36 | 38 | **35** |
| `approval` | 25 | 41 | 41 | 57 | **57** |
| `blocked` | 3 | 46 | 43 | 33 | **35** |

- **`failure` is at 10, the lowest in the series** — down from 36, and five of the six it shed were
  the digest lane a person cleared. The kind two rules can drain keeps draining.
- **`decision` fell for the first time**, 38 → 35, entirely through the ClaudiniteWebsite sweep.
  Nothing mechanical touched it; the cohort still has no rule that can.
- **`approval` is flat at 57** and is now half of everything parked. The 09-13 follow-up measured
  the 19 of those 57 that are readable from here: 13 wait on genuinely open PRs, and **6 carry no
  `Ends-when:` at all**, so rule G can never end them. The other 38 remain unmeasured.
- **Parks fell 125 → 114 on a day when one member closed 35 issues.** Strip ClaudiniteWebsite out
  and the parked population is flat again.

## Members: one dormancy is a declaration, one silence is not

The 09-13 report named NoRFinder and WIP as frozen and recommended checking whether their
schedulers run. `fleet-roster`, in today's log, answers half of that from the fleet's own artifact:

> **Dormant (scheduler stopped by declaration — not measured, and no fleet operation touches
> them):** missingbulb/hitbut, missingbulb/laughcounter, missingbulb/shoutsandwhispers,
> missingbulb/wip

**WIP is dormant on purpose** — that is a correction; it needs no investigation, and neither do
hitbut, LaughCounter or ShoutsAndWhispers when they look quiet. **NoRFinder is not on that list.**
It is a covered, non-dormant member, and it has closed nothing, filed nothing and moved nothing in
the four days 09-10 → 09-14, while carrying four `failure` parks all stamped 2026-09-08T09:07. That
silence is still unexplained, and it is now the only one that is.

The roster also reports **coverage converged — "Uncovered: none 🎉"** — and ClaudiniteCanary as the
one member fully fresh against canon.

## Lanes, tasks and the plain half

87 items on 50 distinct `[claudinite-work]` lanes; 20 lanes carry more than one, **37 items are
surplus**. The three `claudinite-growth` tasks are 58 of the 87 — `rule-revalidation` 27,
`prose-to-checks-sweep` 22, `growth-dedup` 9. Unchanged in character from every prior run: each
asks a person to approve its output, runs again on schedule regardless, and files a fresh park.

233 plain issues, **191 of them unlabelled** — down three from 09-13, still the largest single
population in the fleet and still the one nothing can be said about, because the snapshot carries
no bodies.

## What is still open

Recommendations. This skill assesses; the fix, the relabel and the close are somebody's own call.

1. **Point Shepherd's three local files at `shared-code/`** — `work-items.mjs`, `delivery.mjs`,
   `merge-policy.mjs`, `task-contract.mjs` publish everything they currently reach in for. Until
   then this repo's snapshot and digest tasks break on every run that converges first.
2. **Gate the `update` task's in-place converge on its own delivery landing**, or run it last —
   [#617](https://github.com/missingbulb/Shepherd/issues/617) is the standing issue, and the
   confirmed ordering is now on it. A rejected canon version should not be left live in a working
   tree six items still have to run against.
3. **Check the other seven members behind on `claudinite-tasks`** for local tasks importing moved
   canon paths, before they converge.
4. **Promote `file-placement`'s cross-pack reach from advisory to blocking**, or at least treat it
   as a defect report. It named this failure by file and line, days early, and four triages read
   past it.
5. **Clear [#581](https://github.com/missingbulb/Shepherd/issues/581) and
   [#600](https://github.com/missingbulb/Shepherd/issues/600)** — stale parks on a lane that now
   works.
6. **Confirm the ClaudiniteWebsite sweep was intended** — 35 issues in four days, unread from here.
7. **NoRFinder**: not dormant, not moving, four failure parks a week old.
8. **[Claudinite#2010](https://github.com/missingbulb/Claudinite/issues/2010)** (the executor leash
   parks `decision`, which nothing drains) and
   **[#2011](https://github.com/missingbulb/Claudinite/issues/2011)** (no `fleet-baseline` verdict
   for a review-gated member) are open from 09-13, as are
   [#1910](https://github.com/missingbulb/Claudinite/issues/1910) and
   [#1891](https://github.com/missingbulb/Claudinite/issues/1891).
9. **Six of the eight dead `Verify in production:` items** remain; two closed in the
   ClaudiniteWebsite sweep.
10. **38 of 57 `approval` parks still unmeasured** for an end condition, and **191 unlabelled plain
    issues**. Issue bodies in the snapshot would settle the first, as asked in every run.


---

# Evidence — every open issue, repo by repo

392 open issues across 15 in-scope repos under `missingbulb` (snapshot generated 2026-09-14T09:51:16.421Z).
`Q` = queue-managed. `Gen` = label generation (canon `task:status:*` vs retired `needs-human`/`task:needs-human-*`).


## missingbulb/Claudinite — 157 open (53 queue / 104 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#2023](https://github.com/missingbulb/Claudinite/issues/2023) |  | unlabelled-backlog |  | 2026-09-13 | A pack's load fails under parallel test load — cause still unidentified |
| [#2020](https://github.com/missingbulb/Claudinite/issues/2020) |  | unlabelled-backlog |  | 2026-09-13 | loadPacks drops discovery errors, so a pack that fails to load silently stops forcing its skills |
| [#2018](https://github.com/missingbulb/Claudinite/issues/2018) | Q | blocked | canon | 2026-09-13 | Verify in production: the dashboard's src/ layout publishes and still boots |
| [#2017](https://github.com/missingbulb/Claudinite/issues/2017) | Q | blocked | canon | 2026-09-13 | Verify in production: the scheduler's weekly-window run no longer spends minutes on commit reads |
| [#2014](https://github.com/missingbulb/Claudinite/issues/2014) |  | unlabelled-backlog |  | 2026-09-13 | fleet-baseline's follow budget can exceed its own code_work_timeout, so a long follow is killed instead of reported |
| [#2012](https://github.com/missingbulb/Claudinite/issues/2012) |  | unlabelled-backlog |  | 2026-09-13 | GitHub Actions cache: where it helps Claudinite's machinery and members, and where it doesn't |
| [#2011](https://github.com/missingbulb/Claudinite/issues/2011) |  | unlabelled-backlog |  | 2026-09-13 | `fleet-baseline` has no verdict for a review-gated member, so it fails the run and parks |
| [#2010](https://github.com/missingbulb/Claudinite/issues/2010) |  | unlabelled-backlog |  | 2026-09-13 | The executor leash still parks `decision` — #1515 was fixed on the agent leash only |
| [#2003](https://github.com/missingbulb/Claudinite/issues/2003) | Q | blocked | canon | 2026-09-13 | Verify in production: the dashboard's sign-in gate, Remember me and account menu |
| [#2000](https://github.com/missingbulb/Claudinite/issues/2000) |  | unlabelled-backlog |  | 2026-09-13 | rules-append-only and rules-line-length are in tension for any rule headline over ~96 bytes |
| [#1999](https://github.com/missingbulb/Claudinite/issues/1999) |  | unlabelled-backlog |  | 2026-09-13 | queue/instructions.md defines no branch for a fire that carries no payload |
| [#1996](https://github.com/missingbulb/Claudinite/issues/1996) |  | unlabelled-backlog |  | 2026-09-13 | `task:origin:manual`'s description claims the woken case, which wears `task:origin:planned` |
| [#1995](https://github.com/missingbulb/Claudinite/issues/1995) |  | unlabelled-backlog |  | 2026-09-13 | `dailyHour` cannot order members before the canon: the cron's own spread is wider than the one-hour stagger |
| [#1994](https://github.com/missingbulb/Claudinite/issues/1994) |  | unlabelled-backlog |  | 2026-09-13 | The scheduler's log drops the `asked` line for a task whose standing item is live |
| [#1989](https://github.com/missingbulb/Claudinite/issues/1989) |  | unlabelled-backlog |  | 2026-09-13 | Retire the re-export shims left by dropping the rule-token metric |
| [#1988](https://github.com/missingbulb/Claudinite/issues/1988) |  | unlabelled-backlog |  | 2026-09-13 | Personal preferences: from a context-token provider to a personal pack provider |
| [#1972](https://github.com/missingbulb/Claudinite/issues/1972) |  | unlabelled-backlog |  | 2026-09-13 | converge-item's `--pr` stamps a "waiting on a person" line onto a `done` that closes the item |
| [#1963](https://github.com/missingbulb/Claudinite/issues/1963) | Q | park:approval | canon | 2026-09-13 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#1962](https://github.com/missingbulb/Claudinite/issues/1962) | Q | park:approval | canon | 2026-09-13 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#1957](https://github.com/missingbulb/Claudinite/issues/1957) | Q | park:approval | canon | 2026-09-13 | [claudinite-work] claudinite-canon-curation/growth-promote |
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
| [#1816](https://github.com/missingbulb/Claudinite/issues/1816) | Q | park:decision | canon | 2026-09-13 | Retrospective: the claudinite-tasks pack boundary |
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
| [#1703](https://github.com/missingbulb/Claudinite/issues/1703) | Q | park:decision | canon | 2026-09-13 | Retrospective: the four-moment declared-check mechanism |
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
| [#748](https://github.com/missingbulb/Claudinite/issues/748) |  | unlabelled-backlog |  | 2026-09-06 | conformance-backlog: committed-build-artifact check (promote cannot land a check — fixtures sit outside its write surface) |
| [#722](https://github.com/missingbulb/Claudinite/issues/722) |  | unlabelled-backlog |  | 2026-09-06 | Align the website repos' release flows on one github-pages-serving standard |
| [#590](https://github.com/missingbulb/Claudinite/issues/590) |  | unlabelled-backlog |  | 2026-09-06 | Adoption never sets the two repo settings baselining depends on — add them to bootstrap (both are scriptable) |
| [#498](https://github.com/missingbulb/Claudinite/issues/498) |  | unlabelled-backlog |  | 2026-09-06 | scheduler-workflow-shape should validate the scopes a repo's tasks actually need, not a fixed two |
| [#409](https://github.com/missingbulb/Claudinite/issues/409) |  | plan-tracking |  | 2026-07-30 | Tracking-issue freshness: keep the plan issue in sync after every merge |
| [#334](https://github.com/missingbulb/Claudinite/issues/334) |  | unlabelled-backlog |  | 2026-09-06 | DESIGN.md trade-offs: delivery mode is now a security knob; name the vendored mount's supply-chain improvement |
| [#239](https://github.com/missingbulb/Claudinite/issues/239) |  | unlabelled-backlog |  | 2026-09-07 | Follow-up: wire existing legacy tolerances to the migration resolver |
| [#230](https://github.com/missingbulb/Claudinite/issues/230) |  | unlabelled-backlog |  | 2026-09-06 | Workflows pin Node 20, now deprecated on Actions runners (forced to Node 24) |
| [#223](https://github.com/missingbulb/Claudinite/issues/223) |  | unlabelled-backlog |  | 2026-09-07 | Conformance-backlog: check for chrome-extension:// in API Gateway v2 CORS AllowOrigins |

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

## missingbulb/MissingBulbWebsite — 23 open (12 queue / 11 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#402](https://github.com/missingbulb/MissingBulbWebsite/issues/402) | Q | blocked | canon | 2026-09-13 | Verify in production: the site links its pages by extensionless URL |
| [#394](https://github.com/missingbulb/MissingBulbWebsite/issues/394) | Q | park:approval | canon | 2026-09-13 | [claudinite-work] basics/improve-comments |
| [#393](https://github.com/missingbulb/MissingBulbWebsite/issues/393) | Q | park:approval | canon | 2026-09-13 | [claudinite-work] claudinite-lifecycle/update |
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
| [#382](https://github.com/missingbulb/EdFringeNow/issues/382) | Q | park:approval | canon | 2026-09-13 | Add packs: suspected from this repo’s shape |
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

## missingbulb/ClaudiniteCanary — 17 open (9 queue / 8 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#417](https://github.com/missingbulb/ClaudiniteCanary/issues/417) | Q | running-agent | canon | 2026-09-14 | [claudinite-work] claudinite-lifecycle/update |
| [#416](https://github.com/missingbulb/ClaudiniteCanary/issues/416) | Q | waiting-for-executor | canon | 2026-09-14 | [claudinite-work] claudinite-dashboard/publish-pages |
| [#413](https://github.com/missingbulb/ClaudiniteCanary/issues/413) | Q | park:failure | canon | 2026-09-13 | [claudinite-work] claudinite-tasks/usage-fold |
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

## missingbulb/Shepherd — 17 open (10 queue / 7 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#600](https://github.com/missingbulb/Shepherd/issues/600) | Q | waiting-for-executor | canon | 2026-09-14 | [claudinite-work] shepherd/fleet-repo-digest-email |
| [#599](https://github.com/missingbulb/Shepherd/issues/599) | Q | running-executor | canon | 2026-09-14 | [claudinite-work] shepherd/fleet-issues-snapshot |
| [#596](https://github.com/missingbulb/Shepherd/issues/596) | Q | running-agent | canon | 2026-09-14 | [claudinite-work] claudinite-lifecycle/update |
| [#593](https://github.com/missingbulb/Shepherd/issues/593) | Q | waiting-for-executor | canon | 2026-09-14 | [claudinite-work] claudinite-dashboard/publish-pages |
| [#581](https://github.com/missingbulb/Shepherd/issues/581) | Q | park:failure | canon | 2026-09-14 | [claudinite-work] shepherd/fleet-repo-digest-email |
| [#540](https://github.com/missingbulb/Shepherd/issues/540) |  | unlabelled-backlog |  | 2026-09-10 | Dashboard sign-in: no way to measure button use vs. token-box use |
| [#505](https://github.com/missingbulb/Shepherd/issues/505) | Q | park:decision | canon | 2026-09-13 | Verify in production: the morning fleet digest actually sends |
| [#503](https://github.com/missingbulb/Shepherd/issues/503) |  | unlabelled-backlog |  | 2026-09-07 | Hand-over: the Cloudflare setup the morning fleet digest needs |
| [#420](https://github.com/missingbulb/Shepherd/issues/420) |  | unlabelled-backlog |  | 2026-09-02 | Fleet triage 2026-09-02: 53% of parks sit in a kind no rule can drain |
| [#396](https://github.com/missingbulb/Shepherd/issues/396) | Q | park:action | canon | 2026-09-02 | Align local pack rules and skills to the writing-pack-prose references convention |
| [#395](https://github.com/missingbulb/Shepherd/issues/395) |  | unlabelled-backlog |  | 2026-09-01 | Fleet: file ad-hoc tasks to align every member's local packs to the writing-pack-prose convention |
| [#352](https://github.com/missingbulb/Shepherd/issues/352) |  | unlabelled-backlog |  | 2026-09-10 | Turn dashboard sign-in on: register the GitHub App, then run deploy-oauth-exchange |
| [#333](https://github.com/missingbulb/Shepherd/issues/333) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#332](https://github.com/missingbulb/Shepherd/issues/332) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#212](https://github.com/missingbulb/Shepherd/issues/212) | Q | park:approval | retired | 2026-08-23 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#169](https://github.com/missingbulb/Shepherd/issues/169) |  | fleet-drift |  | 2026-09-07 | Claudinite mount has fallen behind on missingbulb/vascularcoloring |
| [#137](https://github.com/missingbulb/Shepherd/issues/137) |  | unlabelled-backlog |  | 2026-09-06 | The dashboard's morning-brief panel is off, on the repo that writes the briefs |

## missingbulb/VascularColoring — 13 open (8 queue / 5 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#415](https://github.com/missingbulb/VascularColoring/issues/415) | Q | running-executor | canon | 2026-09-14 | [claudinite-work] claudinite-tasks/usage-fold |
| [#413](https://github.com/missingbulb/VascularColoring/issues/413) | Q | running-agent | canon | 2026-09-14 | [claudinite-work] claudinite-lifecycle/update |
| [#410](https://github.com/missingbulb/VascularColoring/issues/410) | Q | park:failure | canon | 2026-09-13 | [claudinite-work] claudinite-tasks/usage-fold |
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

## missingbulb/ClaudiniteWebsite — 5 open (3 queue / 2 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#534](https://github.com/missingbulb/ClaudiniteWebsite/issues/534) | Q | park:approval | canon | 2026-09-13 | [claudinite-work] claudinite-lifecycle/update |
| [#533](https://github.com/missingbulb/ClaudiniteWebsite/issues/533) |  | unlabelled-backlog |  | 2026-09-13 | git-github-advanced gap: `git rebase --continue`'s default cleanup silently drops commit-message lines starting with `#` |
| [#524](https://github.com/missingbulb/ClaudiniteWebsite/issues/524) | Q | blocked | canon | 2026-09-13 | Retrospective: the site-release task as claudinite.com's only path to production |
| [#316](https://github.com/missingbulb/ClaudiniteWebsite/issues/316) |  | blocked |  | 2026-09-07 | Canon patch (blocked on push scope): dedup-prune-integrity flags the VERSIONS.md row growth-dedup's own task doc mandates |
| [#285](https://github.com/missingbulb/ClaudiniteWebsite/issues/285) | Q | park:decision | retired | 2026-08-26 | Verify in production: the redesigned site with the compounding chart |

## missingbulb/LaughCounter — 3 open (1 queue / 2 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#343](https://github.com/missingbulb/LaughCounter/issues/343) |  | unlabelled-backlog |  | 2026-09-06 | This repo fingerprints the `macos` pack but does not declare it, and its DMG release plumbing is unowned |
| [#174](https://github.com/missingbulb/LaughCounter/issues/174) |  | unlabelled-backlog |  | 2026-09-06 | Distribute LaughCounter via Homebrew Cask (own tap) |
| [#26](https://github.com/missingbulb/LaughCounter/issues/26) | Q | bare-needs-human | retired | 2026-08-17 | [needs-human] Enable Developer ID signing + notarization for the DMG |
