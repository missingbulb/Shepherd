# Fleet triage — 2026-09-08

393 open issues, 17 repos, **172 queue-managed / 221 plain**. Snapshot 2026-09-07T09:18Z.
Third run in the series, read against 09-05.

**The finding is that this series' headline metric no longer exists.** Canon changed the
mechanism underneath it, and the 09-05 report's central claim is now void — not because it was
wrong then, but because the thing it described has been removed.

## The deadlock is gone: parks no longer hold lanes

The 09-05 run argued, and demonstrated, that a `failure` park blocks its task's lane and that
supersession can therefore never reach it. That was true of the canon of that day: the
occurrence filter kept a blocking park in the live set.

At HEAD it reads:

```js
.filter((i) => i.state === 'open' && !closedByThisRun.has(i.number) && live(i))
```

with the rationale stated beside it: *"A PARKED item is not live … whether it holds the task is
the task's own declaration (`last-run-not-failed`), never the engine's: absent that term the
next occurrence is filed beside the park."* And `calendar.mjs` is blunter still — *"nothing
holds a task's lane but its own `last-run-not-failed`."*

**No task declares that term.** Zero, across the whole mount, canon and local. So no park in
this fleet holds a lane, and the **244 missed runs** the last two runs tracked is now
structurally **zero**. That metric should not be carried forward.

It is confirmed in the data, not just the code: Shepherd#449 is *still* open and still parked
`failure`, untouched since 09-04 — and Shepherd#500, a fresh occurrence of the same lane, was
filed and converged `done` on 09-07 right beside it. The snapshot this report runs on is that
occurrence's output.

**So the 09-05 report's closing item — "Shepherd#449 needs clearing by hand or the lane stays
frozen" — is withdrawn.** The lane recovered without it. #449 is now a stale record, not a
blocker.

## What actually drained, and by whose hand

Comparing the 09-03 and 09-07 snapshots item by item:

| | |
|---|---|
| parks 09-03 | 129 |
| parks 09-07 | 117 |
| drained | **22** |
| newly parked | 10 |
| kind changed on a carried park | 0 |

Ten of the 36 `failure` parks the last run called permanently deadlocked are gone.

**But the drainage is not the machinery.** Both drained items sampled were closed *by hand by
the owner*: Shepherd#411 (*"Woken by hand — cleared `Not-before` and returned this item to the
queue"*) and Shepherd#338 (*"Closing this by hand, on the owner's call"*). Two of 22 is a small
sample and the rest are in repos this session cannot read — so the honest statement is that
**every drained item this run could inspect was cleared by a person**, and no mechanical
closure was observed. Do not read 22 as the janitor working.

## Rule I landed — and its stated premise is already stale

