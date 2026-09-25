# Fleet triage — 2026-09-25

**Nothing holds a task's lane, almost nothing can be superseded, and a third of the fleet's parks
sit in repos where nothing runs at all. The park count is falling anyway — because one person is
closing them by hand.**

Snapshot: the fleet-issues file `shepherd/fleet-issues-snapshot` writes, generated `2026-09-25T09:35:04.071Z`,
375 open issues across 15 in-scope repos (5 skipped: 4 archived, 1 excluded).

Tenth run in the series. This one corrects the series' single most-repeated claim.

---

## 1. The correction: no park holds a lane, and it has not for nineteen days

Every run in this series — and §4 of the `fleet-triage` skill itself — has reported
`isBlockingPark` as *"the kinds that hold a task's lane"*, and converted park age into missed runs
on that basis. **That is wrong, and canon says so in its own words.**

`packs/claudinite-tasks/public/work-item-grammar.mjs`:

```
// WHICH PARK IS A BROKEN RUN. A park is not live, so no park holds its task's lane by
// itself: the scheduler asks the task again on its own conditions, and only a task
// declaring `last-run-not-failed` stops past its own failure. What this predicate
// tells apart is the park a person DIAGNOSES from the three that are a person's
// inbox — a PR waiting to be approved, a choice waiting to be made, a secret waiting
// to be set — which is the split every renderer alarms on.
export const isBlockingPark = (item) => statusOf(item) === STATUS_NEEDS_HUMAN_FAILURE;
```

Not just a comment — the generator agrees. `src/schedule/run.mjs`:

```js
const live = (i) => LIVE_STATUSES.some((s) => isStatus(i, s));
// ...
const open = family.filter((i) => i.state === 'open' && !closedByThisRun.has(i.number) && live(i));
if (open.length) continue; // the standing item already exists
```

A parked item is not `live`, so it never suppresses the next occurrence. Lane-holding is opt-in,
per declaration, via `holdsOnFailure` in `src/contract/calendar.mjs`:

```js
export const holdsOnFailure = (preconditions) =>
  gatesOn(preconditions, NOT_FAILED_TERM) || gatesOn(preconditions, NOT_PARKED_TERM);
```

**Exactly one of canon's 32 task declarations opts in** — `basics/ci-performance`, and it uses the
wider `last-run-not-parked`. Its README says why, and the reasoning is sound:

> `last-run-not-parked`, so a week whose round is still waiting on a person does not run at all: a
> performance fix is argued from an A/B this run measured … a task that stacks rounds behind an
> unanswered one buries the week that needed attention.

Shepherd's own local task, `shepherd/fleet-issues-snapshot`, declares only
`["schedule:at-most-daily"]` — it holds nothing.

