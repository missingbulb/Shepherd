# Fleet triage — 2026-09-10

393 open issues, 17 repos, **167 queue-managed / 226 plain**. Snapshot 2026-09-10T08:56Z.
Fourth run in the series, read against 09-08.

**The finding is that the janitor works.** The 09-08 run said, of the 22 items that had drained
that week, that *"every drained item this run could inspect was cleared by a person, and no
mechanical closure was observed."* That is now corrected: both items sampled this run were closed
by janitor rules, with the rules' own comments on the threads, and between them they drained the
exact backlog the last run flagged as needing a human.

## The correction, with the evidence that overturned it

**[Shepherd#449](https://github.com/missingbulb/Shepherd/issues/449) — rule E, superseded park.**
The item this whole series was built around. Filed 09-04 as a `failure` park on
`shepherd/fleet-issues-snapshot`; called a permanent lane deadlock on 09-05; declared structurally
moot on 09-08. It closed on **2026-09-08T08:51:36Z**, and the closer was the janitor:

> A later run of this task converged clean — #513, on 2026-09-08 — so whatever this item was
> parked on is resolved. Closing it `task:status:rejected` rather than leaving a question nobody
> needs to answer.

That is rule E firing exactly as written, and it is only reachable because of the canon change the
09-08 run identified: under the old occurrence filter no later run could be filed beside a
`failure` park, so no clean run could ever exist to supersede it. The mechanism change and its
effect are now both confirmed in the data.

**[Shepherd#337](https://github.com/missingbulb/Shepherd/issues/337) — rule F, dead pointer.**
Closed three seconds later in the same sweep:

> This item names `basics/improve-comments` at a path it no longer lives at — the pack was renamed
> since the item was filed … An item's stored path is never rewritten, so this one can never run.
> Closing it obsolete; the scheduler files a fresh occurrence at the current path.

That is the R4 cause from this skill's own taxonomy, recognised and cleared by the machine.

## The 15 dead pointers the last run flagged are now zero

09-08 reported 15 open queue items still naming `tidy-repo` tasks that no longer exist in canon —
`tidy-prs` 10, `improve-comments` 4, `tidy-issues` 1 — and recommended a sweep. **`tidy-repo/`
appears in no open issue title anywhere in the fleet today.**

They did not go in one pass. They drained per member, as each member's own janitor ran:

| window | pointers closed | members |
|---|---|---|
| 09-07 → 09-08 | 9 | ClaudiniteCanary, EdFringeNow, hitbut ×4, Shepherd, TLDR, VascularColoring |
| 09-08 → 09-09 | 5 | ClaudiniteCanary, GoogleCalendarEventCreator, MissingBulbWebsite ×2, Shepherd |
| 09-09 → 09-10 | 2 | NoRFinder ×2 |

Staggered per-repo timing is the signature of each member running its own janitor on its own
schedule, not of one fleet-wide sweep or one person's afternoon. No action is needed here.

## The new standing failure: the fleet digest, parking every morning

`shepherd/fleet-repo-digest-email` has crash-parked on three consecutive mornings —
[#514](https://github.com/missingbulb/Shepherd/issues/514) (09-08),
[#526](https://github.com/missingbulb/Shepherd/issues/526) (09-09), with
[#536](https://github.com/missingbulb/Shepherd/issues/536) filed and waiting for the executor
today. Three open items on one lane, and the cause is the same every morning:

> The worker's own verdict: set the repository variable `DIGEST_EMAIL_FROM` …, the repository
> variable `DIGEST_EMAIL_TO` …

Those are two unticked boxes on [#503](https://github.com/missingbulb/Shepherd/issues/503), the
handover the task shipped with — which predicted this exactly: *"parks every night until these
are done."* It is not a defect and needs no investigation; it needs the checklist done.

**What it costs while it waits** is worth stating precisely, because it is a standing rate rather
than a backlog. A `failure` park is superseded only by a *clean* later run, and every later run
fails the same way, so supersession never reaches it. Rule I closes a `failure` park idle over ten
days. One new park a morning against a ten-day drain converges on **about ten open items on this
one lane**, indefinitely, until #503 is finished.

### A canon note this exposes

`code-work.mjs` forces every failed run to `failure` regardless of what the worker asked for, and
says why (missingbulb/Claudinite#1452):

> it does not choose the park, which is `failure` for every failed run (#1452) — a worker that
> could downgrade its own non-zero exit into a non-blocking lane let the task re-file daily against
> a cause nobody had fixed.

The remedy assumed `failure` was the blocking lane. Per the 09-08 run, nothing holds a lane now but
a task's own `last-run-not-failed` precondition, and **that term is declared by zero tasks across
the whole mount** (re-verified at today's HEAD). So the daily re-file #1452 was written to prevent
is precisely what the digest lane does. The rule is inert, and this is the second finding in the
same family as [Claudinite#1891](https://github.com/missingbulb/Claudinite/issues/1891).

### A small, real inconsistency

#503's body twice predicts a `needs-human-action` park. The engine produces `needs-human-failure`,
by the design quoted above. Anyone scanning for an `action` park on this lane will not find one.
One sentence in #503 to fix.

## `isBlockingPark` has one live consumer left, and it is the dashboard

Re-derived from canon at HEAD, as this skill requires each run:

- `isBlockingPark` (`queue/work-item.mjs:180`) — still `failure` only.
- `SUPERSEDABLE_PARKS` (`queue/janitor-rules.mjs:40`) — still `['failure','action']`, with
  `approval` and `decision` excluded on purpose: *"those parks carry content a person still owes an
  answer to … What DOES answer an approval park is that pull request resolving — rule G."*

Grepping every consumer of `isBlockingPark` in the mount returns three sites: its own definition,
rule I's stale comment (already filed as #1891), and **`claudinite-dashboard/model.mjs`**, twice —
`level: isBlockingPark(item) ? 'critical' : 'warning'` and a `blockingPark` flag on the item model.

So the dashboard renders today's **21 `failure` parks as `critical`**, on the strength of a lane
hold the scheduler stopped performing. The dashboard's severity ordering is built on a predicate
with no remaining effect. This belongs with #1891 rather than beside it — same removed mechanism,
second stale reader — and it is the one this run would fix first, because #1891's is a comment and
this one changes what a person sees.

## Cohort shape, four snapshots deep

| | 09-07 | 09-08 | 09-09 | 09-10 |
|---|---|---|---|---|
| open total | 393 | 410 | 396 | 393 |
| queue / plain | 172/221 | 184/226 | 171/225 | 167/226 |
| parks | 115 | 120 | 113 | **112** |
| `failure` | 29 | 29 | 23 | **21** |
| `action` | 21 | 14 | 14 | **14** |
| `decision` | 37 | 36 | 35 | **36** |
| `approval` | 28 | 41 | 41 | **41** |
| retired label generation | 34 | 28 | 26 | **26** |

The two drainable kinds fell (`failure` −8, `action` −7); the two undrainable ones did not. Of the
14 parks filed new since 09-07, **12 are `approval`** — the growth lanes producing pull requests
nobody has merged. `approval` is now the fleet's largest park kind at 41 of 112.

Split by what can ever answer them:

- **`failure` + `action` — 35.** A later clean run clears these. Self-healing, given a working task.
- **`approval` — 41.** Only rule G, and only where the item carries an `Ends-when:` target.
  The snapshot carries no bodies, so this run cannot say how many do; that remains unmeasurable
  from disk and is the strongest argument for adding bodies to the snapshot.
- **`decision` — 36.** In neither set, and rule I is `failure`-only. **No mechanism in canon
  can ever close a `decision` park.** This was the 09-02 headline and it is unchanged four runs
  later; 16 of the 36 still wear retired labels, so they predate the current vocabulary entirely.

By origin: 50 parks `planned` (fungible — a later occurrence answers the lane), 29 `ad-hoc` (by
design excluded from supersession, so a person is the only exit), 33 carrying no origin mark at
all — the retired-generation population, outside both readings.

## `blocked` is two people's plans, not a fleet condition

43 `blocked` items, the largest single queue state, and the count grew again. It decodes to almost
nothing fleet-wide: **all 43 are `task:origin:ad-hoc`**, and they sit in two repos —
Claudinite 31, ShoutsAndWhispers 11, Shepherd 1. They are two decomposed plan chains (Claudinite's
`claudinite-tasks` R0–R5 rewrite, filed 09-07; ShoutsAndWhispers' dev-console and Appetize chain),
which is the shape the rules prescribe for a multi-step plan. Sleeping by design.

The Shepherd one, [#505](https://github.com/missingbulb/Shepherd/issues/505), samples the
mechanism working end to end: claimed by the executor 09-09, run, and returned to blocked by the
worker's own requeue ask — *"It waits until 2026-09-12T09:03:52Z before entering the queue."*
A blocked item is a wake time, not a stall.

## Member liveness — a cut that nearly reported the opposite of the truth

Ranking members by the newest `updated_at` among their **open** items suggests eight of fifteen
have been frozen since the 09-07 sweeps. That reading is wrong, and the way it is wrong is worth
recording: **a closed item leaves the open set and takes its timestamp with it**, so a member that
spent the window *draining* looks identical to one that did nothing. hitbut is the clean
counter-example — newest open timestamp 09-07T09:28, and nine items closed since.

Counting closes, moves and new filings between the 09-07 and 09-10 snapshots instead:

| repo | closed | moved | new |
|---|---|---|---|
| Claudinite | 5 | 9 | 19 |
| Shepherd | 9 | 1 | 9 |
| hitbut | 9 | 0 | 1 |
| ClaudiniteCanary | 8 | 3 | 2 |
| ShoutsAndWhispers | 0 | 16 | 0 |
| EdFringeNow | 1 | 7 | 0 |
| MissingBulbWebsite | 5 | 0 | 2 |
| VascularColoring | 3 | 0 | 6 |
| ClaudiniteWebsite | 0 | 3 | 5 |
| GoogleCalendarEventCreator | 3 | 0 | 1 |
| NoRFinder | 3 | 4 | 0 |
| CrosswordChat | 1 | 0 | 3 |
| LaughCounter | 2 | 0 | 1 |
| TLDR | 1 | 0 | 0 |
| WIP | 0 | 0 | 1 |

Every member moved. **TLDR and WIP moved once each in three days** and are the only two worth a
look; nothing else supports a frozen-member claim. EdFringeNow, which the 09-08 run described as
having a scheduler dead since 08-18, moved seven items on 09-07 — its scheduler runs. What has not
moved is [EdFringeNow#401](https://github.com/missingbulb/EdFringeNow/issues/401) itself, the
`workflow-failure` issue, untouched since 08-18: a stale report of a condition that has since
cleared, not a live outage. **That claim from the 09-08 run is withdrawn.**

## Fleet convergence is red, on two members

- [Shepherd#483](https://github.com/missingbulb/Shepherd/issues/483) — `fleet-baseline` failed
  09-07: *"1 of 3 dispatched member(s) did not reach canon's versions
  (missingbulb/googlecalendareventcreator: did-not-converge)"*. Ad-hoc origin, so supersession will
  never reach it.
- [Shepherd#169](https://github.com/missingbulb/Shepherd/issues/169) — `fleet-drift` open against
  missingbulb/vascularcoloring, last touched 09-07.

Two members named as behind by two independent mechanisms, both records standing since 09-07 with
nothing since. Per the sheepdog rules, the diagnosis is the member's own artifacts — its
declaration, its stamp, the runs on its head sha — and neither has been read.

## Lane duplication and task concentration

56 distinct `[claudinite-work]` lanes carry 93 open items: **22 lanes hold more than one, and 37
items are redundant re-filings**. The concentration is extreme and it is one pack:

| pack/task | items |
|---|---|
| `claudinite-growth/rule-revalidation` | 27 |
| `claudinite-growth/prose-to-checks-sweep` | 24 |
| `claudinite-growth/growth-dedup` | 14 |
| everything else, 16 tasks | 28 |

**Three tasks in one pack are 65 of the 93 open queue items — 70%.** The worst lanes stack four
deep across generations, e.g. EdFringeNow `rule-revalidation` at #440 `decision`/retired, #491
`decision`/retired, #535 `approval`/canon, #629 `approval`/canon: the same question asked four
times, the first two in a vocabulary nothing reads any more. This is a statement about the
`claudinite-growth` pack's cadence, not about eleven repos independently accumulating backlog, and
the fix is one place.

## Plain issues remain the blind half

226 plain issues, of which **178 carry no classifying label at all** (was 182 on 09-08). The label
vocabulary went with `tidy-repo`'s retirement and nothing replaced it, so 79% of the non-queue
backlog cannot be cut by anything but its title. The only labelled groups left are 26 tidy
trackers, 7 `blocked`, 5 `quick-win`, 4 `workflow-failure`, 2 `needs-decision`, 2 plan trackers,
1 `fleet-drift`, 1 schedule board.

Four `workflow-failure` issues stand open — ClaudiniteWebsite#204, EdFringeNow#401, TLDR#93 and
TLDR#94. Two of the four are Chrome Web Store release workflows in TLDR, failing since 07-13 and
untouched since 08-15.

## What is still open

Nothing in this report is acted on; each of these is somebody's explicit call.

1. **Finish [Shepherd#503](https://github.com/missingbulb/Shepherd/issues/503).** It is the only
   item here that is costing something every day, and it is a checklist, not an investigation.
2. **Fix the dashboard's severity model**, which calls 21 parks `critical` on a lane hold that no
   longer happens — filed alongside #1891 or folded into it.
3. **Correct #503's two `needs-human-action` predictions** to `failure`.
4. **Read GoogleCalendarEventCreator's and VascularColoring's own artifacts** and settle #483 and
   #169, or close them as stale.
5. **`decision` — 36 parks with no mechanism that can ever close them**, unchanged across four
   runs. Either a rule reaches them or a person does; nothing else will.
6. **The `claudinite-growth` trio's cadence**, 70% of the open queue and 37 redundant re-filings.
7. **Re-label the plain backlog**, or accept that 178 issues are invisible to every cut but title.
8. **Add issue bodies to the snapshot.** `Ends-when:` and `Blocked-by:` analysis has now been
   impossible for four consecutive runs, and it is what would size the 41 `approval` parks.

---

# Evidence — every open issue, repo by repo
393 open issues across 17 in-scope repos under `missingbulb` (snapshot generated 2026-09-10T08:56:49.246Z).
`Q` = queue-managed. `Gen` = label generation (canon `task:status:*` vs retired `needs-human`/`task:needs-human-*`).

## missingbulb/Claudinite — 130 open (49 queue / 81 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#1904](https://github.com/missingbulb/Claudinite/issues/1904) |  | unlabelled-backlog |  | 2026-09-09 | A forced wake ignores `taskScheduler.disabledTasks` and runs a task the repo turned off |
| [#1892](https://github.com/missingbulb/Claudinite/issues/1892) | Q | park:approval | canon | 2026-09-08 | [claudinite-work] claudinite-canon-curation/growth-promote |
| [#1891](https://github.com/missingbulb/Claudinite/issues/1891) |  | unlabelled-backlog |  | 2026-09-08 | Rule I's rationale cites a lane-hold that planSchedulerRun no longer performs |
| [#1885](https://github.com/missingbulb/Claudinite/issues/1885) |  | unlabelled-backlog |  | 2026-09-07 | Retrospective-lane review: the 0–3 / &gt;5 weekly filing bound reads a heavy-refactor week as overuse |
| [#1884](https://github.com/missingbulb/Claudinite/issues/1884) |  | unlabelled-backlog |  | 2026-09-07 | production-retrospective filing has no dedup guard — #1609 and #1624 duplicate the same subject |
| [#1881](https://github.com/missingbulb/Claudinite/issues/1881) | Q | blocked | canon | 2026-09-07 | Retrospective: the claudinite-tasks reorganization — roles, harness, principles, rewrites, measurement |
| [#1880](https://github.com/missingbulb/Claudinite/issues/1880) | Q | blocked | canon | 2026-09-07 | claudinite-tasks R5: rewrite src/recover/, src/adopt/ and the pack's own tasks to simplify, under frozen contracts and frozen tests |
| [#1879](https://github.com/missingbulb/Claudinite/issues/1879) | Q | blocked | canon | 2026-09-07 | claudinite-tasks R4: rewrite src/session/ and src/deliver/ to simplify, under frozen contracts and frozen tests |
| [#1878](https://github.com/missingbulb/Claudinite/issues/1878) | Q | blocked | canon | 2026-09-07 | claudinite-tasks R3: rewrite src/execute/ to simplify, under frozen contracts and frozen tests |
| [#1877](https://github.com/missingbulb/Claudinite/issues/1877) | Q | blocked | canon | 2026-09-07 | claudinite-tasks R2: rewrite src/schedule/ and src/signals/ to simplify, under frozen contracts and frozen tests |
| [#1876](https://github.com/missingbulb/Claudinite/issues/1876) | Q | blocked | canon | 2026-09-07 | claudinite-tasks R1: rewrite src/contract/ and src/items/ to simplify, under frozen contracts and frozen tests |
| [#1875](https://github.com/missingbulb/Claudinite/issues/1875) | Q | blocked | canon | 2026-09-07 | claudinite-tasks R0: pin every contract before the rewrites — ports, published exports, wire vocabulary, task names, workflow ABI |
| [#1874](https://github.com/missingbulb/Claudinite/issues/1874) | Q | blocked | canon | 2026-09-07 | claudinite-tasks M2: the dashboard's reliability and cost panel for the task machinery |
| [#1873](https://github.com/missingbulb/Claudinite/issues/1873) | Q | blocked | canon | 2026-09-07 | claudinite-tasks V1: this repo's scheduler and executor run green from the queue/ shims after the re-shelve |
| [#1872](https://github.com/missingbulb/Claudinite/issues/1872) | Q | blocked | canon | 2026-09-07 | claudinite-tasks M1: the machinery's own usage file — runs, billed minutes, spend, API calls, outcomes, parks, latencies |
| [#1871](https://github.com/missingbulb/Claudinite/issues/1871) | Q | blocked | canon | 2026-09-07 | claudinite-tasks H2: every scenario runs the real code through the fake world; sim.mjs keeps no model |
| [#1869](https://github.com/missingbulb/Claudinite/issues/1869) |  | unlabelled-backlog |  | 2026-09-07 | Reorganize claudinite-tasks: roles as folders, the simulator as the harness, principles as the spec |
| [#1868](https://github.com/missingbulb/Claudinite/issues/1868) |  | unlabelled-backlog |  | 2026-09-07 | dedup-prune-integrity misfires on any local-pack-confined branch whose commit message says "dedup" |
| [#1861](https://github.com/missingbulb/Claudinite/issues/1861) | Q | park:approval | canon | 2026-09-07 | [claudinite-work] claudinite-canon-curation/growth-promote |
| [#1849](https://github.com/missingbulb/Claudinite/issues/1849) |  | unlabelled-backlog |  | 2026-09-07 | `INCLUDE_DORMANT=true` is a no-op — the scheduler's dormancy gate runs before the forced wake |
| [#1847](https://github.com/missingbulb/Claudinite/issues/1847) |  | unlabelled-backlog |  | 2026-09-07 | claudinite-lifecycle/update's task.md narrates how its PR lands |
| [#1846](https://github.com/missingbulb/Claudinite/issues/1846) |  | unlabelled-backlog |  | 2026-09-07 | Retire the top-level `dormant` tolerance once the fleet has converged onto the pack-entry spelling |
| [#1837](https://github.com/missingbulb/Claudinite/issues/1837) |  | unlabelled-backlog |  | 2026-09-06 | The repo ledger counts a person's close of a park as "no outcome", and flags it bad |
| [#1823](https://github.com/missingbulb/Claudinite/issues/1823) |  | unlabelled-backlog |  | 2026-09-06 | forbidRemovedLinesMatching cannot see a deleted file, so updates-export-removed misses the worst case |
| [#1816](https://github.com/missingbulb/Claudinite/issues/1816) | Q | blocked | canon | 2026-09-06 | Retrospective: the claudinite-tasks pack boundary |
| [#1814](https://github.com/missingbulb/Claudinite/issues/1814) |  | unlabelled-backlog |  | 2026-09-06 | Research: what closing the source and selling Claudinite would take, technically |
| [#1807](https://github.com/missingbulb/Claudinite/issues/1807) | Q | blocked | canon | 2026-09-06 | Retrospective: the stateless scheduler and the task trigger |
| [#1806](https://github.com/missingbulb/Claudinite/issues/1806) |  | unlabelled-backlog |  | 2026-09-06 | Check that a migration record's `version` is above its pack's current version |
| [#1790](https://github.com/missingbulb/Claudinite/issues/1790) | Q | blocked | canon | 2026-09-06 | Verify in production: janitor rule I closes an abandoned failure park |
| [#1789](https://github.com/missingbulb/Claudinite/issues/1789) | Q | blocked | canon | 2026-09-06 | Retire the trigger derivation: a task declaration must state its own `trigger` |
| [#1783](https://github.com/missingbulb/Claudinite/issues/1783) |  | unlabelled-backlog |  | 2026-09-06 | A pack migration record cannot name the version it lands at now that versions are cut on main |
| [#1759](https://github.com/missingbulb/Claudinite/issues/1759) |  | unlabelled-backlog |  | 2026-09-06 | merge-to-main's prompt trigger misses a lowercase "lgtm" |
| [#1749](https://github.com/missingbulb/Claudinite/issues/1749) |  | unlabelled-backlog |  | 2026-09-06 | Move .claudinite-settings.json into .claudinite/ |
| [#1732](https://github.com/missingbulb/Claudinite/issues/1732) | Q | blocked | canon | 2026-09-06 | Retire the frequency door: a task declaration states its cadence as a precondition term |
| [#1725](https://github.com/missingbulb/Claudinite/issues/1725) |  | unlabelled-backlog |  | 2026-09-06 | Scheduling as preconditions: retire `frequency` and the schedule board |
| [#1724](https://github.com/missingbulb/Claudinite/issues/1724) | Q | blocked | canon | 2026-09-05 | Retrospective: the local-pack consolidation and the three packs it promoted |
| [#1720](https://github.com/missingbulb/Claudinite/issues/1720) |  | unlabelled-backlog |  | 2026-09-05 | A merge resolution can silently delete a VERSIONS.md row, and nothing catches it |
| [#1718](https://github.com/missingbulb/Claudinite/issues/1718) | Q | blocked | canon | 2026-09-05 | Retrospective: the executor resolves which pull request a run works on |
| [#1716](https://github.com/missingbulb/Claudinite/issues/1716) | Q | park:decision | canon | 2026-09-07 | Verify in production: the executor amends or supersedes a task's open pull request |
| [#1710](https://github.com/missingbulb/Claudinite/issues/1710) |  | unlabelled-backlog |  | 2026-09-04 | Waking verify-production mints a standing item that can only park |
| [#1704](https://github.com/missingbulb/Claudinite/issues/1704) |  | unlabelled-backlog |  | 2026-09-04 | guardToolCalls needs a session-context predicate — guard a tool in trigger-fired sessions only |
| [#1703](https://github.com/missingbulb/Claudinite/issues/1703) | Q | blocked | canon | 2026-09-06 | Retrospective: the four-moment declared-check mechanism |
| [#1698](https://github.com/missingbulb/Claudinite/issues/1698) | Q | blocked | canon | 2026-09-04 | Retire the target hand-off tolerances: the update worker's own disposal and the generated lane's prefix discovery |
| [#1683](https://github.com/missingbulb/Claudinite/issues/1683) | Q | blocked | canon | 2026-09-09 | Retrospective: barriers folded into basics |
| [#1682](https://github.com/missingbulb/Claudinite/issues/1682) | Q | blocked | canon | 2026-09-04 | Retire the barrier check's legacy read of packConfig.barriers |
| [#1678](https://github.com/missingbulb/Claudinite/issues/1678) |  | unlabelled-backlog |  | 2026-09-04 | Three defects bootstrap.md's fast path hit on a fresh adoption (codeload 403, retired endpoints key, a "rebuild" step that doesn't exist) |
| [#1672](https://github.com/missingbulb/Claudinite/issues/1672) |  | unlabelled-backlog |  | 2026-09-04 | Declarative checks: categorize every corpus rule, and design the mechanism additions (two-pass derive→assert, declarative work/action scope, deterministic skill triggers) |
| [#1670](https://github.com/missingbulb/Claudinite/issues/1670) |  | unlabelled-backlog |  | 2026-09-03 | The executor cannot read CLAUDINITE_TASKS_SUSPEND_ALL live (403), so a mid-run hold never reaches a running drain |
| [#1669](https://github.com/missingbulb/Claudinite/issues/1669) |  | unlabelled-backlog |  | 2026-09-03 | Update apply-stage agents park on an `action_required` conformance run instead of dispatching it on the head sha |
| [#1668](https://github.com/missingbulb/Claudinite/issues/1668) |  | unlabelled-backlog |  | 2026-09-03 | Path-scoped skill guard reads the parent transcript, so a subagent's skill loads never count |
| [#1644](https://github.com/missingbulb/Claudinite/issues/1644) |  | unlabelled-backlog |  | 2026-09-03 | Three packs' RULES.md are manuals: research-project, spec-driven-product, executable-requirements |
| [#1643](https://github.com/missingbulb/Claudinite/issues/1643) | Q | blocked | canon | 2026-09-03 | Retire the remaining scattered legacy residues |
| [#1642](https://github.com/missingbulb/Claudinite/issues/1642) | Q | blocked | canon | 2026-09-04 | Retire the task contract and queue vocabulary legacy tolerances |
| [#1641](https://github.com/missingbulb/Claudinite/issues/1641) | Q | blocked | canon | 2026-09-03 | Retire the renamed and absorbed pack id tolerances |
| [#1640](https://github.com/missingbulb/Claudinite/issues/1640) | Q | blocked | canon | 2026-09-03 | Retire the member declaration and stamp legacy shapes |
| [#1638](https://github.com/missingbulb/Claudinite/issues/1638) |  | unlabelled-backlog |  | 2026-09-03 | Retire Claudinite's live legacy tolerances |
| [#1633](https://github.com/missingbulb/Claudinite/issues/1633) |  | unlabelled-backlog |  | 2026-09-03 | Task declarations move from task.mjs to task.json |
| [#1624](https://github.com/missingbulb/Claudinite/issues/1624) | Q | blocked | canon | 2026-09-02 | Retrospective: the dashboard redesign, a week in production |
| [#1617](https://github.com/missingbulb/Claudinite/issues/1617) |  | unlabelled-backlog |  | 2026-09-04 | Retire the legacy precondition() function form — one mechanism, engine cleaned |
| [#1609](https://github.com/missingbulb/Claudinite/issues/1609) | Q | blocked | canon | 2026-09-02 | Retrospective: the dashboard redesign, a week in production |
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
| [#1347](https://github.com/missingbulb/Claudinite/issues/1347) | Q | blocked | canon | 2026-09-09 | Merge the dispatch simulator into the scheduler codebase — the sim becomes a test harness |
| [#1346](https://github.com/missingbulb/Claudinite/issues/1346) | Q | blocked | none | 2026-09-09 | Move taskScheduler from a top-level settings key into the claudinite-tasks pack's own config |
| [#1341](https://github.com/missingbulb/Claudinite/issues/1341) |  | unlabelled-backlog |  | 2026-08-24 | Eliminate the task-janitor: fold its recovery into the scheduler run, its visibility into the dashboard |
| [#1333](https://github.com/missingbulb/Claudinite/issues/1333) |  | unlabelled-backlog |  | 2026-09-06 | claudinite-canary-repo: the withhold lane it probes no longer exists |
| [#1317](https://github.com/missingbulb/Claudinite/issues/1317) |  | unlabelled-backlog |  | 2026-09-06 | Extract the task execution/scheduling surface into a claudinite-tasks pack |
| [#1313](https://github.com/missingbulb/Claudinite/issues/1313) |  | unlabelled-backlog |  | 2026-09-06 | Gate packs/* against .claudinite/local in the barriers config |
| [#1295](https://github.com/missingbulb/Claudinite/issues/1295) |  | unlabelled-backlog |  | 2026-09-06 | A member whose Actions jobs cannot start has no escalation path — report-failure dies with everything else |
| [#1275](https://github.com/missingbulb/Claudinite/issues/1275) | Q | park:approval | retired | 2026-08-23 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#1274](https://github.com/missingbulb/Claudinite/issues/1274) | Q | park:approval | retired | 2026-08-23 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#1264](https://github.com/missingbulb/Claudinite/issues/1264) |  | unlabelled-backlog |  | 2026-09-06 | Delete the two-name settings-file tolerance once no member carries .claudinite-checks.json |
| [#1237](https://github.com/missingbulb/Claudinite/issues/1237) | Q | blocked | none | 2026-09-09 | Chain 3/3: retire the twice-daily-cron migration tolerances |
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

## missingbulb/ClaudiniteWebsite — 37 open (14 queue / 23 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#460](https://github.com/missingbulb/ClaudiniteWebsite/issues/460) |  | quick-win |  | 2026-09-08 | site-stats still declares the retired outcome ceiling `pr` |
| [#459](https://github.com/missingbulb/ClaudiniteWebsite/issues/459) |  | unlabelled-backlog |  | 2026-09-08 | Set up the Cloudflare side so claudinite.com can be released |
| [#457](https://github.com/missingbulb/ClaudiniteWebsite/issues/457) |  | unlabelled-backlog |  | 2026-09-08 | Host claudinite.com on Cloudflare, and make the release a Claudinite task |
| [#456](https://github.com/missingbulb/ClaudiniteWebsite/issues/456) |  | blocked |  | 2026-09-08 | Canon patch: learning-a-technology skill for packs/claudinite-growth |
| [#454](https://github.com/missingbulb/ClaudiniteWebsite/issues/454) |  | unlabelled-backlog |  | 2026-09-08 | Skill: learning a technology — research-backed portable technology skills beside project tasks |
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
| [#260](https://github.com/missingbulb/ClaudiniteWebsite/issues/260) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] product-wiki/wiki-growth |
| [#255](https://github.com/missingbulb/ClaudiniteWebsite/issues/255) | Q | park:decision | retired | 2026-09-06 | Verify in production: reframed site live at claudinite.com |
| [#244](https://github.com/missingbulb/ClaudiniteWebsite/issues/244) | Q | park:decision | retired | 2026-08-24 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#241](https://github.com/missingbulb/ClaudiniteWebsite/issues/241) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-extract |
| [#239](https://github.com/missingbulb/ClaudiniteWebsite/issues/239) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-dedup |
| [#204](https://github.com/missingbulb/ClaudiniteWebsite/issues/204) |  | workflow-failure |  | 2026-09-06 | Claudinite scheduler run failed |
| [#192](https://github.com/missingbulb/ClaudiniteWebsite/issues/192) |  | unlabelled-backlog |  | 2026-09-06 | Vendored queue engine: invoke.mjs points at a missing instructions.md (and prose-to-checks skill's DESIGN.md link is also dead) |
| [#185](https://github.com/missingbulb/ClaudiniteWebsite/issues/185) | Q | park:approval | canon | 2026-09-07 | Add packs: suspected from this repo’s shape |
| [#77](https://github.com/missingbulb/ClaudiniteWebsite/issues/77) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Tidy Branches |
| [#62](https://github.com/missingbulb/ClaudiniteWebsite/issues/62) |  | unlabelled-backlog |  | 2026-09-06 | One-time GitHub settings for the static-site release pipeline |
| [#60](https://github.com/missingbulb/ClaudiniteWebsite/issues/60) |  | unlabelled-backlog |  | 2026-09-06 | Adopt the static-website pack — replace the hand-rolled deploy and version bump |
| [#59](https://github.com/missingbulb/ClaudiniteWebsite/issues/59) |  | unlabelled-backlog |  | 2026-09-06 | Canon patch (blocked on push scope): executor-routine fixes for #53–#57 |
| [#57](https://github.com/missingbulb/ClaudiniteWebsite/issues/57) |  | unlabelled-backlog |  | 2026-09-06 | comment-classification fires on routine triggers, which are not owner comments |
| [#55](https://github.com/missingbulb/ClaudiniteWebsite/issues/55) |  | unlabelled-backlog |  | 2026-09-06 | task-lifecycle's remedy tells the agent to amend an already-pushed commit |
| [#54](https://github.com/missingbulb/ClaudiniteWebsite/issues/54) |  | unlabelled-backlog |  | 2026-09-06 | resolve-dispatch exit 13 renders as a failed command when it is the normal handshake |
| [#53](https://github.com/missingbulb/ClaudiniteWebsite/issues/53) |  | unlabelled-backlog |  | 2026-09-06 | task-lifecycle fires on the scheduler's maintenance branch, which can never satisfy it |
| [#44](https://github.com/missingbulb/ClaudiniteWebsite/issues/44) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Product Wiki Growth |

## missingbulb/GoogleCalendarEventCreator — 33 open (12 queue / 21 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#1188](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1188) | Q | park:approval | canon | 2026-09-07 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#1168](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1168) | Q | park:approval | canon | 2026-09-06 | [claudinite-work] claudinite-growth/growth-dedup |
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
| [#979](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/979) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
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

## missingbulb/MissingBulbWebsite — 21 open (10 queue / 11 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
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
| [#207](https://github.com/missingbulb/MissingBulbWebsite/issues/207) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#203](https://github.com/missingbulb/MissingBulbWebsite/issues/203) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-dedup |
| [#169](https://github.com/missingbulb/MissingBulbWebsite/issues/169) |  | unlabelled-backlog |  | 2026-08-17 | core pack required by basics but never materialized in .claudinite-checks.json |
| [#60](https://github.com/missingbulb/MissingBulbWebsite/issues/60) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Product Wiki Growth |
| [#55](https://github.com/missingbulb/MissingBulbWebsite/issues/55) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Tidy Branches |
| [#54](https://github.com/missingbulb/MissingBulbWebsite/issues/54) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Growth Dedup |
| [#51](https://github.com/missingbulb/MissingBulbWebsite/issues/51) |  | tidy-tracker |  | 2026-08-09 | Claudinite tracker: Tidy PRs |
| [#40](https://github.com/missingbulb/MissingBulbWebsite/issues/40) |  | unlabelled-backlog |  | 2026-09-06 | One-time GitHub settings for the static-site release pipeline |
| [#38](https://github.com/missingbulb/MissingBulbWebsite/issues/38) |  | unlabelled-backlog |  | 2026-08-15 | Adopt the static-website pack — replace the hand-rolled deploy and version bump |
| [#28](https://github.com/missingbulb/MissingBulbWebsite/issues/28) |  | tidy-tracker |  | 2026-08-15 | Claudinite tracker: Tidy Issues |

## missingbulb/Shepherd — 21 open (14 queue / 7 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#536](https://github.com/missingbulb/Shepherd/issues/536) | Q | waiting-for-executor | canon | 2026-09-10 | [claudinite-work] shepherd/fleet-repo-digest-email |
| [#535](https://github.com/missingbulb/Shepherd/issues/535) | Q | running-executor | canon | 2026-09-10 | [claudinite-work] shepherd/fleet-issues-snapshot |
| [#533](https://github.com/missingbulb/Shepherd/issues/533) | Q | waiting-for-executor | canon | 2026-09-10 | [claudinite-work] claudinite-tasks/task-janitor |
| [#530](https://github.com/missingbulb/Shepherd/issues/530) | Q | waiting-for-executor | canon | 2026-09-10 | [claudinite-work] claudinite-fleet-sheepdog/fleet-roster |
| [#529](https://github.com/missingbulb/Shepherd/issues/529) | Q | waiting-for-executor | canon | 2026-09-10 | [claudinite-work] claudinite-fleet-sheepdog/fleet-pack-seeds |
| [#526](https://github.com/missingbulb/Shepherd/issues/526) | Q | park:failure | canon | 2026-09-09 | [claudinite-work] shepherd/fleet-repo-digest-email |
| [#514](https://github.com/missingbulb/Shepherd/issues/514) | Q | park:failure | canon | 2026-09-08 | [claudinite-work] shepherd/fleet-repo-digest-email |
| [#505](https://github.com/missingbulb/Shepherd/issues/505) | Q | blocked | canon | 2026-09-09 | Verify in production: the morning fleet digest actually sends |
| [#503](https://github.com/missingbulb/Shepherd/issues/503) |  | unlabelled-backlog |  | 2026-09-07 | Hand-over: the Cloudflare setup the morning fleet digest needs |
| [#483](https://github.com/missingbulb/Shepherd/issues/483) | Q | park:failure | canon | 2026-09-07 | [claudinite-work] claudinite-fleet-sheepdog/fleet-baseline |
| [#480](https://github.com/missingbulb/Shepherd/issues/480) |  | unlabelled-backlog |  | 2026-09-06 | Delete the retired tidy-issues label definitions across the fleet |
| [#441](https://github.com/missingbulb/Shepherd/issues/441) | Q | running-agent | canon | 2026-09-10 | Retrospective: dashboard Sign in with GitHub |
| [#420](https://github.com/missingbulb/Shepherd/issues/420) |  | unlabelled-backlog |  | 2026-09-02 | Fleet triage 2026-09-02: 53% of parks sit in a kind no rule can drain |
| [#396](https://github.com/missingbulb/Shepherd/issues/396) | Q | park:action | canon | 2026-09-02 | Align local pack rules and skills to the writing-pack-prose references convention |
| [#395](https://github.com/missingbulb/Shepherd/issues/395) |  | unlabelled-backlog |  | 2026-09-01 | Fleet: file ad-hoc tasks to align every member's local packs to the writing-pack-prose convention |
| [#333](https://github.com/missingbulb/Shepherd/issues/333) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#332](https://github.com/missingbulb/Shepherd/issues/332) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#212](https://github.com/missingbulb/Shepherd/issues/212) | Q | park:approval | retired | 2026-08-23 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#169](https://github.com/missingbulb/Shepherd/issues/169) |  | fleet-drift |  | 2026-09-07 | Claudinite mount has fallen behind on missingbulb/vascularcoloring |
| [#137](https://github.com/missingbulb/Shepherd/issues/137) |  | unlabelled-backlog |  | 2026-09-06 | The dashboard's morning-brief panel is off, on the repo that writes the briefs |
| [#3](https://github.com/missingbulb/Shepherd/issues/3) |  | unlabelled-backlog |  | 2026-08-19 | Claudinite adoption: the setup steps only a human can do |

## missingbulb/EdFringeNow — 20 open (8 queue / 12 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#629](https://github.com/missingbulb/EdFringeNow/issues/629) | Q | park:approval | canon | 2026-09-06 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#615](https://github.com/missingbulb/EdFringeNow/issues/615) |  | unlabelled-backlog |  | 2026-09-04 | ui-requirements goldens flap: the same tree fails different cases run to run |
| [#610](https://github.com/missingbulb/EdFringeNow/issues/610) |  | unlabelled-backlog |  | 2026-09-04 | UX research services: what's available, what they cost, and a case for a claudinite pack |
| [#575](https://github.com/missingbulb/EdFringeNow/issues/575) | Q | park:action | canon | 2026-09-02 | Align local pack rules and skills to the writing-pack-prose references convention |
| [#535](https://github.com/missingbulb/EdFringeNow/issues/535) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#532](https://github.com/missingbulb/EdFringeNow/issues/532) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/growth-dedup |
| [#491](https://github.com/missingbulb/EdFringeNow/issues/491) | Q | park:decision | retired | 2026-08-24 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#440](https://github.com/missingbulb/EdFringeNow/issues/440) | Q | park:decision | retired | 2026-08-24 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#439](https://github.com/missingbulb/EdFringeNow/issues/439) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#401](https://github.com/missingbulb/EdFringeNow/issues/401) |  | workflow-failure |  | 2026-08-18 | Claudinite scheduler run failed |
| [#382](https://github.com/missingbulb/EdFringeNow/issues/382) | Q | park:approval | canon | 2026-09-07 | Add packs: suspected from this repo’s shape |
| [#314](https://github.com/missingbulb/EdFringeNow/issues/314) |  | unlabelled-backlog |  | 2026-08-09 | Replace per-file cache TTLs with a published manifest |
| [#295](https://github.com/missingbulb/EdFringeNow/issues/295) |  | needs-decision |  | 2026-09-07 | The site lists shows edfringe has withdrawn — nothing removes them from the master |
| [#294](https://github.com/missingbulb/EdFringeNow/issues/294) |  | needs-decision |  | 2026-09-07 | Prices exclude the booking fee edfringe advertises — and the recorded `fee` is wrong |
| [#237](https://github.com/missingbulb/EdFringeNow/issues/237) |  | unlabelled-backlog |  | 2026-08-17 | Upstream: baselining's deliver() leaves the scheduler checkout on its maintenance branch |
| [#223](https://github.com/missingbulb/EdFringeNow/issues/223) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Product Wiki Growth |
| [#164](https://github.com/missingbulb/EdFringeNow/issues/164) |  | quick-win |  | 2026-09-07 | Monetization: join Booking.com + Omio and paste the IDs into shared/affiliates.js |
| [#161](https://github.com/missingbulb/EdFringeNow/issues/161) |  | quick-win |  | 2026-09-07 | Monetization: join the 4 affiliate programmes and paste the IDs into js/places.js |
| [#143](https://github.com/missingbulb/EdFringeNow/issues/143) |  | tidy-tracker |  | 2026-09-07 | Claudinite tracker: Tidy Issues |
| [#70](https://github.com/missingbulb/EdFringeNow/issues/70) |  | quick-win |  | 2026-09-07 | Re-paste the Claudinite environment Setup script |

## missingbulb/hitbut — 20 open (8 queue / 12 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#236](https://github.com/missingbulb/hitbut/issues/236) | Q | park:approval | canon | 2026-09-07 | Add packs: suspected from this repo’s shape |
| [#220](https://github.com/missingbulb/hitbut/issues/220) |  | unlabelled-backlog |  | 2026-09-06 | Adopt canon pack: cloudflare-workers |
| [#213](https://github.com/missingbulb/hitbut/issues/213) |  | unlabelled-backlog |  | 2026-09-04 | fetch-samples delivers nothing: git collapses the untracked payload directory |
| [#212](https://github.com/missingbulb/hitbut/issues/212) | Q | park:failure | canon | 2026-09-04 | [claudinite-work] hitbut/fetch-samples |
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

## missingbulb/TLDR — 19 open (5 queue / 14 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
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

## missingbulb/ShoutsAndWhispers — 17 open (12 queue / 5 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#395](https://github.com/missingbulb/ShoutsAndWhispers/issues/395) | Q | blocked | canon | 2026-09-09 | Generate and commit the dev Firebase client config |
| [#394](https://github.com/missingbulb/ShoutsAndWhispers/issues/394) | Q | blocked | canon | 2026-09-09 | Retrospective: the dev console and the Appetize preview, one week on |
| [#393](https://github.com/missingbulb/ShoutsAndWhispers/issues/393) |  | blocked |  | 2026-09-07 | Confirm the Appetize preview is usable end to end |
| [#392](https://github.com/missingbulb/ShoutsAndWhispers/issues/392) | Q | blocked | canon | 2026-09-09 | Upload the preview to Appetize and document the link |
| [#391](https://github.com/missingbulb/ShoutsAndWhispers/issues/391) | Q | blocked | canon | 2026-09-09 | Android build wiring and the Appetize preview workflow |
| [#390](https://github.com/missingbulb/ShoutsAndWhispers/issues/390) | Q | blocked | canon | 2026-09-09 | Email/password sign-in path in the app |
| [#389](https://github.com/missingbulb/ShoutsAndWhispers/issues/389) |  | blocked |  | 2026-09-07 | Validation gate: drive the dev console and confirm it works |
| [#388](https://github.com/missingbulb/ShoutsAndWhispers/issues/388) | Q | blocked | canon | 2026-09-09 | Deploy the dev backend and the console, and post the URL |
| [#387](https://github.com/missingbulb/ShoutsAndWhispers/issues/387) | Q | blocked | canon | 2026-09-09 | Deploy workflow for the dev project, and Hosting for the console |
| [#386](https://github.com/missingbulb/ShoutsAndWhispers/issues/386) | Q | blocked | canon | 2026-09-09 | Compressed replay against the emulator suite |
| [#385](https://github.com/missingbulb/ShoutsAndWhispers/issues/385) | Q | blocked | canon | 2026-09-09 | Console replay engine and observation views, real-time against dev |
| [#384](https://github.com/missingbulb/ShoutsAndWhispers/issues/384) | Q | blocked | canon | 2026-09-09 | Dev console package: plan model, plan editor, and its requirements suite |
| [#383](https://github.com/missingbulb/ShoutsAndWhispers/issues/383) | Q | blocked | canon | 2026-09-09 | Sim-time wire contract and the four guards that keep it out of production |
| [#382](https://github.com/missingbulb/ShoutsAndWhispers/issues/382) |  | unlabelled-backlog |  | 2026-09-06 | Console and secret setup for the dev console and the Appetize preview |
| [#379](https://github.com/missingbulb/ShoutsAndWhispers/issues/379) |  | blocked |  | 2026-09-07 | Dev console for scripted sim accounts, then the Appetize preview |
| [#344](https://github.com/missingbulb/ShoutsAndWhispers/issues/344) | Q | park:decision | canon | 2026-09-07 | Align local pack rules and skills to the writing-pack-prose references convention |
| [#99](https://github.com/missingbulb/ShoutsAndWhispers/issues/99) |  | blocked |  | 2026-09-07 | Get the app running on Appetize.io (browser-based device preview) |

## missingbulb/ClaudiniteCanary — 15 open (7 queue / 8 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#389](https://github.com/missingbulb/ClaudiniteCanary/issues/389) | Q | running-executor | canon | 2026-09-10 | [claudinite-work] claudinite-tasks/usage-fold |
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
| [#41](https://github.com/missingbulb/ClaudiniteCanary/issues/41) |  | tidy-tracker |  | 2026-09-07 | Claudinite tracker: Prose to Checks |
| [#39](https://github.com/missingbulb/ClaudiniteCanary/issues/39) |  | tidy-tracker |  | 2026-08-30 | Claudinite tracker: Tidy PRs |

## missingbulb/VascularColoring — 15 open (10 queue / 5 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#388](https://github.com/missingbulb/VascularColoring/issues/388) | Q | waiting-for-executor | canon | 2026-09-10 | [claudinite-work] claudinite-tasks/usage-fold |
| [#387](https://github.com/missingbulb/VascularColoring/issues/387) | Q | running-executor | canon | 2026-09-10 | [claudinite-work] claudinite-tasks/task-janitor |
| [#386](https://github.com/missingbulb/VascularColoring/issues/386) | Q | waiting-for-executor | canon | 2026-09-10 | [claudinite-work] claudinite-lifecycle/update |
| [#375](https://github.com/missingbulb/VascularColoring/issues/375) |  | unlabelled-backlog |  | 2026-09-07 | README pack-badge block links to two undeclared packs |
| [#370](https://github.com/missingbulb/VascularColoring/issues/370) | Q | park:approval | canon | 2026-09-07 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#369](https://github.com/missingbulb/VascularColoring/issues/369) | Q | park:approval | canon | 2026-09-07 | [claudinite-work] claudinite-growth/growth-dedup |
| [#361](https://github.com/missingbulb/VascularColoring/issues/361) |  | unlabelled-backlog |  | 2026-09-06 | Dangling README badge link: .claudinite/shared/packs/barriers/badge.svg |
| [#294](https://github.com/missingbulb/VascularColoring/issues/294) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#258](https://github.com/missingbulb/VascularColoring/issues/258) | Q | park:approval | retired | 2026-08-24 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#158](https://github.com/missingbulb/VascularColoring/issues/158) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#156](https://github.com/missingbulb/VascularColoring/issues/156) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-extract |
| [#154](https://github.com/missingbulb/VascularColoring/issues/154) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-dedup |
| [#86](https://github.com/missingbulb/VascularColoring/issues/86) |  | tidy-tracker |  | 2026-08-23 | Claudinite tracker: Tidy Branches |
| [#85](https://github.com/missingbulb/VascularColoring/issues/85) |  | tidy-tracker |  | 2026-08-23 | Claudinite tracker: Tidy PRs |
| [#8](https://github.com/missingbulb/VascularColoring/issues/8) |  | unlabelled-backlog |  | 2026-09-06 | Re-paste the Claudinite environment Setup script |

## missingbulb/CrosswordChat — 13 open (5 queue / 8 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#421](https://github.com/missingbulb/CrosswordChat/issues/421) |  | unlabelled-backlog |  | 2026-09-07 | ci-performance worker.mjs: unpaginated top-100 fetch starves the previous-window sample for low-frequency workflows |
| [#419](https://github.com/missingbulb/CrosswordChat/issues/419) | Q | park:approval | canon | 2026-09-07 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#418](https://github.com/missingbulb/CrosswordChat/issues/418) | Q | park:approval | canon | 2026-09-07 | [claudinite-work] claudinite-growth/growth-dedup |
| [#352](https://github.com/missingbulb/CrosswordChat/issues/352) |  | unlabelled-backlog |  | 2026-08-30 | Chrome Web Store release pipeline is a generation behind the chrome-extension pack |
| [#304](https://github.com/missingbulb/CrosswordChat/issues/304) |  | unlabelled-backlog |  | 2026-08-23 | Connect the Claude GitHub App: converge-item.mjs can't reach the GitHub API from a dispatched session |
| [#303](https://github.com/missingbulb/CrosswordChat/issues/303) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#256](https://github.com/missingbulb/CrosswordChat/issues/256) | Q | park:decision | retired | 2026-08-23 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#252](https://github.com/missingbulb/CrosswordChat/issues/252) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-dedup |
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

## missingbulb/LaughCounter — 5 open (3 queue / 2 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#422](https://github.com/missingbulb/LaughCounter/issues/422) | Q | park:approval | canon | 2026-09-07 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#343](https://github.com/missingbulb/LaughCounter/issues/343) |  | unlabelled-backlog |  | 2026-09-06 | This repo fingerprints the `macos` pack but does not declare it, and its DMG release plumbing is unowned |
| [#239](https://github.com/missingbulb/LaughCounter/issues/239) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#174](https://github.com/missingbulb/LaughCounter/issues/174) |  | unlabelled-backlog |  | 2026-09-06 | Distribute LaughCounter via Homebrew Cask (own tap) |
| [#26](https://github.com/missingbulb/LaughCounter/issues/26) | Q | bare-needs-human | retired | 2026-08-17 | [needs-human] Enable Developer ID signing + notarization for the DMG |

## missingbulb/gRatio — 0 open (0 queue / 0 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|

## missingbulb/HelloWorldFlutterApp — 0 open (0 queue / 0 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