A new janitor rule (`abandonedParkItems`, missingbulb/Claudinite#1785) closes a standing
`failure` park idle over 10 days. Its header says a `failure` park *"HOLDS THE TASK'S LANE
(`isBlockingPark`, honoured in `planSchedulerRun` job 1)"* — which, per the section above, job 1
no longer does. **Canon carries a rule whose rationale contradicts the scheduler it cites.**
The rule still does useful work (a month-old trace is replaced by a fresh one); only its reason
is out of date.

Two consequences worth naming:

- **Rule I is `failure`-only**, so the ~32 `decision` parks the 09-05 run identified as
  mislabelled dead-agent reclaims are outside its reach. The owner's own comment on Shepherd#338
  says exactly this — *"the new janitor rule that closes an abandoned `failure` park after ten
  days is failure-only — so it will never reach this item. That is why this one is closed by
  hand rather than swept."* That is independent confirmation of the 09-05 mislabel finding, and
  of the gap it left.
- `isBlockingPark` is still exported and still referenced, but nothing in the scheduler honours
  it. It is now a predicate with no consumer in the path its comments describe.

## tidy-repo was retired, and took the fleet's issue labelling with it

`tidy-repo` no longer appears in the canon pack catalog at all; `improve-comments` moved to
`basics`. Two effects:

**15 open queue items still name its tasks** — `tidy-prs` 10, `improve-comments` 4,
`tidy-issues` 1 — across many repos. These are dead pointers: rule F's set, asking people about
work that can never run.

**The plain-issue picture went blind.** `unlabelled-backlog` jumped 69 → **182** while the plain
total barely moved (216 → 221). The `quick-win` / `needs-decision` / `blocked` buckets are now
empty, because the tidy-issues label definitions were deleted fleet-wide (Shepherd#480). Roughly
113 issues lost their triage labels. The backlog did not grow; the fleet stopped describing it.

**A near-miss worth recording:** `product-wiki` is absent from Shepherd's mount too, and the
same reasoning would have called its 8 `wiki-growth` items orphans. It is still in the canon
catalog — Shepherd simply does not declare it. A mount holds only what its repo declares, so
absence from the mount is never evidence of retirement. The catalog is the only place that
answers this, and it was checked for both.

## What grew

+27 issues. The queue's +26 is mostly **`blocked` 9 → 34** and `no-status` 4 → 10 — and, as in
the 09-05 run, this is the migration and verification machinery sleeping on `Not-before`, not
backlog. `NoRFinder` is now in the snapshot with 12 open issues: the member the 09-05 run
flagged as invisible while the collector was frozen has been picked up, as predicted.

Task concentration is unchanged and still the real backlog shape: `rule-revalidation` 30,
`prose-to-checks-sweep` 22, `growth-dedup` 11, `growth-extract` 9 — 72 of 112 items on
`[claudinite-work]` lanes, all in one pack.

## Unchanged from both prior runs

- **EdFringeNow#401** still reports its scheduler dead — **since 2026-08-18, now three weeks**.
  Every count for that member describes a queue nothing has swept. ClaudiniteWebsite#204 has at
  least been touched (09-06).
- The `decision`/`approval` kinds still drain through no rule of their own
  (missingbulb/Claudinite#1538); rule I does not cover them.
- 36 items still wear the retired label generation.

## Recommendations

1. **Retire the missed-runs metric** from this series — it measures a mechanism that no longer
   exists. Lane cost is now zero by construction until some task declares `last-run-not-failed`.
2. **Fix rule I's rationale** in canon, or restore what it claims. A rule justified by a
   behaviour the cited code no longer has will mislead the next reader of either file.
3. **Sweep the 15 tidy-repo dead pointers** — rule F's premise matches them exactly.
4. **Decide what replaces the triage labels**, or accept that 182 plain issues are now
   undifferentiated.
5. **Chase EdFringeNow#401** before trusting any number reported for that member.
6. Close or re-queue Shepherd#449 as tidying, not as recovery — it blocks nothing.

---
# Fleet triage — every open issue, 2026-09-07

393 open issues across 17 in-scope repos under `missingbulb` (snapshot generated 2026-09-07T09:18:01.056Z).
`Q` = queue-managed. `Gen` = label generation (canon `task:status:*` vs retired `needs-human`/`task:needs-human-*`).


## missingbulb/Claudinite — 116 open (37 queue / 79 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#1858](https://github.com/missingbulb/Claudinite/issues/1858) |  | unlabelled-backlog |  | 2026-09-07 | A migration record that rewrites member task declarations ships no apply stage |
| [#1849](https://github.com/missingbulb/Claudinite/issues/1849) |  | unlabelled-backlog |  | 2026-09-07 | `INCLUDE_DORMANT=true` is a no-op — the scheduler's dormancy gate runs before the forced wake |
| [#1847](https://github.com/missingbulb/Claudinite/issues/1847) |  | unlabelled-backlog |  | 2026-09-07 | claudinite-lifecycle/update's task.md narrates how its PR lands |
| [#1846](https://github.com/missingbulb/Claudinite/issues/1846) |  | unlabelled-backlog |  | 2026-09-07 | Retire the top-level `dormant` tolerance once the fleet has converged onto the pack-entry spelling |
| [#1837](https://github.com/missingbulb/Claudinite/issues/1837) |  | unlabelled-backlog |  | 2026-09-06 | The repo ledger counts a person's close of a park as "no outcome", and flags it bad |
| [#1823](https://github.com/missingbulb/Claudinite/issues/1823) |  | unlabelled-backlog |  | 2026-09-06 | forbidRemovedLinesMatching cannot see a deleted file, so updates-export-removed misses the worst case |
| [#1816](https://github.com/missingbulb/Claudinite/issues/1816) | Q | blocked | canon | 2026-09-06 | Retrospective: the claudinite-tasks pack boundary |
| [#1814](https://github.com/missingbulb/Claudinite/issues/1814) |  | unlabelled-backlog |  | 2026-09-06 | Research: what closing the source and selling Claudinite would take, technically |
| [#1807](https://github.com/missingbulb/Claudinite/issues/1807) | Q | blocked | canon | 2026-09-06 | Retrospective: the stateless scheduler and the task trigger |
| [#1806](https://github.com/missingbulb/Claudinite/issues/1806) |  | unlabelled-backlog |  | 2026-09-06 | Check that a migration record's `version` is above its pack's current version |
| [#1794](https://github.com/missingbulb/Claudinite/issues/1794) | Q | blocked | canon | 2026-09-06 | Verify in production: a drain says the unreadable hold once, not per item |
| [#1790](https://github.com/missingbulb/Claudinite/issues/1790) | Q | blocked | canon | 2026-09-06 | Verify in production: janitor rule I closes an abandoned failure park |
| [#1789](https://github.com/missingbulb/Claudinite/issues/1789) | Q | blocked | canon | 2026-09-06 | Retire the trigger derivation: a task declaration must state its own `trigger` |
| [#1783](https://github.com/missingbulb/Claudinite/issues/1783) |  | unlabelled-backlog |  | 2026-09-06 | A pack migration record cannot name the version it lands at now that versions are cut on main |
| [#1759](https://github.com/missingbulb/Claudinite/issues/1759) |  | unlabelled-backlog |  | 2026-09-06 | merge-to-main's prompt trigger misses a lowercase "lgtm" |
| [#1758](https://github.com/missingbulb/Claudinite/issues/1758) | Q | blocked | canon | 2026-09-06 | Verify in production: members register the UserPromptSubmit and PostToolUse hooks through their converge |
| [#1749](https://github.com/missingbulb/Claudinite/issues/1749) |  | unlabelled-backlog |  | 2026-09-06 | Move .claudinite-settings.json into .claudinite/ |
| [#1732](https://github.com/missingbulb/Claudinite/issues/1732) | Q | blocked | canon | 2026-09-06 | Retire the frequency door: a task declaration states its cadence as a precondition term |
| [#1725](https://github.com/missingbulb/Claudinite/issues/1725) |  | unlabelled-backlog |  | 2026-09-06 | Scheduling as preconditions: retire `frequency` and the schedule board |
| [#1724](https://github.com/missingbulb/Claudinite/issues/1724) | Q | blocked | canon | 2026-09-05 | Retrospective: the local-pack consolidation and the three packs it promoted |
| [#1720](https://github.com/missingbulb/Claudinite/issues/1720) |  | unlabelled-backlog |  | 2026-09-05 | A merge resolution can silently delete a VERSIONS.md row, and nothing catches it |
| [#1718](https://github.com/missingbulb/Claudinite/issues/1718) | Q | blocked | canon | 2026-09-05 | Retrospective: the executor resolves which pull request a run works on |
| [#1716](https://github.com/missingbulb/Claudinite/issues/1716) | Q | blocked | canon | 2026-09-06 | Verify in production: the executor amends or supersedes a task's open pull request |
| [#1710](https://github.com/missingbulb/Claudinite/issues/1710) |  | unlabelled-backlog |  | 2026-09-04 | Waking verify-production mints a standing item that can only park |
| [#1704](https://github.com/missingbulb/Claudinite/issues/1704) |  | unlabelled-backlog |  | 2026-09-04 | guardToolCalls needs a session-context predicate — guard a tool in trigger-fired sessions only |
| [#1703](https://github.com/missingbulb/Claudinite/issues/1703) | Q | blocked | canon | 2026-09-06 | Retrospective: the four-moment declared-check mechanism |
| [#1698](https://github.com/missingbulb/Claudinite/issues/1698) | Q | blocked | canon | 2026-09-04 | Retire the target hand-off tolerances: the update worker's own disposal and the generated lane's prefix discovery |
| [#1683](https://github.com/missingbulb/Claudinite/issues/1683) | Q | blocked | canon | 2026-09-06 | Retrospective: barriers folded into basics |
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
| [#1579](https://github.com/missingbulb/Claudinite/issues/1579) | Q | blocked | canon | 2026-09-02 | Validate the preconditions system live |
| [#1572](https://github.com/missingbulb/Claudinite/issues/1572) |  | unlabelled-backlog |  | 2026-09-02 | Declarative task preconditions + the repo-active silence gate |
| [#1570](https://github.com/missingbulb/Claudinite/issues/1570) | Q | park:action | canon | 2026-09-01 | [claudinite-work] claudinite-canon-curation/upstream-watch |
| [#1556](https://github.com/missingbulb/Claudinite/issues/1556) |  | unlabelled-backlog |  | 2026-09-06 | A member owing a withheld delivery reads as "behind", so a fleet baseline reports it as failed |
| [#1555](https://github.com/missingbulb/Claudinite/issues/1555) |  | unlabelled-backlog |  | 2026-09-01 | The staging sweep deletes on "I didn't write it this pass", which is not the same as "it was delivered" |
| [#1550](https://github.com/missingbulb/Claudinite/issues/1550) |  | unlabelled-backlog |  | 2026-09-06 | Self-test gate passes a `--root` flag `selftest.mjs` never parses |
| [#1547](https://github.com/missingbulb/Claudinite/issues/1547) |  | unlabelled-backlog |  | 2026-09-02 | Reconsider the update flow from requirements, not from the existing structure |
| [#1538](https://github.com/missingbulb/Claudinite/issues/1538) |  | unlabelled-backlog |  | 2026-08-31 | The four park kinds conflate two independent questions, and `decision` absorbs the overflow |
| [#1519](https://github.com/missingbulb/Claudinite/issues/1519) | Q | blocked | canon | 2026-08-31 | Retrospective: the production-retrospective lane |
| [#1517](https://github.com/missingbulb/Claudinite/issues/1517) | Q | park:action | canon | 2026-09-01 | Verify in production: the re-opened withhold lane converges members without regression |
| [#1495](https://github.com/missingbulb/Claudinite/issues/1495) | Q | park:action | canon | 2026-09-01 | Verify in production: an agentic session converges its own item instead of parking |
| [#1485](https://github.com/missingbulb/Claudinite/issues/1485) |  | unlabelled-backlog |  | 2026-09-06 | task-declaration-shape passes an unresolvable `automerge` policy, and the task then silently stops being scheduled |
| [#1478](https://github.com/missingbulb/Claudinite/issues/1478) |  | unlabelled-backlog |  | 2026-08-30 | Re-shelve claudinite-tasks by stage: src/ for the code, queue/ frozen as workflow ABI |
| [#1469](https://github.com/missingbulb/Claudinite/issues/1469) | Q | park:action | canon | 2026-08-31 | Verify in production: rename-stranded parks close, and their task starts running again |
| [#1458](https://github.com/missingbulb/Claudinite/issues/1458) | Q | park:decision | canon | 2026-09-02 | Verify in production: a retry re-arms Not-before to a future instant |
| [#1455](https://github.com/missingbulb/Claudinite/issues/1455) | Q | park:decision | canon | 2026-09-01 | Verify in production: a member's executor still starts on the single ready trigger |
| [#1428](https://github.com/missingbulb/Claudinite/issues/1428) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#1399](https://github.com/missingbulb/Claudinite/issues/1399) |  | unlabelled-backlog |  | 2026-09-06 | The update flow labels its PR with the retired bare `needs-human` |
| [#1388](https://github.com/missingbulb/Claudinite/issues/1388) |  | unlabelled-backlog |  | 2026-08-27 | Verify in production: fleet-usage task retired reaches Shepherd |
| [#1382](https://github.com/missingbulb/Claudinite/issues/1382) |  | unlabelled-backlog |  | 2026-09-06 | Retire the deleted slot scheduler's leftovers — its labels, its session-side resolver, its janitor rules |
| [#1353](https://github.com/missingbulb/Claudinite/issues/1353) | Q | park:action | canon | 2026-08-31 | Delete the updates/ shims, once no member's vendored worker names them |
| [#1347](https://github.com/missingbulb/Claudinite/issues/1347) |  | unlabelled-backlog |  | 2026-08-24 | Merge the dispatch simulator into the scheduler codebase — the sim becomes a test harness |
| [#1346](https://github.com/missingbulb/Claudinite/issues/1346) | Q | blocked | none | 2026-09-06 | Move taskScheduler from a top-level settings key into the claudinite-tasks pack's own config |
| [#1341](https://github.com/missingbulb/Claudinite/issues/1341) |  | unlabelled-backlog |  | 2026-08-24 | Eliminate the task-janitor: fold its recovery into the scheduler run, its visibility into the dashboard |
| [#1333](https://github.com/missingbulb/Claudinite/issues/1333) |  | unlabelled-backlog |  | 2026-09-06 | claudinite-canary-repo: the withhold lane it probes no longer exists |
| [#1317](https://github.com/missingbulb/Claudinite/issues/1317) |  | unlabelled-backlog |  | 2026-09-06 | Extract the task execution/scheduling surface into a claudinite-tasks pack |
| [#1313](https://github.com/missingbulb/Claudinite/issues/1313) |  | unlabelled-backlog |  | 2026-09-06 | Gate packs/* against .claudinite/local in the barriers config |
| [#1295](https://github.com/missingbulb/Claudinite/issues/1295) |  | unlabelled-backlog |  | 2026-09-06 | A member whose Actions jobs cannot start has no escalation path — report-failure dies with everything else |
| [#1275](https://github.com/missingbulb/Claudinite/issues/1275) | Q | park:approval | retired | 2026-08-23 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#1274](https://github.com/missingbulb/Claudinite/issues/1274) | Q | park:approval | retired | 2026-08-23 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#1264](https://github.com/missingbulb/Claudinite/issues/1264) |  | unlabelled-backlog |  | 2026-09-06 | Delete the two-name settings-file tolerance once no member carries .claudinite-checks.json |
| [#1237](https://github.com/missingbulb/Claudinite/issues/1237) | Q | blocked | none | 2026-09-06 | Chain 3/3: retire the twice-daily-cron migration tolerances |
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
| [#276](https://github.com/missingbulb/Claudinite/issues/276) |  | unlabelled-backlog |  | 2026-09-06 | Move chrome-extension-release plumbing out of core `.github/` into the pack (vendored into consumers) |
| [#239](https://github.com/missingbulb/Claudinite/issues/239) |  | unlabelled-backlog |  | 2026-09-06 | Follow-up: wire existing legacy tolerances to the migration resolver |
| [#230](https://github.com/missingbulb/Claudinite/issues/230) |  | unlabelled-backlog |  | 2026-09-06 | Workflows pin Node 20, now deprecated on Actions runners (forced to Node 24) |
| [#223](https://github.com/missingbulb/Claudinite/issues/223) |  | unlabelled-backlog |  | 2026-09-07 | Conformance-backlog: check for chrome-extension:// in API Gateway v2 CORS AllowOrigins |

## missingbulb/GoogleCalendarEventCreator — 35 open (13 queue / 22 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#1186](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1186) |  | unlabelled-backlog |  | 2026-09-07 | Local-pack task tests pin the pre-cadence-terms declaration shape |
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
| [#1038](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1038) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] gcec/generic-extractor-improvements |
| [#1037](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1037) | Q | park:failure | retired | 2026-08-23 | [claudinite-work] tidy-repo/tidy-prs |
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

## missingbulb/ClaudiniteWebsite — 32 open (13 queue / 19 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#437](https://github.com/missingbulb/ClaudiniteWebsite/issues/437) | Q | park:action | canon | 2026-09-06 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#376](https://github.com/missingbulb/ClaudiniteWebsite/issues/376) |  | unlabelled-backlog |  | 2026-08-30 | The site's release pipeline is a hand-rolled copy of the static-website standard, on its retired version scheme |
| [#366](https://github.com/missingbulb/ClaudiniteWebsite/issues/366) |  | unlabelled-backlog |  | 2026-09-06 | Canon patch (blocked on push scope): dedup-prune-integrity false-positives on VERSIONS.md growth |
| [#356](https://github.com/missingbulb/ClaudiniteWebsite/issues/356) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] product-wiki/wiki-growth |
| [#351](https://github.com/missingbulb/ClaudiniteWebsite/issues/351) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#348](https://github.com/missingbulb/ClaudiniteWebsite/issues/348) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/growth-dedup |
| [#325](https://github.com/missingbulb/ClaudiniteWebsite/issues/325) | Q | park:action | canon | 2026-08-31 | Verify https://claudinite.com/ serves the live site, not a GitHub Pages error |
| [#316](https://github.com/missingbulb/ClaudiniteWebsite/issues/316) |  | unlabelled-backlog |  | 2026-09-06 | Canon patch (blocked on push scope): dedup-prune-integrity flags the VERSIONS.md row growth-dedup's own task doc mandates |
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
| [#185](https://github.com/missingbulb/ClaudiniteWebsite/issues/185) |  | add-packs |  | 2026-09-06 | Add packs: suspected from this repo’s shape |
| [#77](https://github.com/missingbulb/ClaudiniteWebsite/issues/77) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Tidy Branches |
| [#62](https://github.com/missingbulb/ClaudiniteWebsite/issues/62) |  | unlabelled-backlog |  | 2026-09-06 | One-time GitHub settings for the static-site release pipeline |
| [#60](https://github.com/missingbulb/ClaudiniteWebsite/issues/60) |  | unlabelled-backlog |  | 2026-09-06 | Adopt the static-website pack — replace the hand-rolled deploy and version bump |
| [#59](https://github.com/missingbulb/ClaudiniteWebsite/issues/59) |  | unlabelled-backlog |  | 2026-09-06 | Canon patch (blocked on push scope): executor-routine fixes for #53–#57 |
| [#57](https://github.com/missingbulb/ClaudiniteWebsite/issues/57) |  | unlabelled-backlog |  | 2026-09-06 | comment-classification fires on routine triggers, which are not owner comments |
| [#55](https://github.com/missingbulb/ClaudiniteWebsite/issues/55) |  | unlabelled-backlog |  | 2026-09-06 | task-lifecycle's remedy tells the agent to amend an already-pushed commit |
| [#54](https://github.com/missingbulb/ClaudiniteWebsite/issues/54) |  | unlabelled-backlog |  | 2026-09-06 | resolve-dispatch exit 13 renders as a failed command when it is the normal handshake |
| [#53](https://github.com/missingbulb/ClaudiniteWebsite/issues/53) |  | unlabelled-backlog |  | 2026-09-06 | task-lifecycle fires on the scheduler's maintenance branch, which can never satisfy it |
| [#44](https://github.com/missingbulb/ClaudiniteWebsite/issues/44) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Product Wiki Growth |

## missingbulb/hitbut — 28 open (16 queue / 12 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#220](https://github.com/missingbulb/hitbut/issues/220) |  | unlabelled-backlog |  | 2026-09-06 | Adopt canon pack: cloudflare-workers |
| [#213](https://github.com/missingbulb/hitbut/issues/213) |  | unlabelled-backlog |  | 2026-09-04 | fetch-samples delivers nothing: git collapses the untracked payload directory |
| [#212](https://github.com/missingbulb/hitbut/issues/212) | Q | park:failure | canon | 2026-09-04 | [claudinite-work] hitbut/fetch-samples |
| [#153](https://github.com/missingbulb/hitbut/issues/153) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] tidy-repo/tidy-prs |
| [#152](https://github.com/missingbulb/hitbut/issues/152) | Q | park:action | canon | 2026-08-30 | [claudinite-work] tidy-repo/improve-comments |
| [#151](https://github.com/missingbulb/hitbut/issues/151) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] product-wiki/wiki-growth |
| [#147](https://github.com/missingbulb/hitbut/issues/147) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#125](https://github.com/missingbulb/hitbut/issues/125) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-extract |
| [#108](https://github.com/missingbulb/hitbut/issues/108) | Q | park:decision | retired | 2026-08-24 | [claudinite-work] claudinite-growth/growth-extract |
| [#87](https://github.com/missingbulb/hitbut/issues/87) | Q | park:action | retired | 2026-08-25 | Verify in production: the operator console is published and reads the live Worker |
| [#86](https://github.com/missingbulb/hitbut/issues/86) |  | unlabelled-backlog |  | 2026-08-23 | Turn on GitHub Pages for the operator console (human-only steps) |
| [#83](https://github.com/missingbulb/hitbut/issues/83) |  | tidy-tracker |  | 2026-08-23 | Claudinite tracker: Product Wiki Growth |
| [#79](https://github.com/missingbulb/hitbut/issues/79) | Q | park:action | retired | 2026-08-23 | [claudinite-work] tidy-repo/tidy-prs |
| [#76](https://github.com/missingbulb/hitbut/issues/76) | Q | park:action | retired | 2026-08-23 | [claudinite-work] product-wiki/wiki-growth |
| [#74](https://github.com/missingbulb/hitbut/issues/74) | Q | park:action | retired | 2026-08-23 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#70](https://github.com/missingbulb/hitbut/issues/70) | Q | park:approval | retired | 2026-08-25 | Move the deploy off GitHub Actions and onto Claudinite tasks |
| [#60](https://github.com/missingbulb/hitbut/issues/60) |  | unlabelled-backlog |  | 2026-08-23 | Adopt canon pack: cloudflare-workers |
| [#36](https://github.com/missingbulb/hitbut/issues/36) |  | unlabelled-backlog |  | 2026-08-23 | The deploy has no smoke test and no rollback path |
| [#34](https://github.com/missingbulb/hitbut/issues/34) |  | unlabelled-backlog |  | 2026-09-04 | Implement the utterance/stance architecture: ingestion, embeddings, backfill |
| [#33](https://github.com/missingbulb/hitbut/issues/33) |  | unlabelled-backlog |  | 2026-08-23 | Nothing names an emergent cluster, so every subject chip is empty |
| [#32](https://github.com/missingbulb/hitbut/issues/32) |  | unlabelled-backlog |  | 2026-08-21 | Reconnaissance and the first two sources |
| [#28](https://github.com/missingbulb/hitbut/issues/28) |  | unlabelled-backlog |  | 2026-08-23 | Honest gaps: what green in the requirements harness does not yet prove |
| [#24](https://github.com/missingbulb/hitbut/issues/24) |  | tidy-tracker |  | 2026-08-21 | Claudinite tracker: Product Wiki Growth |
| [#21](https://github.com/missingbulb/hitbut/issues/21) |  | unlabelled-backlog |  | 2026-08-25 | Adoption hand-over: the two settings no session can reach |
| [#20](https://github.com/missingbulb/hitbut/issues/20) | Q | park:action | retired | 2026-08-23 | [claudinite-work] tidy-repo/tidy-prs |
| [#17](https://github.com/missingbulb/hitbut/issues/17) | Q | park:action | retired | 2026-08-23 | [claudinite-work] product-wiki/wiki-growth |
| [#13](https://github.com/missingbulb/hitbut/issues/13) | Q | park:action | retired | 2026-08-23 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#6](https://github.com/missingbulb/hitbut/issues/6) | Q | park:action | retired | 2026-08-25 | Verify in production: the executor hand-off actually dispatches a work item |

## missingbulb/MissingBulbWebsite — 24 open (12 queue / 12 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#332](https://github.com/missingbulb/MissingBulbWebsite/issues/332) | Q | running-agent | canon | 2026-09-06 | [claudinite-work] tidy-repo/tidy-prs |
| [#298](https://github.com/missingbulb/MissingBulbWebsite/issues/298) | Q | park:action | canon | 2026-09-02 | Align local pack rules and skills to the writing-pack-prose references convention |
| [#276](https://github.com/missingbulb/MissingBulbWebsite/issues/276) |  | unlabelled-backlog |  | 2026-08-30 | The site's release pipeline is a hand-rolled copy of the static-website standard, on its retired version scheme |
| [#266](https://github.com/missingbulb/MissingBulbWebsite/issues/266) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] tidy-repo/improve-comments |
| [#263](https://github.com/missingbulb/MissingBulbWebsite/issues/263) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#262](https://github.com/missingbulb/MissingBulbWebsite/issues/262) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#260](https://github.com/missingbulb/MissingBulbWebsite/issues/260) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/growth-dedup |
| [#240](https://github.com/missingbulb/MissingBulbWebsite/issues/240) | Q | park:decision | retired | 2026-08-26 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#238](https://github.com/missingbulb/MissingBulbWebsite/issues/238) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-extract |
| [#227](https://github.com/missingbulb/MissingBulbWebsite/issues/227) |  | unlabelled-backlog |  | 2026-09-06 | Agent sessions can't converge Claudinite work items — converge-item.mjs needs direct GitHub REST, sessions are MCP-only |
| [#220](https://github.com/missingbulb/MissingBulbWebsite/issues/220) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] product-wiki/wiki-growth |
| [#217](https://github.com/missingbulb/MissingBulbWebsite/issues/217) |  | unlabelled-backlog |  | 2026-08-23 | Claudinite scheduler fails at job start on every run — the mount has been frozen since 2026-08-21 |
| [#208](https://github.com/missingbulb/MissingBulbWebsite/issues/208) | Q | park:decision | retired | 2026-08-25 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#207](https://github.com/missingbulb/MissingBulbWebsite/issues/207) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#203](https://github.com/missingbulb/MissingBulbWebsite/issues/203) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-dedup |
| [#169](https://github.com/missingbulb/MissingBulbWebsite/issues/169) |  | unlabelled-backlog |  | 2026-08-17 | core pack required by basics but never materialized in .claudinite-checks.json |
| [#164](https://github.com/missingbulb/MissingBulbWebsite/issues/164) |  | add-packs |  | 2026-08-16 | Add packs: suspected from this repo’s shape |
| [#60](https://github.com/missingbulb/MissingBulbWebsite/issues/60) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Product Wiki Growth |
| [#55](https://github.com/missingbulb/MissingBulbWebsite/issues/55) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Tidy Branches |
| [#54](https://github.com/missingbulb/MissingBulbWebsite/issues/54) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Growth Dedup |
| [#51](https://github.com/missingbulb/MissingBulbWebsite/issues/51) |  | tidy-tracker |  | 2026-08-09 | Claudinite tracker: Tidy PRs |
| [#40](https://github.com/missingbulb/MissingBulbWebsite/issues/40) |  | unlabelled-backlog |  | 2026-09-06 | One-time GitHub settings for the static-site release pipeline |
| [#38](https://github.com/missingbulb/MissingBulbWebsite/issues/38) |  | unlabelled-backlog |  | 2026-08-15 | Adopt the static-website pack — replace the hand-rolled deploy and version bump |
| [#28](https://github.com/missingbulb/MissingBulbWebsite/issues/28) |  | tidy-tracker |  | 2026-08-15 | Claudinite tracker: Tidy Issues |

## missingbulb/ClaudiniteCanary — 21 open (14 queue / 7 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#367](https://github.com/missingbulb/ClaudiniteCanary/issues/367) | Q | waiting-for-executor | canon | 2026-09-07 | [claudinite-work] tidy-repo/tidy-issues |
| [#366](https://github.com/missingbulb/ClaudiniteCanary/issues/366) | Q | waiting-for-executor | canon | 2026-09-07 | [claudinite-work] claudinite-tasks/usage-fold |
| [#365](https://github.com/missingbulb/ClaudiniteCanary/issues/365) | Q | waiting-for-executor | canon | 2026-09-07 | [claudinite-work] claudinite-tasks/task-janitor |
| [#364](https://github.com/missingbulb/ClaudiniteCanary/issues/364) | Q | waiting-for-executor | canon | 2026-09-07 | [claudinite-work] claudinite-lifecycle/update |
| [#363](https://github.com/missingbulb/ClaudiniteCanary/issues/363) | Q | waiting-for-executor | canon | 2026-09-07 | [claudinite-work] claudinite-dashboard/publish-pages |
| [#362](https://github.com/missingbulb/ClaudiniteCanary/issues/362) |  | unlabelled-backlog |  | 2026-09-06 | Dangling badge reference in README.md: barriers pack no longer declared |
| [#354](https://github.com/missingbulb/ClaudiniteCanary/issues/354) | Q | park:approval | canon | 2026-09-06 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#283](https://github.com/missingbulb/ClaudiniteCanary/issues/283) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#247](https://github.com/missingbulb/ClaudiniteCanary/issues/247) | Q | park:approval | retired | 2026-08-24 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#239](https://github.com/missingbulb/ClaudiniteCanary/issues/239) |  | unlabelled-backlog |  | 2026-08-23 | converge-item.mjs has no MCP-compatible agent-lane path — a session cannot perform queue instructions.md step 6 |
| [#235](https://github.com/missingbulb/ClaudiniteCanary/issues/235) | Q | park:decision | retired | 2026-08-24 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#231](https://github.com/missingbulb/ClaudiniteCanary/issues/231) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] tidy-repo/tidy-prs |
| [#153](https://github.com/missingbulb/ClaudiniteCanary/issues/153) |  | unlabelled-backlog |  | 2026-08-21 | claudinite-dashboard adoption: the setup steps only a human can do |
| [#133](https://github.com/missingbulb/ClaudiniteCanary/issues/133) | Q | park:approval | retired | 2026-08-19 | [claudinite-work] claudinite-lifecycle/adopt-requested-packs |
| [#129](https://github.com/missingbulb/ClaudiniteCanary/issues/129) | Q | park:approval | retired | 2026-08-23 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#128](https://github.com/missingbulb/ClaudiniteCanary/issues/128) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#126](https://github.com/missingbulb/ClaudiniteCanary/issues/126) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-extract |
| [#95](https://github.com/missingbulb/ClaudiniteCanary/issues/95) |  | tidy-tracker |  | 2026-08-22 | Claudinite tracker: Tidy Issues |
| [#47](https://github.com/missingbulb/ClaudiniteCanary/issues/47) |  | tidy-tracker |  | 2026-08-10 | Claudinite tracker: Growth Extract |
| [#41](https://github.com/missingbulb/ClaudiniteCanary/issues/41) |  | tidy-tracker |  | 2026-08-23 | Claudinite tracker: Prose to Checks |
| [#39](https://github.com/missingbulb/ClaudiniteCanary/issues/39) |  | tidy-tracker |  | 2026-08-30 | Claudinite tracker: Tidy PRs |

## missingbulb/EdFringeNow — 21 open (8 queue / 13 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#629](https://github.com/missingbulb/EdFringeNow/issues/629) | Q | park:approval | canon | 2026-09-06 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#615](https://github.com/missingbulb/EdFringeNow/issues/615) |  | unlabelled-backlog |  | 2026-09-04 | ui-requirements goldens flap: the same tree fails different cases run to run |
| [#610](https://github.com/missingbulb/EdFringeNow/issues/610) |  | unlabelled-backlog |  | 2026-09-04 | UX research services: what's available, what they cost, and a case for a claudinite pack |
| [#575](https://github.com/missingbulb/EdFringeNow/issues/575) | Q | park:action | canon | 2026-09-02 | Align local pack rules and skills to the writing-pack-prose references convention |
| [#535](https://github.com/missingbulb/EdFringeNow/issues/535) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#532](https://github.com/missingbulb/EdFringeNow/issues/532) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/growth-dedup |
| [#491](https://github.com/missingbulb/EdFringeNow/issues/491) | Q | park:decision | retired | 2026-08-24 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#478](https://github.com/missingbulb/EdFringeNow/issues/478) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] tidy-repo/tidy-prs |
| [#440](https://github.com/missingbulb/EdFringeNow/issues/440) | Q | park:decision | retired | 2026-08-24 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#439](https://github.com/missingbulb/EdFringeNow/issues/439) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#401](https://github.com/missingbulb/EdFringeNow/issues/401) |  | workflow-failure |  | 2026-08-18 | Claudinite scheduler run failed |
| [#382](https://github.com/missingbulb/EdFringeNow/issues/382) |  | add-packs |  | 2026-08-16 | Add packs: suspected from this repo’s shape |
| [#314](https://github.com/missingbulb/EdFringeNow/issues/314) |  | unlabelled-backlog |  | 2026-08-09 | Replace per-file cache TTLs with a published manifest |
| [#295](https://github.com/missingbulb/EdFringeNow/issues/295) |  | unlabelled-backlog |  | 2026-09-06 | The site lists shows edfringe has withdrawn — nothing removes them from the master |
| [#294](https://github.com/missingbulb/EdFringeNow/issues/294) |  | unlabelled-backlog |  | 2026-09-06 | Prices exclude the booking fee edfringe advertises — and the recorded `fee` is wrong |
| [#237](https://github.com/missingbulb/EdFringeNow/issues/237) |  | unlabelled-backlog |  | 2026-08-17 | Upstream: baselining's deliver() leaves the scheduler checkout on its maintenance branch |
| [#223](https://github.com/missingbulb/EdFringeNow/issues/223) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Product Wiki Growth |
| [#164](https://github.com/missingbulb/EdFringeNow/issues/164) |  | unlabelled-backlog |  | 2026-09-06 | Monetization: join Booking.com + Omio and paste the IDs into shared/affiliates.js |
| [#161](https://github.com/missingbulb/EdFringeNow/issues/161) |  | unlabelled-backlog |  | 2026-09-06 | Monetization: join the 4 affiliate programmes and paste the IDs into js/places.js |
| [#143](https://github.com/missingbulb/EdFringeNow/issues/143) |  | tidy-tracker |  | 2026-09-06 | Claudinite tracker: Tidy Issues |
| [#70](https://github.com/missingbulb/EdFringeNow/issues/70) |  | unlabelled-backlog |  | 2026-09-06 | Re-paste the Claudinite environment Setup script |

## missingbulb/Shepherd — 21 open (15 queue / 6 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#500](https://github.com/missingbulb/Shepherd/issues/500) | Q | running-executor | canon | 2026-09-07 | [claudinite-work] shepherd/fleet-issues-snapshot |
| [#499](https://github.com/missingbulb/Shepherd/issues/499) | Q | waiting-for-executor | canon | 2026-09-07 | [claudinite-work] claudinite-growth/growth-extract |
| [#498](https://github.com/missingbulb/Shepherd/issues/498) | Q | waiting-for-executor | canon | 2026-09-07 | [claudinite-work] claudinite-fleet-sheepdog/fleet-add-missing-packs |
| [#497](https://github.com/missingbulb/Shepherd/issues/497) | Q | waiting-for-executor | canon | 2026-09-07 | [claudinite-work] basics/improve-comments |
| [#495](https://github.com/missingbulb/Shepherd/issues/495) | Q | blocked | canon | 2026-09-07 | Verify in production: fleet-roster still sweeps, and files no fleet-drift issue |
| [#483](https://github.com/missingbulb/Shepherd/issues/483) | Q | park:failure | canon | 2026-09-07 | [claudinite-work] claudinite-fleet-sheepdog/fleet-baseline |
| [#480](https://github.com/missingbulb/Shepherd/issues/480) |  | unlabelled-backlog |  | 2026-09-06 | Delete the retired tidy-issues label definitions across the fleet |
| [#449](https://github.com/missingbulb/Shepherd/issues/449) | Q | park:failure | canon | 2026-09-04 | [claudinite-work] shepherd/fleet-issues-snapshot |
| [#441](https://github.com/missingbulb/Shepherd/issues/441) | Q | blocked | canon | 2026-09-03 | Retrospective: dashboard Sign in with GitHub |
| [#420](https://github.com/missingbulb/Shepherd/issues/420) |  | unlabelled-backlog |  | 2026-09-02 | Fleet triage 2026-09-02: 53% of parks sit in a kind no rule can drain |
| [#396](https://github.com/missingbulb/Shepherd/issues/396) | Q | park:action | canon | 2026-09-02 | Align local pack rules and skills to the writing-pack-prose references convention |
| [#395](https://github.com/missingbulb/Shepherd/issues/395) |  | unlabelled-backlog |  | 2026-09-01 | Fleet: file ad-hoc tasks to align every member's local packs to the writing-pack-prose convention |
| [#337](https://github.com/missingbulb/Shepherd/issues/337) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] tidy-repo/improve-comments |
| [#333](https://github.com/missingbulb/Shepherd/issues/333) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#332](https://github.com/missingbulb/Shepherd/issues/332) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#212](https://github.com/missingbulb/Shepherd/issues/212) | Q | park:approval | retired | 2026-08-23 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#205](https://github.com/missingbulb/Shepherd/issues/205) | Q | park:failure | retired | 2026-08-23 | [claudinite-work] claudinite-fleet-sheepdog/fleet-add-missing-packs |
| [#169](https://github.com/missingbulb/Shepherd/issues/169) |  | fleet-drift |  | 2026-09-07 | Claudinite mount has fallen behind on missingbulb/vascularcoloring |
| [#137](https://github.com/missingbulb/Shepherd/issues/137) |  | unlabelled-backlog |  | 2026-09-06 | The dashboard's morning-brief panel is off, on the repo that writes the briefs |
| [#117](https://github.com/missingbulb/Shepherd/issues/117) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-extract |
| [#3](https://github.com/missingbulb/Shepherd/issues/3) |  | unlabelled-backlog |  | 2026-08-19 | Claudinite adoption: the setup steps only a human can do |

## missingbulb/TLDR — 20 open (6 queue / 14 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#466](https://github.com/missingbulb/TLDR/issues/466) | Q | park:approval | canon | 2026-09-06 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#401](https://github.com/missingbulb/TLDR/issues/401) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] tidy-repo/tidy-prs |
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

## missingbulb/ShoutsAndWhispers — 17 open (12 queue / 5 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#395](https://github.com/missingbulb/ShoutsAndWhispers/issues/395) | Q | no-status | none | 2026-09-06 | Generate and commit the dev Firebase client config |
| [#394](https://github.com/missingbulb/ShoutsAndWhispers/issues/394) | Q | blocked | canon | 2026-09-06 | Retrospective: the dev console and the Appetize preview, one week on |
| [#393](https://github.com/missingbulb/ShoutsAndWhispers/issues/393) |  | unlabelled-backlog |  | 2026-09-06 | Confirm the Appetize preview is usable end to end |
| [#392](https://github.com/missingbulb/ShoutsAndWhispers/issues/392) | Q | blocked | canon | 2026-09-06 | Upload the preview to Appetize and document the link |
| [#391](https://github.com/missingbulb/ShoutsAndWhispers/issues/391) | Q | no-status | none | 2026-09-06 | Android build wiring and the Appetize preview workflow |
| [#390](https://github.com/missingbulb/ShoutsAndWhispers/issues/390) | Q | blocked | canon | 2026-09-06 | Email/password sign-in path in the app |
| [#389](https://github.com/missingbulb/ShoutsAndWhispers/issues/389) |  | unlabelled-backlog |  | 2026-09-06 | Validation gate: drive the dev console and confirm it works |
| [#388](https://github.com/missingbulb/ShoutsAndWhispers/issues/388) | Q | blocked | canon | 2026-09-06 | Deploy the dev backend and the console, and post the URL |
| [#387](https://github.com/missingbulb/ShoutsAndWhispers/issues/387) | Q | blocked | canon | 2026-09-06 | Deploy workflow for the dev project, and Hosting for the console |
| [#386](https://github.com/missingbulb/ShoutsAndWhispers/issues/386) | Q | blocked | canon | 2026-09-06 | Compressed replay against the emulator suite |
| [#385](https://github.com/missingbulb/ShoutsAndWhispers/issues/385) | Q | no-status | none | 2026-09-06 | Console replay engine and observation views, real-time against dev |
| [#384](https://github.com/missingbulb/ShoutsAndWhispers/issues/384) | Q | blocked | canon | 2026-09-06 | Dev console package: plan model, plan editor, and its requirements suite |
| [#383](https://github.com/missingbulb/ShoutsAndWhispers/issues/383) | Q | blocked | canon | 2026-09-06 | Sim-time wire contract and the four guards that keep it out of production |
| [#382](https://github.com/missingbulb/ShoutsAndWhispers/issues/382) |  | unlabelled-backlog |  | 2026-09-06 | Console and secret setup for the dev console and the Appetize preview |
| [#379](https://github.com/missingbulb/ShoutsAndWhispers/issues/379) |  | unlabelled-backlog |  | 2026-09-06 | Dev console for scripted sim accounts, then the Appetize preview |
| [#344](https://github.com/missingbulb/ShoutsAndWhispers/issues/344) | Q | running-executor | canon | 2026-09-06 | Align local pack rules and skills to the writing-pack-prose references convention |
| [#99](https://github.com/missingbulb/ShoutsAndWhispers/issues/99) |  | unlabelled-backlog |  | 2026-09-06 | Get the app running on Appetize.io (browser-based device preview) |

## missingbulb/WIP — 17 open (5 queue / 12 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
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

## missingbulb/NoRFinder — 12 open (7 queue / 5 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#40](https://github.com/missingbulb/NoRFinder/issues/40) |  | unlabelled-backlog |  | 2026-09-07 | README badge row references packs that are no longer declared or vendored |
| [#32](https://github.com/missingbulb/NoRFinder/issues/32) |  | unlabelled-backlog |  | 2026-09-06 | Hand-over: three repository settings Claudinite delivery depends on |
| [#27](https://github.com/missingbulb/NoRFinder/issues/27) | Q | no-status | none | 2026-09-07 | [claudinite-work] tidy-repo/tidy-prs |
| [#25](https://github.com/missingbulb/NoRFinder/issues/25) | Q | no-status | none | 2026-09-07 | [claudinite-work] tidy-repo/improve-comments |
| [#23](https://github.com/missingbulb/NoRFinder/issues/23) | Q | no-status | none | 2026-09-07 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#22](https://github.com/missingbulb/NoRFinder/issues/22) | Q | no-status | none | 2026-09-07 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#20](https://github.com/missingbulb/NoRFinder/issues/20) | Q | no-status | none | 2026-09-07 | [claudinite-work] claudinite-growth/growth-dedup |
| [#17](https://github.com/missingbulb/NoRFinder/issues/17) |  | unlabelled-backlog |  | 2026-09-05 | tests/test_invariance.py runs in no gate |
| [#16](https://github.com/missingbulb/NoRFinder/issues/16) |  | unlabelled-backlog |  | 2026-09-05 | Declare the Python imaging stack as a local-pack env requirement |
| [#14](https://github.com/missingbulb/NoRFinder/issues/14) | Q | no-status | none | 2026-09-07 | [claudinite-work] claudinite-tasks/usage-fold |
| [#11](https://github.com/missingbulb/NoRFinder/issues/11) | Q | no-status | none | 2026-09-07 | [claudinite-work] claudinite-growth/growth-extract |
| [#4](https://github.com/missingbulb/NoRFinder/issues/4) |  | schedule-board |  | 2026-09-07 | [claudinite-schedule] the schedule board |

## missingbulb/VascularColoring — 12 open (7 queue / 5 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#361](https://github.com/missingbulb/VascularColoring/issues/361) |  | unlabelled-backlog |  | 2026-09-06 | Dangling README badge link: .claudinite/shared/packs/barriers/badge.svg |
| [#298](https://github.com/missingbulb/VascularColoring/issues/298) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] tidy-repo/tidy-prs |
| [#294](https://github.com/missingbulb/VascularColoring/issues/294) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#258](https://github.com/missingbulb/VascularColoring/issues/258) | Q | park:approval | retired | 2026-08-24 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#159](https://github.com/missingbulb/VascularColoring/issues/159) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#158](https://github.com/missingbulb/VascularColoring/issues/158) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#156](https://github.com/missingbulb/VascularColoring/issues/156) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-extract |
| [#154](https://github.com/missingbulb/VascularColoring/issues/154) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-dedup |
| [#125](https://github.com/missingbulb/VascularColoring/issues/125) |  | add-packs |  | 2026-08-16 | Add packs: suspected from this repo’s shape |
| [#86](https://github.com/missingbulb/VascularColoring/issues/86) |  | tidy-tracker |  | 2026-08-23 | Claudinite tracker: Tidy Branches |
| [#85](https://github.com/missingbulb/VascularColoring/issues/85) |  | tidy-tracker |  | 2026-08-23 | Claudinite tracker: Tidy PRs |
| [#8](https://github.com/missingbulb/VascularColoring/issues/8) |  | unlabelled-backlog |  | 2026-09-06 | Re-paste the Claudinite environment Setup script |

## missingbulb/CrosswordChat — 11 open (4 queue / 7 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#352](https://github.com/missingbulb/CrosswordChat/issues/352) |  | unlabelled-backlog |  | 2026-08-30 | Chrome Web Store release pipeline is a generation behind the chrome-extension pack |
| [#304](https://github.com/missingbulb/CrosswordChat/issues/304) |  | unlabelled-backlog |  | 2026-08-23 | Connect the Claude GitHub App: converge-item.mjs can't reach the GitHub API from a dispatched session |
| [#303](https://github.com/missingbulb/CrosswordChat/issues/303) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#257](https://github.com/missingbulb/CrosswordChat/issues/257) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#256](https://github.com/missingbulb/CrosswordChat/issues/256) | Q | park:decision | retired | 2026-08-23 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#252](https://github.com/missingbulb/CrosswordChat/issues/252) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-dedup |
| [#211](https://github.com/missingbulb/CrosswordChat/issues/211) |  | unlabelled-backlog |  | 2026-09-06 | Recurring vitest cold-start timeout in visual-snapshots.test.js (help-page) |
| [#63](https://github.com/missingbulb/CrosswordChat/issues/63) |  | unlabelled-backlog |  | 2026-07-19 | Manual check: mic indicator clears on bfcache/back-forward teardown (verifies PR #62 pagehide path) |
| [#11](https://github.com/missingbulb/CrosswordChat/issues/11) |  | unlabelled-backlog |  | 2026-07-05 | Live check: mic never goes deaf after clicks; barge-in reliability (MT-13, MT-27) |
| [#9](https://github.com/missingbulb/CrosswordChat/issues/9) |  | unlabelled-backlog |  | 2026-07-09 | Live check: grid-full "next" moves on; "seven across" jumps to the clue (MT-09) |
| [#6](https://github.com/missingbulb/CrosswordChat/issues/6) |  | unlabelled-backlog |  | 2026-07-09 | Live check: penciling on forced answers works on the real page (MT-29, MT-07) |

## missingbulb/LaughCounter — 6 open (3 queue / 3 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#404](https://github.com/missingbulb/LaughCounter/issues/404) | Q | park:approval | canon | 2026-09-06 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#343](https://github.com/missingbulb/LaughCounter/issues/343) |  | unlabelled-backlog |  | 2026-09-06 | This repo fingerprints the `macos` pack but does not declare it, and its DMG release plumbing is unowned |
| [#239](https://github.com/missingbulb/LaughCounter/issues/239) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#201](https://github.com/missingbulb/LaughCounter/issues/201) |  | add-packs |  | 2026-08-17 | Add packs: suspected from this repo’s shape |
| [#174](https://github.com/missingbulb/LaughCounter/issues/174) |  | unlabelled-backlog |  | 2026-09-06 | Distribute LaughCounter via Homebrew Cask (own tap) |
| [#26](https://github.com/missingbulb/LaughCounter/issues/26) | Q | bare-needs-human | retired | 2026-08-17 | [needs-human] Enable Developer ID signing + notarization for the DMG |

## missingbulb/gRatio — 0 open (0 queue / 0 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|

## missingbulb/HelloWorldFlutterApp — 0 open (0 queue / 0 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