**Dated.** `holdsOnFailure` landed 2026-09-06 in
[Claudinite#1733](https://github.com/missingbulb/Claudinite/issues/1733) — *"Scheduling is the
task's own precondition; the scheduler keeps no state"*. So this series has been wrong on every run
from 09-08 onward, including the 09-17, 09-18 and 09-21 reports that leaned on it hardest.

**What this voids.** The skill's "lane cost, in missed runs" axis, as written, is not computable —
for 31 of 32 canon tasks the answer is always zero missed runs. And §3's reading of lane
duplication (*"the generator kept re-filing behind a park that never held it"*) is accurate as
description but wrong as diagnosis: it never should have held it. This run's 23 redundant items
across 12 lanes are the design working, not a malfunction.

**Live proof, this repo, this week.** [Shepherd#746](https://github.com/missingbulb/Shepherd/issues/746)
was a `failure` park on `shepherd/fleet-issues-snapshot`, filed 09-24T09:15. The very next day the
scheduler filed [#754](https://github.com/missingbulb/Shepherd/issues/754) on the same lane, which
ran and produced the snapshot this report is built from. A "blocking" park held nothing, and that
is exactly right.

---

## 2. What *can* end a park — 4 of 89

Three mechanical exits exist. Read fresh from canon this run:

- **Rule E, supersession** (`src/schedule/repair-rules.mjs`) — requires all three:
  `SUPERSEDABLE_PARKS = ['failure', 'action']`, origin **not** in
  `ASKED_FOR_ORIGINS = [manual, ad-hoc]`, and a later clean run of the same task.
- **Rule G, ended park** — requires an `Ends-when` field whose target has resolved:
  `if (endsWhen == null) return false;`
- **Rule F, orphaned park** — the task cannot run at HEAD.

Rule E's reach, computed over all 89 open parks:

| park kind | origin | rule E can clear? | count |
|---|---|---|---|
| approval | planned | no | 26 |
| decision | ad-hoc | no | 13 |
| decision | planned | no | 12 |
| action | ad-hoc | no | 11 |
| approval | ad-hoc | no | 10 |
| decision | *none* | no | 8 |
| approval | *none* | no | 4 |
| failure | github | **YES** | 2 |
| failure | planned | **YES** | 2 |
| failure | ad-hoc | no | 1 |

**Rule E can clear 4 of 89 parks (4%).**

Two things make it that small, and the second is new:

1. `approval` and `decision` — 73 of 89 — are not in `SUPERSEDABLE_PARKS` at all. The skill's
   "a kind in neither set accumulates and never drains" trap, quantified.
2. **`action`'s membership is nominal.** All 11 `action` parks carry `task:origin:ad-hoc`, which
   `ASKED_FOR_ORIGINS` excludes. A kind that is listed as supersedable clears nothing, because the
   only filer that produces it is the one origin the rule refuses. Worth saying plainly: reading
   `SUPERSEDABLE_PARKS` alone overstates the drain.

---

## 3. Rule G is field-only, and 79% of parks predate the field

Rule G reads `parseWorkItemBody(item.body).endsWhen` — a structured field, not prose. A matched
pair from this repo, same repo, same engine, four weeks apart:

| item | filed | `Ends-when` | outcome |
|---|---|---|---|
| [#742](https://github.com/missingbulb/Shepherd/issues/742) | 09-24 | `Ends-when: #747 closed` | rule G closed it `done` on 09-25, one day |
| [#332](https://github.com/missingbulb/Shepherd/issues/332) | 08-30 | *absent* | open approval park, 26 days |

The field is the entire difference between a park that drains overnight and one that is permanent.

`Ends-when` landed 2026-09-07 in
[Claudinite#1887](https://github.com/missingbulb/Claudinite/issues/1887). Splitting the open parks
on that date:

| park kind | filed before 09-07 | after | total |
|---|---|---|---|
| approval | 26 | 14 | 40 |
| decision | 32 | 1 | 33 |
| action | 11 | 0 | 11 |
| failure | 1 | 4 | 5 |
| **total** | **70** | **19** | **89** |

**70 of 89 parks (79%) were filed before the field existed.** `decision` is 32 of 33 — permanent
twice over, being both unsupersedable and unendable.

**Sampled, per the skill's rule.** [Claudinite#1274](https://github.com/missingbulb/Claudinite/issues/1274),
the oldest approval park at 33 days, is the shape:

> Waiting on a person: merge or close #1285, then close this item.
>
> (Converged by hand via the GitHub MCP tools … that script's own direct GITHUB_TOKEN/fetch access
> 403s in this session's execution context)

Textbook R1 — the agent did the work, posted its result, could not converge. Its end condition is
stated precisely, **in prose**. And [#1285 closed on 2026-09-06](https://github.com/missingbulb/Claudinite/pull/1285).
The park has stood 19 days past the event that was supposed to end it, because the janitor reads a
field and the answer is in a sentence.

**This is the third sighting of one pattern in this series.** 09-18 and 09-21 found
`tasks-pack-read-through-its-surface` scanning `.m?js` with an `import` matcher, blind to prose
consumers. This is the same shape in the janitor: a mechanism that reads structured fields while
the information it needs lives in text a person wrote. Worth naming as a class rather than fixing
three times.

---

## 4. Liveness, done properly — and a correction to my own instrument

The 09-21 run ranked members by "days since the newest open issue was updated". **That metric is
wrong**, and this snapshot shows how: VascularColoring read `0.0d` quiet on 09-21 and `5.0d` on
09-25, having done nothing in between. It closed three recently-touched issues, and closing them
removed them from the open set the ladder measures. A repo looks quieter for tidying up.

The closure-immune measure is whether the repo's open set changed **at all** across the window —
issues opened, issues closed, or any surviving issue's `updated_at` advancing:

| repo | open | opened | closed | touched | state |
|---|---|---|---|---|---|
| LaughCounter | 3 | 0 | 0 | 0 | **DARK** (18.5d) |
| WIP | 18 | 0 | 0 | 0 | **DARK** (18.0d) |
| ShoutsAndWhispers | 18 | 0 | 0 | 0 | **DARK** (12.0d) |
| hitbut | 23 | 0 | 0 | 0 | **DARK** (11.9d) |
| CrosswordChat | 12 | 0 | 0 | 0 | **DARK** (5.0d) |
| MissingBulbWebsite | 21 | 0 | 0 | 0 | **DARK** (5.0d) |
| ClaudiniteWebsite | 5 | 0 | 0 | 0 | **DARK** (4.6d) |
| VascularColoring | 13 | 0 | 3 | 0 | closing only, filing nothing |
| GoogleCalendarEventCreator | 34 | 1 | 0 | 0 | barely live |
| NoRFinder | 8 | 1 | 0 | 0 | live |
| TLDR | 22 | 1 | 2 | 0 | live |
| ClaudiniteCanary | 9 | 5 | 3 | 0 | live |
| Shepherd | 19 | 6 | 7 | 0 | live |
| EdFringeNow | 9 | 2 | 12 | 4 | live |
| Claudinite | 161 | 13 | 18 | 10 | live |

**Seven of fifteen members did nothing at all over four days.** Three of them —
CrosswordChat, MissingBulbWebsite, ClaudiniteWebsite — the 09-21 run reported as healthy.

**TLDR recovered.** The 09-17 run predicted the stored-prompt cohort would go quiet; the 09-21 run
had TLDR at 5.0d and drifting. It came back on 09-24 and is live. One prediction from this series
falsified in the member's favour.

**The dark cohort is not one event.** LaughCounter stopped 09-06, WIP 09-07, hitbut and
ShoutsAndWhispers 09-13, and three members within a six-minute window on 09-20 (09:14–09:27), with
ClaudiniteWebsite following at 19:02 the same day. The 09-20 cluster is suggestive — it sits about
two hours before [Claudinite#2116](https://github.com/missingbulb/Claudinite/pull/2116) restructured
the tasks pack's public surface — but **I could not test it**, see §7.

I checked the one 09-20 change that could plausibly break an un-converged member,
`packs/claudinite-tasks/migrations/2026-09-20-cadence-without-anchors`, and it is **not** the cause:
it probes the mounted calendar for capability and, in its own words, *"an unreadable mount reads as
'not capable' and leaves the record inert."* Hypothesis raised and dropped.

---

## 5. Where the drain is actually coming from

The park count is falling — 125 → 120 → 125 → 98 → 96 → **89** across the series. That looks like
the machinery working, and §2 says it cannot be. Splitting the last window by member liveness
settles it:

```
parks in DARK members:  29 -> 29   (delta  0)
parks in LIVE members:  67 -> 60   (delta -7)
```

**All of the drain is in live members, and most of it is one repo**: Claudinite −8, TLDR −2,
against Shepherd +2 and Canary +1. Claudinite is the repo a person is actively working. Rule E
could have accounted for at most 4 of those.

So: the fleet's parks are being cleared **by hand, in one repo**. The other 29 — a third of the
fleet's total — are frozen in members where nothing runs, and will read the same on every future
snapshot regardless of what canon does.

This also reframes the series' headline trend. A falling park count has been read as recovery since
09-13. It is partly recovery in Claudinite and partly seven members no longer filing anything.

---

## 6. The series numbers

| snapshot | total | queue | plain | unlabelled | parks | failure | approval | decision | action |
|---|---|---|---|---|---|---|---|---|---|
| 09-02 | 349 | 133 | 216 | 107 | 125 | 36 | 25 | 40 | 24 |
| 09-08 | 410 | 184 | 226 | 199 | 120 | 29 | 41 | 36 | 14 |
| 09-13 | 417 | 177 | 240 | 212 | 125 | 16 | 57 | 38 | 14 |
| 09-17 | 372 | 131 | 241 | 214 | 98 | 6 | 48 | 33 | 11 |
| 09-21 | 391 | 134 | 257 | 230 | 96 | 3 | 50 | 31 | 12 |
| **09-25** | **375** | **124** | **251** | **228** | **89** | **5** | **40** | **33** | **11** |

The plain half is still the larger one and still under-reported: 251 issues, of which **228 are
unlabelled backlog — 61% of every open issue in the fleet**, with no mechanism pointed at it. It
grew 107 → 230 over the series and has now flattened, entirely because seven members stopped filing.

**Failure parks rose 3 → 5**, the first rise in the series:

| repo | # | filed | age | title |
|---|---|---|---|---|
| Claudinite | [#1682](https://github.com/missingbulb/Claudinite/issues/1682) | 09-04 | 21.1d | Retire the barrier check's legacy read of packConf |
| ClaudiniteCanary | #510 | 09-22 | 2.8d | Claudinite scheduler run failed |
| hitbut | #286 | 09-13 | 12.0d | Claudinite scheduler run failed |
| Shepherd | [#746](https://github.com/missingbulb/Shepherd/issues/746) | 09-24 | 1.0d | `shepherd/fleet-issues-snapshot` |
| ShoutsAndWhispers | #437 | 09-13 | 12.0d | `claudinite-tasks/usage-fold` |

**`Claudinite scheduler run failed` is the tell, and the canary is the control.** hitbut filed one
on 09-13 and has been dark since. ClaudiniteCanary filed the same title on 09-22 **and recovered** —
it is the most active member in the fleet by churn. So the condition is survivable. What hitbut
lacks is not a fix but a second chance: nothing runs there to retry.

---

## 7. What I could not establish, and why

Diagnosing the *cause* of any dark member needs that member's Actions runs or its vendored
scheduler workflow. I attempted the cheapest form — `add_repo` on CrosswordChat with
`access: "read"`, which serves git only and no API — and it was **denied by the auto-mode
classifier** (`[Permission Grant]`). A `git log` over the already-attached canon checkout was
denied in the same turn (`[External System Writes]`), which is classifier noise rather than a real
boundary, since the same form ran earlier.

This is the same wall the 09-21 run hit. Nine runs have now established *that* members go dark and
*that* nothing reports it; establishing *why* needs one permission this session does not have. I
did not route around it.

---

## 8. Shepherd's own state — 19 open

Healthy, and its own instrument failed and self-healed inside the window.
`shepherd/fleet-issues-snapshot` failed on 09-24 with:

```
fleet-issues-snapshot failed: no branch to deliver on
  — the executor resolves it and hands it in as CLAUDINITE_TARGET_BRANCH
```

That is a real code-work bug in the executor hand-off, not an environment blip, and it recurred on
a lane that runs daily. [#754](https://github.com/missingbulb/Shepherd/issues/754) ran clean the
next day and rule E closed #746 at 19:59 — **ten hours after this snapshot was taken**, which is
why #746 still reads `failure` in the tables above.

Seven items closed since 09-21; six new ones filed; nothing older than #685 moved. The five
standing approval parks (#212, #332, #333, #685, plus #742's lane) are all on
`prose-to-checks-sweep` / `rule-revalidation` / `update`, and four of the five predate `Ends-when`.

**One limit in our own instrument**, worth recording: `fleet-issues.GENERATED.json` carries
`number, title, labels, created_at, updated_at, comments` and **no body**. The skill's "approval
parks by end condition" axis therefore cannot be run from the snapshot at all — §3's figures come
from dating the field and from two issues fetched individually. Adding `body` (or just a parsed
`endsWhen`) to the snapshot would make that axis computable fleet-wide.

---

## 9. Corrections to earlier runs

1. **`isBlockingPark` does not hold a lane** (§1). Every run from 09-08 on said it did. Canon has
   said otherwise since 09-06; one of 32 declarations opts in.
2. **"Lane duplication is the generator misbehaving"** — it is the documented design (§1).
3. **The quiet ladder over-reported quietness for tidy repos** (§4). VascularColoring read 0.0d then
   5.0d having done nothing; closing issues made it look quieter. Replaced with a
   closure-immune measure.
4. **"The falling park count is the machinery recovering"** (§5) — it is one person in one repo,
   plus seven members that stopped filing.
5. **The 09-17 prediction that the stored-prompt cohort would go dark** — TLDR recovered (§4).
6. **`action` is effectively not supersedable** (§2), despite being in `SUPERSEDABLE_PARKS`; all 11
   instances carry the one origin rule E refuses.
7. **The 09-21 report's framing of `failure` count as survivorship** holds, and now has a control
   case: ClaudiniteCanary hit the same failure and recovered (§6).

---

## 10. Still open — recommendations, not actions

This skill assesses and reports; the relabel, the close and the re-queue are the owner's call.

1. **Seven dark members** — LaughCounter (18.5d), WIP (18.0d), ShoutsAndWhispers (12.0d), hitbut
   (11.9d), CrosswordChat, MissingBulbWebsite (5.0d), ClaudiniteWebsite (4.6d). None can recover
   from inside itself. A `fleet-baseline` force sweep is the standing lever.
2. **Nothing files an issue when a member goes silent**, since `c802c4d`
   ([Claudinite#1855](https://github.com/missingbulb/Claudinite/issues/1855)) moved fleet freshness
   to the run report. [Shepherd#169](https://github.com/missingbulb/Shepherd/issues/169) is the
   fleet's last-ever `fleet-drift` issue — and it names vascularcoloring, which is now in the quiet
   cohort. The surviving surface is a dashboard tile whose panels are off
   ([#137](https://github.com/missingbulb/Shepherd/issues/137)) and whose sign-in was never enabled
   ([#352](https://github.com/missingbulb/Shepherd/issues/352)).
3. **73 of 89 parks are in kinds rule E cannot touch**, and 70 of 89 predate `Ends-when`. Either the
   backfill of that field or a widening of supersession is the only thing that changes the shape.
4. **The field-vs-prose pattern** (§3) — third sighting. Worth one canon issue naming the class.
5. **`shepherd/fleet-issues-snapshot`'s hand-off bug** — `no branch to deliver on`. Self-healed once;
   the cause is unfixed.
6. **The snapshot carries no body** (§8), so the skill's own end-condition axis is uncomputable.
7. **228 unlabelled plain issues, 61% of the fleet**, with nothing pointed at them.
8. **ShoutsAndWhispers' 11 blocked items are one stalled chain**, all filed 09-07, in a dark repo.
9. **GoogleCalendarEventCreator** — live but only just (1 opened, 0 closed, 0 touched in four days)
   with 10 parks. The next candidate for the dark list.
10. **Diagnosing the 09-13 and 09-20 stops** needs `add_repo` on a dark member, or a Bash permission
    rule. Denied this run and last (§7).

**Where the next run resumes.** It wants a snapshot newer than `2026-09-25T09:35Z`. It should run
the closure-immune liveness table (§4) *first*, before counting anything — and it should re-derive
the park semantics from canon rather than from this report, which is exactly how the error in §1
survived nine runs.

---

# Appendix — every open issue, per repo


375 open issues across 15 in-scope repos under `missingbulb` (snapshot generated 2026-09-25T09:35:04.071Z).
`Q` = queue-managed. `Gen` = label generation (canon `task:status:*` vs retired `needs-human`/`task:needs-human-*`).


## missingbulb/Claudinite — 161 open (39 queue / 122 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#2295](https://github.com/missingbulb/Claudinite/issues/2295) |  | unlabelled-backlog |  | 2026-09-24 | Drop the `countWords` shim from token-estimate.mjs once every member's basics pack has converged |
| [#2287](https://github.com/missingbulb/Claudinite/issues/2287) | Q | blocked | canon | 2026-09-24 | Verify in production: a member's vendored rules arrive without provenance markers |
| [#2284](https://github.com/missingbulb/Claudinite/issues/2284) |  | unlabelled-backlog |  | 2026-09-23 | fixture-git-housekeeping goes blocking 2026-10-05 with 12 files still reporting |
| [#2277](https://github.com/missingbulb/Claudinite/issues/2277) | Q | park:approval | canon | 2026-09-23 | provenance.mjs answers from the clone's horizon on a shallow checkout |
| [#2269](https://github.com/missingbulb/Claudinite/issues/2269) | Q | park:approval | canon | 2026-09-23 | [claudinite-work] claudinite-canon-curation/growth-promote |
| [#2261](https://github.com/missingbulb/Claudinite/issues/2261) | Q | park:approval | canon | 2026-09-22 | Give a check the run's instruments, and isolate a rule that throws |
| [#2254](https://github.com/missingbulb/Claudinite/issues/2254) | Q | blocked | canon | 2026-09-24 | Retire the `static-website` pack id tolerance, and the rename map with it |
| [#2247](https://github.com/missingbulb/Claudinite/issues/2247) |  | unlabelled-backlog |  | 2026-09-22 | Merge the sibling sweep tasks inside claudinite-growth, claudinite-canon-curation and claudinite-fleet-sheepdog |
| [#2246](https://github.com/missingbulb/Claudinite/issues/2246) | Q | park:approval | canon | 2026-09-22 | A usage rule should know whether its subject could have fired at all |
| [#2243](https://github.com/missingbulb/Claudinite/issues/2243) |  | unlabelled-backlog |  | 2026-09-22 | The eight print-then-exit sites that need control flow restructured, not a token swapped |
| [#2240](https://github.com/missingbulb/Claudinite/issues/2240) | Q | blocked | canon | 2026-09-22 | Retrospective: the usage review loop |
| [#2239](https://github.com/missingbulb/Claudinite/issues/2239) | Q | blocked | canon | 2026-09-24 | Delete docs/usage-review/DESIGN.md once the loop has proven itself |
| [#2238](https://github.com/missingbulb/Claudinite/issues/2238) | Q | blocked | canon | 2026-09-22 | Verify in production: the usage review files and closes its own issues |
| [#2193](https://github.com/missingbulb/Claudinite/issues/2193) |  | unlabelled-backlog |  | 2026-09-21 | no-new-long-dashes reads a pure rename as added lines, so moving a file with long dashes fires once per line |
| [#2188](https://github.com/missingbulb/Claudinite/issues/2188) |  | unlabelled-backlog |  | 2026-09-21 | Remove the deprecated alias left by the personal-pack change |
| [#2181](https://github.com/missingbulb/Claudinite/issues/2181) | Q | blocked | canon | 2026-09-23 | Take the retired taskScheduler anchor keys off the accepted list |
| [#2173](https://github.com/missingbulb/Claudinite/issues/2173) | Q | blocked | canon | 2026-09-24 | Retrospective: provenance, a week after the shelf's last empty file fills |
| [#2172](https://github.com/missingbulb/Claudinite/issues/2172) | Q | blocked | canon | 2026-09-20 | Retrospective: provenance, a week after the marking pass |
| [#2171](https://github.com/missingbulb/Claudinite/issues/2171) | Q | blocked | canon | 2026-09-20 | Verify in production: a promote PR carries a reduced provenance file beside its marked rule |
| [#2170](https://github.com/missingbulb/Claudinite/issues/2170) | Q | blocked | canon | 2026-09-20 | Provenance L5: retire the references.md conversion tolerance at the window's end |
| [#2169](https://github.com/missingbulb/Claudinite/issues/2169) |  | unlabelled-backlog |  | 2026-09-23 | Provenance: a per-element decision log for every pack — tracking issue |
| [#2165](https://github.com/missingbulb/Claudinite/issues/2165) |  | unlabelled-backlog |  | 2026-09-20 | canon-prose-to-checks cannot write its own worklist: the inventory sits outside its automerge prediction |
| [#2163](https://github.com/missingbulb/Claudinite/issues/2163) |  | unlabelled-backlog |  | 2026-09-20 | converge-item: `--pr` on a `done` outcome plans an approval-park sentence |
| [#2139](https://github.com/missingbulb/Claudinite/issues/2139) |  | unlabelled-backlog |  | 2026-09-20 | The `task-cadence-terms` migration record probes a path #1890 moved, so it has been inert since 2026-09-14 |
| [#2137](https://github.com/missingbulb/Claudinite/issues/2137) |  | unlabelled-backlog |  | 2026-09-19 | A chain link in another repo can tick its tracker box without routing its record there — #1691's CrosswordChat link blocks retrospective #1724 |
| [#2129](https://github.com/missingbulb/Claudinite/issues/2129) | Q | park:approval | canon | 2026-09-23 | Author cloudflare-site/internal-links-omit-html-extension as a check |
| [#2128](https://github.com/missingbulb/Claudinite/issues/2128) |  | unlabelled-backlog |  | 2026-09-18 | The local-rules rehearsal fixture points $schema at a pack its member never declares, so both its modes have been red since #2058 |
| [#2126](https://github.com/missingbulb/Claudinite/issues/2126) |  | unlabelled-backlog |  | 2026-09-18 | No canon rule says a pack file may not name another pack — the owner has corrected it twice, two months apart |
| [#2125](https://github.com/missingbulb/Claudinite/issues/2125) |  | unlabelled-backlog |  | 2026-09-18 | SURFACE.GENERATED.md is stale since #2101, so pack-surface.test.mjs fails under CI on every branch |
| [#2113](https://github.com/missingbulb/Claudinite/issues/2113) |  | unlabelled-backlog |  | 2026-09-17 | Retire the cloudflare-site/bump-version.mjs shim once no member prose names it |
| [#2085](https://github.com/missingbulb/Claudinite/issues/2085) |  | unlabelled-backlog |  | 2026-09-15 | Test-suite performance: what is left, and what was ruled out |
| [#2083](https://github.com/missingbulb/Claudinite/issues/2083) |  | unlabelled-backlog |  | 2026-09-15 | converge-item.mjs prints "Waiting on a person… then close this item" onto a `done` it closes in the same plan |
| [#2077](https://github.com/missingbulb/Claudinite/issues/2077) |  | unlabelled-backlog |  | 2026-09-15 | Should the tasks usage fold count janitor repairs and leash reclaims? |
| [#2067](https://github.com/missingbulb/Claudinite/issues/2067) |  | unlabelled-backlog |  | 2026-09-15 | update-worker.test.mjs asserts on worker.mjs's source text because main() is the only way in |
| [#2023](https://github.com/missingbulb/Claudinite/issues/2023) |  | unlabelled-backlog |  | 2026-09-13 | A pack's load fails under parallel test load — cause still unidentified |
| [#2020](https://github.com/missingbulb/Claudinite/issues/2020) |  | unlabelled-backlog |  | 2026-09-13 | loadPacks drops discovery errors, so a pack that fails to load silently stops forcing its skills |
| [#2017](https://github.com/missingbulb/Claudinite/issues/2017) | Q | park:decision | canon | 2026-09-21 | Verify in production: the scheduler's weekly-window run no longer spends minutes on commit reads |
| [#2014](https://github.com/missingbulb/Claudinite/issues/2014) |  | unlabelled-backlog |  | 2026-09-13 | fleet-baseline's follow budget can exceed its own code_work_timeout, so a long follow is killed instead of reported |
| [#2012](https://github.com/missingbulb/Claudinite/issues/2012) |  | unlabelled-backlog |  | 2026-09-13 | GitHub Actions cache: where it helps Claudinite's machinery and members, and where it doesn't |
| [#2011](https://github.com/missingbulb/Claudinite/issues/2011) |  | unlabelled-backlog |  | 2026-09-13 | `fleet-baseline` has no verdict for a review-gated member, so it fails the run and parks |
| [#2010](https://github.com/missingbulb/Claudinite/issues/2010) |  | unlabelled-backlog |  | 2026-09-13 | The executor leash still parks `decision` — #1515 was fixed on the agent leash only |
| [#2000](https://github.com/missingbulb/Claudinite/issues/2000) |  | unlabelled-backlog |  | 2026-09-13 | rules-append-only and rules-line-length are in tension for any rule headline over ~96 bytes |
| [#1996](https://github.com/missingbulb/Claudinite/issues/1996) |  | unlabelled-backlog |  | 2026-09-13 | `task:origin:manual`'s description claims the woken case, which wears `task:origin:planned` |
| [#1994](https://github.com/missingbulb/Claudinite/issues/1994) |  | unlabelled-backlog |  | 2026-09-13 | The scheduler's log drops the `asked` line for a task whose standing item is live |
| [#1989](https://github.com/missingbulb/Claudinite/issues/1989) |  | unlabelled-backlog |  | 2026-09-13 | Retire the re-export shims left by dropping the rule-token metric |
| [#1988](https://github.com/missingbulb/Claudinite/issues/1988) |  | unlabelled-backlog |  | 2026-09-13 | Personal preferences: from a context-token provider to a personal pack provider |
| [#1983](https://github.com/missingbulb/Claudinite/issues/1983) |  | unlabelled-backlog |  | 2026-09-15 | Dashboard: require sign-in on its own screen, remember the credential, and put account controls under the avatar |
| [#1972](https://github.com/missingbulb/Claudinite/issues/1972) |  | unlabelled-backlog |  | 2026-09-13 | converge-item's `--pr` stamps a "waiting on a person" line onto a `done` that closes the item |
| [#1945](https://github.com/missingbulb/Claudinite/issues/1945) |  | unlabelled-backlog |  | 2026-09-12 | Two module headers cite `docs/PRINCIPLES.md` twice in one parenthesis |
| [#1944](https://github.com/missingbulb/Claudinite/issues/1944) |  | unlabelled-backlog |  | 2026-09-12 | Should a later amend run's park end the earlier run's park on the same pull request? |
| [#1927](https://github.com/missingbulb/Claudinite/issues/1927) |  | needs-decision |  | 2026-09-10 | Decision: the fleet page's wake strip has read *not read* since it shipped — pay for the read or drop the cell |
| [#1926](https://github.com/missingbulb/Claudinite/issues/1926) |  | unlabelled-backlog |  | 2026-09-10 | The Work board draws a row per PR and a row per item, not a lane per flow — `componentsOf` has no caller |
| [#1925](https://github.com/missingbulb/Claudinite/issues/1925) |  | unlabelled-backlog |  | 2026-09-10 | `taskCost` files 89% of sessions under `(unresolved)` — the `(none)` bucket is unreachable |
| [#1924](https://github.com/missingbulb/Claudinite/issues/1924) |  | unlabelled-backlog |  | 2026-09-10 | `humanSeconds` has read 0 every day since it shipped — a human turn's gap lands on an `attachment` entry |
| [#1914](https://github.com/missingbulb/Claudinite/issues/1914) |  | unlabelled-backlog |  | 2026-09-10 | Retire the executor secrets-bag reader once no member's workflow stamps one |
| [#1913](https://github.com/missingbulb/Claudinite/issues/1913) |  | unlabelled-backlog |  | 2026-09-10 | Retire the queue's `task:*` label decoders once no open item wears one |
| [#1912](https://github.com/missingbulb/Claudinite/issues/1912) |  | unlabelled-backlog |  | 2026-09-10 | Retire the integer version spelling — the canon's own migration records still declare it |
| [#1911](https://github.com/missingbulb/Claudinite/issues/1911) |  | unlabelled-backlog |  | 2026-09-10 | Retire the engine exports kept alive only by fielded pack imports |
| [#1910](https://github.com/missingbulb/Claudinite/issues/1910) |  | unlabelled-backlog |  | 2026-09-10 | The dashboard ranks `failure` parks `critical` on a lane hold the scheduler no longer performs |
| [#1909](https://github.com/missingbulb/Claudinite/issues/1909) | Q | park:approval | canon | 2026-09-22 | Retire the `barriers` and `tidy-repo` pack id tolerances |
| [#1904](https://github.com/missingbulb/Claudinite/issues/1904) |  | unlabelled-backlog |  | 2026-09-09 | A forced wake ignores `taskScheduler.disabledTasks` and runs a task the repo turned off |
| [#1891](https://github.com/missingbulb/Claudinite/issues/1891) |  | unlabelled-backlog |  | 2026-09-08 | Rule I's rationale cites a lane-hold that planSchedulerRun no longer performs |
| [#1885](https://github.com/missingbulb/Claudinite/issues/1885) |  | unlabelled-backlog |  | 2026-09-07 | Retrospective-lane review: the 0–3 / &gt;5 weekly filing bound reads a heavy-refactor week as overuse |
| [#1884](https://github.com/missingbulb/Claudinite/issues/1884) |  | unlabelled-backlog |  | 2026-09-07 | production-retrospective filing has no dedup guard — #1609 and #1624 duplicate the same subject |
| [#1881](https://github.com/missingbulb/Claudinite/issues/1881) | Q | park:decision | canon | 2026-09-23 | Retrospective: the claudinite-tasks reorganization — roles, harness, principles, rewrites, measurement |
| [#1869](https://github.com/missingbulb/Claudinite/issues/1869) |  | unlabelled-backlog |  | 2026-09-15 | Reorganize claudinite-tasks: roles as folders, the simulator as the harness, principles as the spec |
| [#1868](https://github.com/missingbulb/Claudinite/issues/1868) |  | unlabelled-backlog |  | 2026-09-07 | dedup-prune-integrity misfires on any local-pack-confined branch whose commit message says "dedup" |
| [#1849](https://github.com/missingbulb/Claudinite/issues/1849) |  | unlabelled-backlog |  | 2026-09-07 | `INCLUDE_DORMANT=true` is a no-op — the scheduler's dormancy gate runs before the forced wake |
| [#1847](https://github.com/missingbulb/Claudinite/issues/1847) |  | unlabelled-backlog |  | 2026-09-07 | claudinite-lifecycle/update's task.md narrates how its PR lands |
| [#1846](https://github.com/missingbulb/Claudinite/issues/1846) |  | unlabelled-backlog |  | 2026-09-07 | Retire the top-level `dormant` tolerance once the fleet has converged onto the pack-entry spelling |
| [#1837](https://github.com/missingbulb/Claudinite/issues/1837) |  | unlabelled-backlog |  | 2026-09-06 | The repo ledger counts a person's close of a park as "no outcome", and flags it bad |
| [#1823](https://github.com/missingbulb/Claudinite/issues/1823) |  | unlabelled-backlog |  | 2026-09-06 | forbidRemovedLinesMatching cannot see a deleted file, so updates-export-removed misses the worst case |
| [#1816](https://github.com/missingbulb/Claudinite/issues/1816) | Q | park:decision | canon | 2026-09-13 | Retrospective: the claudinite-tasks pack boundary |
| [#1806](https://github.com/missingbulb/Claudinite/issues/1806) |  | unlabelled-backlog |  | 2026-09-06 | Check that a migration record's `version` is above its pack's current version |
| [#1783](https://github.com/missingbulb/Claudinite/issues/1783) |  | unlabelled-backlog |  | 2026-09-06 | A pack migration record cannot name the version it lands at now that versions are cut on main |
| [#1759](https://github.com/missingbulb/Claudinite/issues/1759) |  | unlabelled-backlog |  | 2026-09-06 | merge-to-main's prompt trigger misses a lowercase "lgtm" |
| [#1749](https://github.com/missingbulb/Claudinite/issues/1749) |  | unlabelled-backlog |  | 2026-09-06 | Move .claudinite-settings.json into .claudinite/ |
| [#1725](https://github.com/missingbulb/Claudinite/issues/1725) |  | unlabelled-backlog |  | 2026-09-06 | Scheduling as preconditions: retire `frequency` and the schedule board |
| [#1724](https://github.com/missingbulb/Claudinite/issues/1724) | Q | park:action | canon | 2026-09-19 | Retrospective: the local-pack consolidation and the three packs it promoted |
| [#1720](https://github.com/missingbulb/Claudinite/issues/1720) |  | unlabelled-backlog |  | 2026-09-05 | A merge resolution can silently delete a VERSIONS.md row, and nothing catches it |
| [#1716](https://github.com/missingbulb/Claudinite/issues/1716) | Q | park:decision | canon | 2026-09-07 | Verify in production: the executor amends or supersedes a task's open pull request |
| [#1710](https://github.com/missingbulb/Claudinite/issues/1710) |  | unlabelled-backlog |  | 2026-09-04 | Waking verify-production mints a standing item that can only park |
| [#1704](https://github.com/missingbulb/Claudinite/issues/1704) |  | unlabelled-backlog |  | 2026-09-04 | guardToolCalls needs a session-context predicate — guard a tool in trigger-fired sessions only |
| [#1703](https://github.com/missingbulb/Claudinite/issues/1703) | Q | park:decision | canon | 2026-09-13 | Retrospective: the four-moment declared-check mechanism |
| [#1683](https://github.com/missingbulb/Claudinite/issues/1683) | Q | blocked | canon | 2026-09-24 | Retrospective: barriers folded into basics |
| [#1682](https://github.com/missingbulb/Claudinite/issues/1682) | Q | park:failure | canon | 2026-09-12 | Retire the barrier check's legacy read of packConfig.barriers |
| [#1678](https://github.com/missingbulb/Claudinite/issues/1678) |  | unlabelled-backlog |  | 2026-09-04 | Three defects bootstrap.md's fast path hit on a fresh adoption (codeload 403, retired endpoints key, a "rebuild" step that doesn't exist) |
| [#1672](https://github.com/missingbulb/Claudinite/issues/1672) |  | unlabelled-backlog |  | 2026-09-04 | Declarative checks: categorize every corpus rule, and design the mechanism additions (two-pass derive→assert, declarative work/action scope, deterministic skill triggers) |
| [#1670](https://github.com/missingbulb/Claudinite/issues/1670) |  | unlabelled-backlog |  | 2026-09-03 | The executor cannot read CLAUDINITE_TASKS_SUSPEND_ALL live (403), so a mid-run hold never reaches a running drain |
| [#1669](https://github.com/missingbulb/Claudinite/issues/1669) |  | unlabelled-backlog |  | 2026-09-03 | Update apply-stage agents park on an `action_required` conformance run instead of dispatching it on the head sha |
| [#1668](https://github.com/missingbulb/Claudinite/issues/1668) |  | unlabelled-backlog |  | 2026-09-03 | Path-scoped skill guard reads the parent transcript, so a subagent's skill loads never count |
| [#1644](https://github.com/missingbulb/Claudinite/issues/1644) |  | unlabelled-backlog |  | 2026-09-03 | Three packs' RULES.md are manuals: research-project, spec-driven-product, executable-requirements |
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
| [#1556](https://github.com/missingbulb/Claudinite/issues/1556) |  | unlabelled-backlog |  | 2026-09-06 | A member owing a withheld delivery reads as "behind", so a fleet baseline reports it as failed |
| [#1555](https://github.com/missingbulb/Claudinite/issues/1555) |  | unlabelled-backlog |  | 2026-09-01 | The staging sweep deletes on "I didn't write it this pass", which is not the same as "it was delivered" |
| [#1550](https://github.com/missingbulb/Claudinite/issues/1550) |  | unlabelled-backlog |  | 2026-09-06 | Self-test gate passes a `--root` flag `selftest.mjs` never parses |
| [#1547](https://github.com/missingbulb/Claudinite/issues/1547) |  | unlabelled-backlog |  | 2026-09-02 | Reconsider the update flow from requirements, not from the existing structure |
| [#1538](https://github.com/missingbulb/Claudinite/issues/1538) |  | unlabelled-backlog |  | 2026-08-31 | The four park kinds conflate two independent questions, and `decision` absorbs the overflow |
| [#1517](https://github.com/missingbulb/Claudinite/issues/1517) | Q | park:action | canon | 2026-09-01 | Verify in production: the re-opened withhold lane converges members without regression |
| [#1495](https://github.com/missingbulb/Claudinite/issues/1495) | Q | park:action | canon | 2026-09-01 | Verify in production: an agentic session converges its own item instead of parking |
| [#1485](https://github.com/missingbulb/Claudinite/issues/1485) |  | unlabelled-backlog |  | 2026-09-06 | task-declaration-shape passes an unresolvable `automerge` policy, and the task then silently stops being scheduled |
| [#1469](https://github.com/missingbulb/Claudinite/issues/1469) | Q | park:action | canon | 2026-08-31 | Verify in production: rename-stranded parks close, and their task starts running again |
| [#1458](https://github.com/missingbulb/Claudinite/issues/1458) | Q | park:decision | canon | 2026-09-02 | Verify in production: a retry re-arms Not-before to a future instant |
| [#1455](https://github.com/missingbulb/Claudinite/issues/1455) | Q | park:decision | canon | 2026-09-01 | Verify in production: a member's executor still starts on the single ready trigger |
| [#1428](https://github.com/missingbulb/Claudinite/issues/1428) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#1399](https://github.com/missingbulb/Claudinite/issues/1399) |  | unlabelled-backlog |  | 2026-09-06 | The update flow labels its PR with the retired bare `needs-human` |
| [#1388](https://github.com/missingbulb/Claudinite/issues/1388) |  | unlabelled-backlog |  | 2026-08-27 | Verify in production: fleet-usage task retired reaches Shepherd |
| [#1382](https://github.com/missingbulb/Claudinite/issues/1382) |  | unlabelled-backlog |  | 2026-09-06 | Retire the deleted slot scheduler's leftovers — its labels, its session-side resolver, its janitor rules |
| [#1353](https://github.com/missingbulb/Claudinite/issues/1353) | Q | park:action | canon | 2026-08-31 | Delete the updates/ shims, once no member's vendored worker names them |
| [#1346](https://github.com/missingbulb/Claudinite/issues/1346) | Q | blocked | none | 2026-09-24 | Move taskScheduler from a top-level settings key into the claudinite-tasks pack's own config |
| [#1341](https://github.com/missingbulb/Claudinite/issues/1341) |  | unlabelled-backlog |  | 2026-08-24 | Eliminate the task-janitor: fold its recovery into the scheduler run, its visibility into the dashboard |
| [#1333](https://github.com/missingbulb/Claudinite/issues/1333) |  | unlabelled-backlog |  | 2026-09-06 | claudinite-canary-repo: the withhold lane it probes no longer exists |
| [#1317](https://github.com/missingbulb/Claudinite/issues/1317) |  | unlabelled-backlog |  | 2026-09-06 | Extract the task execution/scheduling surface into a claudinite-tasks pack |
| [#1313](https://github.com/missingbulb/Claudinite/issues/1313) |  | unlabelled-backlog |  | 2026-09-06 | Gate packs/* against .claudinite/local in the barriers config |
| [#1295](https://github.com/missingbulb/Claudinite/issues/1295) |  | unlabelled-backlog |  | 2026-09-06 | A member whose Actions jobs cannot start has no escalation path — report-failure dies with everything else |
| [#1275](https://github.com/missingbulb/Claudinite/issues/1275) | Q | park:approval | retired | 2026-08-23 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#1274](https://github.com/missingbulb/Claudinite/issues/1274) | Q | park:approval | retired | 2026-08-23 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#1264](https://github.com/missingbulb/Claudinite/issues/1264) |  | unlabelled-backlog |  | 2026-09-06 | Delete the two-name settings-file tolerance once no member carries .claudinite-checks.json |
| [#1237](https://github.com/missingbulb/Claudinite/issues/1237) | Q | blocked | none | 2026-09-24 | Chain 3/3: retire the twice-daily-cron migration tolerances |
| [#1236](https://github.com/missingbulb/Claudinite/issues/1236) | Q | park:action | canon | 2026-09-06 | Chain 2/3: verify the twice-daily cron in production — 2 scheduler runs a day, not 24 |
| [#1224](https://github.com/missingbulb/Claudinite/issues/1224) |  | unlabelled-backlog |  | 2026-09-06 | Eliminate avoidable GitHub-platform assumptions from packs |
| [#1214](https://github.com/missingbulb/Claudinite/issues/1214) |  | unlabelled-backlog |  | 2026-09-06 | Engine: executor drains until empty; scheduler drain job dispatches only when work is pickable |
| [#1174](https://github.com/missingbulb/Claudinite/issues/1174) |  | unlabelled-backlog |  | 2026-09-06 | fleet-baseline can only force `update` — there is no lever for any other task fleet-wide |
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

## missingbulb/GoogleCalendarEventCreator — 34 open (11 queue / 23 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#1315](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1315) |  | unlabelled-backlog |  | 2026-09-23 | PR #1314 self-merged past its automerge ceiling: task.json is a policy source, never coverable |
| [#1260](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1260) |  | unlabelled-backlog |  | 2026-09-16 | Executor routine's stored prompt still names the retired queue/instructions.md path |
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
| [#1041](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1041) |  | unlabelled-backlog |  | 2026-09-20 | prose-to-checks conversion backlog: gcec pack |
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

## missingbulb/TLDR — 22 open (6 queue / 16 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#608](https://github.com/missingbulb/TLDR/issues/608) |  | unlabelled-backlog |  | 2026-09-24 | .gitignore is missing .claudinite/temp/, causing false-positive Stop-hook blocks |
| [#545](https://github.com/missingbulb/TLDR/issues/545) |  | unlabelled-backlog |  | 2026-09-16 | Executor routine's stored prompt points at a path instructions.md no longer lives at |
| [#508](https://github.com/missingbulb/TLDR/issues/508) | Q | park:approval | canon | 2026-09-13 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
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

## missingbulb/MissingBulbWebsite — 21 open (8 queue / 13 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#479](https://github.com/missingbulb/MissingBulbWebsite/issues/479) |  | unlabelled-backlog |  | 2026-09-20 | Local pack claims actions_list per_page never shrinks payload — canon now says it does |
| [#421](https://github.com/missingbulb/MissingBulbWebsite/issues/421) |  | unlabelled-backlog |  | 2026-09-15 | Repoint the executor routine's stored prompt at public/instructions.md |
| [#380](https://github.com/missingbulb/MissingBulbWebsite/issues/380) | Q | park:approval | canon | 2026-09-13 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#346](https://github.com/missingbulb/MissingBulbWebsite/issues/346) | Q | park:approval | canon | 2026-09-07 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
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

## missingbulb/Shepherd — 19 open (11 queue / 8 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#754](https://github.com/missingbulb/Shepherd/issues/754) | Q | running-executor | canon | 2026-09-25 | [claudinite-work] shepherd/fleet-issues-snapshot |
| [#753](https://github.com/missingbulb/Shepherd/issues/753) | Q | waiting-for-executor | canon | 2026-09-25 | [claudinite-work] claudinite-tasks/usage-fold |
| [#752](https://github.com/missingbulb/Shepherd/issues/752) | Q | waiting-for-executor | canon | 2026-09-25 | [claudinite-work] claudinite-tasks/tasks-usage-fold |
| [#748](https://github.com/missingbulb/Shepherd/issues/748) | Q | waiting-for-executor | canon | 2026-09-25 | [claudinite-work] claudinite-fleet-sheepdog/fleet-pack-seeds |
| [#746](https://github.com/missingbulb/Shepherd/issues/746) | Q | park:failure | canon | 2026-09-24 | [claudinite-work] shepherd/fleet-issues-snapshot |
| [#742](https://github.com/missingbulb/Shepherd/issues/742) | Q | park:approval | canon | 2026-09-24 | [claudinite-work] claudinite-lifecycle/update |
| [#685](https://github.com/missingbulb/Shepherd/issues/685) | Q | park:approval | canon | 2026-09-20 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#617](https://github.com/missingbulb/Shepherd/issues/617) |  | unlabelled-backlog |  | 2026-09-15 | Two tasks in one executor run died on vendored modules that are present at the sha it checked out |
| [#606](https://github.com/missingbulb/Shepherd/issues/606) |  | unlabelled-backlog |  | 2026-09-15 | Support using github projects for task chains of more than 2 |
| [#540](https://github.com/missingbulb/Shepherd/issues/540) |  | unlabelled-backlog |  | 2026-09-10 | Dashboard sign-in: no way to measure button use vs. token-box use |
| [#420](https://github.com/missingbulb/Shepherd/issues/420) |  | unlabelled-backlog |  | 2026-09-02 | Fleet triage 2026-09-02: 53% of parks sit in a kind no rule can drain |
| [#396](https://github.com/missingbulb/Shepherd/issues/396) | Q | park:action | canon | 2026-09-02 | Align local pack rules and skills to the writing-pack-prose references convention |
| [#395](https://github.com/missingbulb/Shepherd/issues/395) |  | unlabelled-backlog |  | 2026-09-01 | Fleet: file ad-hoc tasks to align every member's local packs to the writing-pack-prose convention |
| [#352](https://github.com/missingbulb/Shepherd/issues/352) |  | unlabelled-backlog |  | 2026-09-10 | Turn dashboard sign-in on: register the GitHub App, then run deploy-oauth-exchange |
| [#333](https://github.com/missingbulb/Shepherd/issues/333) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#332](https://github.com/missingbulb/Shepherd/issues/332) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#212](https://github.com/missingbulb/Shepherd/issues/212) | Q | park:approval | retired | 2026-08-23 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#169](https://github.com/missingbulb/Shepherd/issues/169) |  | fleet-drift |  | 2026-09-07 | Claudinite mount has fallen behind on missingbulb/vascularcoloring |
| [#137](https://github.com/missingbulb/Shepherd/issues/137) |  | unlabelled-backlog |  | 2026-09-06 | The dashboard's morning-brief panel is off, on the repo that writes the briefs |

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

## missingbulb/VascularColoring — 13 open (6 queue / 7 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#463](https://github.com/missingbulb/VascularColoring/issues/463) | Q | park:approval | canon | 2026-09-20 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#460](https://github.com/missingbulb/VascularColoring/issues/460) |  | unlabelled-backlog |  | 2026-09-20 | Adopt canon pack: numpy-image-processing |
| [#436](https://github.com/missingbulb/VascularColoring/issues/436) |  | unlabelled-backlog |  | 2026-09-16 | Executor routine's stored prompt still points at queue/instructions.md, which moved to public/ in #422 |
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
| [#512](https://github.com/missingbulb/CrosswordChat/issues/512) | Q | park:approval | canon | 2026-09-20 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#453](https://github.com/missingbulb/CrosswordChat/issues/453) | Q | park:approval | canon | 2026-09-13 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#421](https://github.com/missingbulb/CrosswordChat/issues/421) |  | unlabelled-backlog |  | 2026-09-07 | ci-performance worker.mjs: unpaginated top-100 fetch starves the previous-window sample for low-frequency workflows |
| [#419](https://github.com/missingbulb/CrosswordChat/issues/419) | Q | park:approval | canon | 2026-09-07 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#352](https://github.com/missingbulb/CrosswordChat/issues/352) |  | unlabelled-backlog |  | 2026-08-30 | Chrome Web Store release pipeline is a generation behind the chrome-extension pack |
| [#304](https://github.com/missingbulb/CrosswordChat/issues/304) |  | unlabelled-backlog |  | 2026-08-23 | Connect the Claude GitHub App: converge-item.mjs can't reach the GitHub API from a dispatched session |
| [#256](https://github.com/missingbulb/CrosswordChat/issues/256) | Q | park:decision | retired | 2026-08-23 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#211](https://github.com/missingbulb/CrosswordChat/issues/211) |  | unlabelled-backlog |  | 2026-09-06 | Recurring vitest cold-start timeout in visual-snapshots.test.js (help-page) |
| [#63](https://github.com/missingbulb/CrosswordChat/issues/63) |  | unlabelled-backlog |  | 2026-07-19 | Manual check: mic indicator clears on bfcache/back-forward teardown (verifies PR #62 pagehide path) |
| [#11](https://github.com/missingbulb/CrosswordChat/issues/11) |  | unlabelled-backlog |  | 2026-07-05 | Live check: mic never goes deaf after clicks; barge-in reliability (MT-13, MT-27) |
| [#9](https://github.com/missingbulb/CrosswordChat/issues/9) |  | unlabelled-backlog |  | 2026-07-09 | Live check: grid-full "next" moves on; "seven across" jumps to the clue (MT-09) |
| [#6](https://github.com/missingbulb/CrosswordChat/issues/6) |  | unlabelled-backlog |  | 2026-07-09 | Live check: penciling on forced answers works on the real page (MT-29, MT-07) |

## missingbulb/ClaudiniteCanary — 9 open (6 queue / 3 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#538](https://github.com/missingbulb/ClaudiniteCanary/issues/538) | Q | waiting-for-executor | canon | 2026-09-25 | [claudinite-work] claudinite-tasks/usage-fold |
| [#537](https://github.com/missingbulb/ClaudiniteCanary/issues/537) | Q | waiting-for-executor | canon | 2026-09-25 | [claudinite-work] claudinite-tasks/tasks-usage-fold |
| [#536](https://github.com/missingbulb/ClaudiniteCanary/issues/536) | Q | waiting-for-executor | canon | 2026-09-25 | [claudinite-work] claudinite-lifecycle/update |
| [#535](https://github.com/missingbulb/ClaudiniteCanary/issues/535) | Q | waiting-for-executor | canon | 2026-09-25 | [claudinite-work] claudinite-dashboard/publish-pages |
| [#510](https://github.com/missingbulb/ClaudiniteCanary/issues/510) | Q | park:failure | canon | 2026-09-22 | Claudinite scheduler run failed |
| [#448](https://github.com/missingbulb/ClaudiniteCanary/issues/448) |  | unlabelled-backlog |  | 2026-09-16 | Repoint the executor routine's stored prompt at public/instructions.md |
| [#373](https://github.com/missingbulb/ClaudiniteCanary/issues/373) |  | unlabelled-backlog |  | 2026-09-07 | Issue #322 stuck: closed by its own PR's `Closes #N` before queue convergence, still wearing task:status:running-agent |
| [#283](https://github.com/missingbulb/ClaudiniteCanary/issues/283) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#239](https://github.com/missingbulb/ClaudiniteCanary/issues/239) |  | unlabelled-backlog |  | 2026-08-23 | converge-item.mjs has no MCP-compatible agent-lane path — a session cannot perform queue instructions.md step 6 |

## missingbulb/EdFringeNow — 9 open (4 queue / 5 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#876](https://github.com/missingbulb/EdFringeNow/issues/876) |  | unlabelled-backlog |  | 2026-09-24 | Turn on live flight fares: Travelpayouts account, token and marker |
| [#872](https://github.com/missingbulb/EdFringeNow/issues/872) |  | unlabelled-backlog |  | 2026-09-24 | Convert the remaining GitHub Actions workflows to Claudinite tasks |
| [#575](https://github.com/missingbulb/EdFringeNow/issues/575) | Q | park:decision | canon | 2026-09-22 | Backfill the local pack's empty provenance files |
| [#314](https://github.com/missingbulb/EdFringeNow/issues/314) | Q | park:approval | canon | 2026-09-21 | Replace per-file cache TTLs with a published manifest |
| [#295](https://github.com/missingbulb/EdFringeNow/issues/295) | Q | park:approval | canon | 2026-09-21 | The site lists shows edfringe has withdrawn — nothing removes them from the master |
| [#294](https://github.com/missingbulb/EdFringeNow/issues/294) | Q | blocked | canon | 2026-09-23 | Quote fee-inclusive totals, and fix the recorded `fee` they depend on |
| [#237](https://github.com/missingbulb/EdFringeNow/issues/237) |  | unlabelled-backlog |  | 2026-08-17 | Upstream: baselining's deliver() leaves the scheduler checkout on its maintenance branch |
| [#164](https://github.com/missingbulb/EdFringeNow/issues/164) |  | quick-win |  | 2026-09-07 | Monetization: join Booking.com + Omio and paste the IDs into shared/affiliates.js |
| [#161](https://github.com/missingbulb/EdFringeNow/issues/161) |  | quick-win |  | 2026-09-07 | Monetization: join the 4 affiliate programmes and paste the IDs into js/places.js |

## missingbulb/NoRFinder — 8 open (0 queue / 8 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#148](https://github.com/missingbulb/NoRFinder/issues/148) |  | unlabelled-backlog |  | 2026-09-21 | .claudinite/temp/ is untracked but not gitignored, tripping skill-loaded-before-editing every session |
| [#126](https://github.com/missingbulb/NoRFinder/issues/126) |  | unlabelled-backlog |  | 2026-09-20 | Adopt canon pack: numpy-image-processing |
| [#102](https://github.com/missingbulb/NoRFinder/issues/102) |  | unlabelled-backlog |  | 2026-09-16 | Work-item routine's stored prompt still names the pre-move queue/instructions.md path |
| [#40](https://github.com/missingbulb/NoRFinder/issues/40) |  | unlabelled-backlog |  | 2026-09-07 | README badge row references packs that are no longer declared or vendored |
| [#32](https://github.com/missingbulb/NoRFinder/issues/32) |  | unlabelled-backlog |  | 2026-09-06 | Hand-over: three repository settings Claudinite delivery depends on |
| [#17](https://github.com/missingbulb/NoRFinder/issues/17) |  | unlabelled-backlog |  | 2026-09-05 | tests/test_invariance.py runs in no gate |
| [#16](https://github.com/missingbulb/NoRFinder/issues/16) |  | unlabelled-backlog |  | 2026-09-05 | Declare the Python imaging stack as a local-pack env requirement |
| [#4](https://github.com/missingbulb/NoRFinder/issues/4) |  | schedule-board |  | 2026-09-07 | [claudinite-schedule] the schedule board |

## missingbulb/ClaudiniteWebsite — 5 open (1 queue / 4 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#624](https://github.com/missingbulb/ClaudiniteWebsite/issues/624) |  | unlabelled-backlog |  | 2026-09-20 | site-release's unreleased-commits gate is broader than the site it publishes — 82% of week-1 releases shipped no visible change |
| [#565](https://github.com/missingbulb/ClaudiniteWebsite/issues/565) |  | unlabelled-backlog |  | 2026-09-16 | Executor routine's stored prompt still names the pre-#549 path (queue/instructions.md) |
| [#533](https://github.com/missingbulb/ClaudiniteWebsite/issues/533) |  | unlabelled-backlog |  | 2026-09-13 | git-github-advanced gap: `git rebase --continue`'s default cleanup silently drops commit-message lines starting with `#` |
| [#316](https://github.com/missingbulb/ClaudiniteWebsite/issues/316) |  | blocked |  | 2026-09-07 | Canon patch (blocked on push scope): dedup-prune-integrity flags the VERSIONS.md row growth-dedup's own task doc mandates |
| [#285](https://github.com/missingbulb/ClaudiniteWebsite/issues/285) | Q | park:decision | retired | 2026-08-26 | Verify in production: the redesigned site with the compounding chart |

## missingbulb/LaughCounter — 3 open (1 queue / 2 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#343](https://github.com/missingbulb/LaughCounter/issues/343) |  | unlabelled-backlog |  | 2026-09-06 | This repo fingerprints the `macos` pack but does not declare it, and its DMG release plumbing is unowned |
| [#174](https://github.com/missingbulb/LaughCounter/issues/174) |  | unlabelled-backlog |  | 2026-09-06 | Distribute LaughCounter via Homebrew Cask (own tap) |
| [#26](https://github.com/missingbulb/LaughCounter/issues/26) | Q | bare-needs-human | retired | 2026-08-17 | [needs-human] Enable Developer ID signing + notarization for the DMG |
