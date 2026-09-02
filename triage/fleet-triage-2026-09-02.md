# Fleet triage — 2026-09-02

349 open issues, 16 repos, snapshot `2026-09-02T11:56:15Z`. **133 queue-managed / 216 plain.**
Collected from the fleet-issues snapshot this repo generates; cuts reproducible with the
fleet-triage skill's own classifier.

## Headline: 53% of parks are in a kind that no rule can drain

Read fresh from canon this run, not from any table:

- `isBlockingPark` (`queue/work-item.mjs:165`) = **`failure` only**.
- `SUPERSEDABLE_PARKS` (`queue/janitor-rules.mjs:27`) = **`failure`, `action`**.

Crossing those two against the 129 parked items:

| kind | n | holds the lane | a later clean run clears it |
|---|---|---|---|
| failure | 36 | **yes** | yes (but see below) |
| decision | 40 | no | **no** |
| approval | 25 | no | **no** |
| action | 24 | no | yes |
| bare (no kind) | 4 | yes (falls back to failure) | no |

**69 of 129 parks (53%) are `decision`/`approval`/bare — neither blocking nor supersedable.**
Their lane keeps filing fresh occurrences around them (that is the 22 duplicated lanes / 31
redundant items) while nothing mechanical ever clears the park itself. They accumulate strictly
monotonically. Canon already has this open as Claudinite#1538 ("the four park kinds conflate two
independent questions, and `decision` absorbs the overflow").

**And `failure`'s drain is unreachable in practice.** Rule E needs a later run of the same task to
converge `done` *strictly after* this item's last touch — but a `failure` park holds the lane, so
the scheduler files no later occurrence, so no such run can exist. A `failure` park is cleared
only by rule F (task retired/relocated) or by a human re-queueing by hand. Blocking + supersedable
reads like a drain and is a deadlock.

## The `decision` cohort is largely mislabelled dead-agent parks

Timestamp clustering, then a sampled thread, settle this:

| cluster | n | kinds | repos |
|---|---|---|---|
| 2026-08-30T16:00 | 17 | **all `decision`** | 8 |
| 2026-09-01T16:38 | 19 | **all `failure`** | 8 |
| 2026-09-01T16:37 | 13 | **all `failure`** | 3 |

Each cluster is homogeneous in kind across many repos within one minute — one rule, one sweep.
Sampled Shepherd#331 (labelled `decision`): its last comment is verbatim rule B, the dead-agent
leash — *"has carried `task:status:running-agent` for over 3h with no activity … Parking it for a
human."* Canon's rule B writes `NEEDS_HUMAN_FAILURE`. So the pre-2026-09-01 engine wrote that same
reclaim as `decision`, and the label was corrected between 08-30 and 09-01.

Consequence: **~32 items sit in `decision` describing a dead agent, not a decision anyone owes.**
They read to a human as "choose something" and to the machine as undrainable. The post-fix `failure`
spelling is correct but lands them in the deadlock above instead.

Sampling also **killed** a tempting hypothesis before it reached this report: the 40 retired-label
items are *not* invisible to the janitor — `LEGACY_PARK_RE` (`work-item.mjs:181`) folds
`task:needs-human-<kind>` into today's status on read, so every rule sees them normally.

## Lane cost: 179 missed runs, not 11

Measured from `created_at` against each task's declared `frequency` at HEAD. **`updated_at`
understates this by 16×** — the 2026-09-01 relabel sweep reset that clock on 32 items, so the
naive read says 11 missed runs. The parks are old; only their labels are new.

Worst lanes: VascularColoring#156 and ClaudiniteCanary#126 (`growth-extract`, daily, 13 missed
each), Shepherd#117 (12), Claudinite#1146 (`tidy-issues`, daily, 12).

`growth-extract` and `tidy-issues` are daily and dominate the cost; the weekly `claudinite-growth`
tasks dominate the *count*. Four tasks — `rule-revalidation` (24), `prose-to-checks-sweep` (21),
`growth-dedup` (12), `growth-extract` (10) — are 67 of the 106 items on `[claudinite-work]` lanes.

## Not everything in `failure` is a mislabel

Shepherd#411, parked today, is a genuine code-work crash: `fleet-baseline failed: 1 of 13
dispatched member(s) did not reach canon's versions (googlecalendareventcreator:
did-not-converge)`. Real, current, and correctly parked. The `failure` cohort is
~32 relabelled dead-agent reclaims + a handful of true crashes; don't clear it wholesale.

## Approval parks: rule G is blind to the ones with no `Ends-when`

Shepherd#333 is a *correct* approval park — the agent did the work, opened a PR, and said
"merge or close #346, then close this item". But its body carries **no `Ends-when:` field**, and
rule G keys entirely on that field. Nothing can ever end it mechanically, however #346 resolves.

This is unmeasurable fleet-wide right now: **the snapshot omits issue bodies**, so `Ends-when`,
`Blocked-by` and the worker path can't be read from it. That is the one concrete gap worth
fixing in the fleet-issues-snapshot task before the next run.

## R1 confirmed, and still minting work

Shepherd#117 is the canonical R1: the agent finished the job (#120 merged, 5 lessons landed), then
posted *"this item cannot be converged in code — 403 GitHub access is not enabled for this
session"*, and rule B reclaimed it a day later. The work is done; only the bookkeeping failed.
This is the repo's own documented `converge-item.mjs` dead end, and it keeps producing parks.

## Plain issues — 216

`unlabelled-backlog` 69, `quick-win` 36, `needs-decision` 33, `tidy-tracker` 27, `blocked` 22,
`schedule-board` 14, `add-packs` 6, `fleet-drift` 4, `workflow-failure` 4, `plan-tracking` 1.

**Chase first — two members may not be running tasks at all:**

- ClaudiniteWebsite#204 — "Claudinite scheduler run failed", open since 2026-08-23.
- EdFringeNow#401 — same, open since **2026-08-18**.

Every count reported for those two describes a queue nothing has swept since. TLDR#93/#94 are
release-workflow failures, unrelated to the scheduler.

## Recommendations — none of this is actioned by this run

1. **Fix the drain, not the items.** Re-labelling 32 `decision` parks by hand is a day's work that
   recurs next sweep. Claudinite#1538 is the right place; the fix is a park kind whose
   *recoverability* is independent of whose inbox it is.
2. **Break the `failure` deadlock** — let rule E consider a later clean run on a lane the park
   itself is freezing, or exempt a blocking park from the family filter once superseded.
3. **Chase the two frozen schedulers** before trusting any other count for those members.
4. **Add bodies to the snapshot** so `Ends-when`/`Blocked-by` become measurable.
5. **Backfill `Ends-when`** on approval parks, or rule G stays blind to them.

---
# Fleet triage — every open issue, 2026-09-02

349 open issues across 16 in-scope repos under `missingbulb` (snapshot generated 2026-09-02T11:56:15.335Z).
`Q` = queue-managed. `Gen` = label generation (canon `task:status:*` vs retired `needs-human`/`task:needs-human-*`).


## missingbulb/Claudinite — 91 open (21 queue / 70 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#1596](https://github.com/missingbulb/Claudinite/issues/1596) |  | unlabelled-backlog |  | 2026-09-02 | No gha/* check has ever scanned a workflow stub, so a seeded workflow's defects ship fleet-wide unseen |
| [#1595](https://github.com/missingbulb/Claudinite/issues/1595) |  | unlabelled-backlog |  | 2026-09-02 | claudinite-dashboard: the Pages stub pipes without a bash default, so its cache key can fail green |
| [#1594](https://github.com/missingbulb/Claudinite/issues/1594) |  | unlabelled-backlog |  | 2026-09-02 | claudinite-dashboard: the Cloudflare token step leaves three form fields unanswered, and overstates how narrow the template is |
| [#1592](https://github.com/missingbulb/Claudinite/issues/1592) |  | unlabelled-backlog |  | 2026-09-02 | writing-handover-issues: pair each value-producing step with the step that pastes it |
| [#1590](https://github.com/missingbulb/Claudinite/issues/1590) |  | unlabelled-backlog |  | 2026-09-02 | claudinite-dashboard: the sign-in checklist names a field the App form no longer has, omits the step it refuses without, and asks for a secret GitHub will not create |
| [#1589](https://github.com/missingbulb/Claudinite/issues/1589) |  | unlabelled-backlog |  | 2026-09-02 | A second push to an agent-opened PR gets no CI, and nothing says so |
| [#1584](https://github.com/missingbulb/Claudinite/issues/1584) | Q | park:approval | canon | 2026-09-02 | [claudinite-work] claudinite-canon-curation/growth-promote |
| [#1581](https://github.com/missingbulb/Claudinite/issues/1581) |  | unlabelled-backlog |  | 2026-09-01 | Fleet dashboard: show what the corpus does across the fleet, from the members' usage folds |
| [#1580](https://github.com/missingbulb/Claudinite/issues/1580) |  | unlabelled-backlog |  | 2026-09-01 | Retrospective: the declarative preconditions in production |
| [#1579](https://github.com/missingbulb/Claudinite/issues/1579) |  | unlabelled-backlog |  | 2026-09-01 | Validate the preconditions system live |
| [#1572](https://github.com/missingbulb/Claudinite/issues/1572) |  | unlabelled-backlog |  | 2026-09-02 | Declarative task preconditions + the repo-active silence gate |
| [#1570](https://github.com/missingbulb/Claudinite/issues/1570) | Q | park:action | canon | 2026-09-01 | [claudinite-work] claudinite-canon-curation/upstream-watch |
| [#1556](https://github.com/missingbulb/Claudinite/issues/1556) |  | blocked |  | 2026-09-01 | A member owing a withheld delivery reads as "behind", so a fleet baseline reports it as failed |
| [#1555](https://github.com/missingbulb/Claudinite/issues/1555) |  | unlabelled-backlog |  | 2026-09-01 | The staging sweep deletes on "I didn't write it this pass", which is not the same as "it was delivered" |
| [#1550](https://github.com/missingbulb/Claudinite/issues/1550) |  | quick-win |  | 2026-09-01 | Self-test gate passes a `--root` flag `selftest.mjs` never parses |
| [#1547](https://github.com/missingbulb/Claudinite/issues/1547) |  | unlabelled-backlog |  | 2026-09-02 | Reconsider the update flow from requirements, not from the existing structure |
| [#1542](https://github.com/missingbulb/Claudinite/issues/1542) | Q | park:approval | canon | 2026-08-31 | VERSIONS.md rows have no ordering standard — sort them newest-first and enforce it |
| [#1538](https://github.com/missingbulb/Claudinite/issues/1538) |  | unlabelled-backlog |  | 2026-08-31 | The four park kinds conflate two independent questions, and `decision` absorbs the overflow |
| [#1519](https://github.com/missingbulb/Claudinite/issues/1519) | Q | blocked | canon | 2026-08-31 | Retrospective: the production-retrospective lane |
| [#1517](https://github.com/missingbulb/Claudinite/issues/1517) | Q | park:action | canon | 2026-09-01 | Verify in production: the re-opened withhold lane converges members without regression |
| [#1495](https://github.com/missingbulb/Claudinite/issues/1495) | Q | park:action | canon | 2026-09-01 | Verify in production: an agentic session converges its own item instead of parking |
| [#1485](https://github.com/missingbulb/Claudinite/issues/1485) |  | quick-win |  | 2026-08-31 | task-declaration-shape passes an unresolvable `automerge` policy, and the task then silently stops being scheduled |
| [#1478](https://github.com/missingbulb/Claudinite/issues/1478) |  | unlabelled-backlog |  | 2026-08-30 | Re-shelve claudinite-tasks by stage: src/ for the code, queue/ frozen as workflow ABI |
| [#1469](https://github.com/missingbulb/Claudinite/issues/1469) | Q | park:action | canon | 2026-08-31 | Verify in production: rename-stranded parks close, and their task starts running again |
| [#1458](https://github.com/missingbulb/Claudinite/issues/1458) | Q | park:decision | canon | 2026-09-02 | Verify in production: a retry re-arms Not-before to a future instant |
| [#1455](https://github.com/missingbulb/Claudinite/issues/1455) | Q | park:decision | canon | 2026-09-01 | Verify in production: a member's executor still starts on the single ready trigger |
| [#1428](https://github.com/missingbulb/Claudinite/issues/1428) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#1399](https://github.com/missingbulb/Claudinite/issues/1399) |  | needs-decision |  | 2026-08-28 | The update flow labels its PR with the retired bare `needs-human` |
| [#1388](https://github.com/missingbulb/Claudinite/issues/1388) |  | unlabelled-backlog |  | 2026-08-27 | Verify in production: fleet-usage task retired reaches Shepherd |
| [#1382](https://github.com/missingbulb/Claudinite/issues/1382) |  | blocked |  | 2026-08-28 | Retire the deleted slot scheduler's leftovers — its labels, its session-side resolver, its janitor rules |
| [#1362](https://github.com/missingbulb/Claudinite/issues/1362) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-extract |
| [#1353](https://github.com/missingbulb/Claudinite/issues/1353) | Q | park:action | canon | 2026-08-31 | Delete the updates/ shims, once no member's vendored worker names them |
| [#1347](https://github.com/missingbulb/Claudinite/issues/1347) |  | unlabelled-backlog |  | 2026-08-24 | Merge the dispatch simulator into the scheduler codebase — the sim becomes a test harness |
| [#1346](https://github.com/missingbulb/Claudinite/issues/1346) | Q | blocked | none | 2026-09-02 | Move taskScheduler from a top-level settings key into the claudinite-tasks pack's own config |
| [#1341](https://github.com/missingbulb/Claudinite/issues/1341) |  | unlabelled-backlog |  | 2026-08-24 | Eliminate the task-janitor: fold its recovery into the scheduler run, its visibility into the dashboard |
| [#1333](https://github.com/missingbulb/Claudinite/issues/1333) |  | needs-decision |  | 2026-08-31 | claudinite-canary-repo: the withhold lane it probes no longer exists |
| [#1332](https://github.com/missingbulb/Claudinite/issues/1332) |  | blocked |  | 2026-08-25 | claudinite-tasks L3: observe one full queue cycle fleet-wide from the pack paths |
| [#1331](https://github.com/missingbulb/Claudinite/issues/1331) |  | blocked |  | 2026-08-25 | claudinite-tasks L2: repoint every member's workflow run: lines and routine prompts |
| [#1330](https://github.com/missingbulb/Claudinite/issues/1330) |  | unlabelled-backlog |  | 2026-08-24 | claudinite-tasks L1: force fleet-baseline, and read the pack version off every stamp |
| [#1328](https://github.com/missingbulb/Claudinite/issues/1328) |  | blocked |  | 2026-08-25 | claudinite-tasks extraction: delete the legacy shims (gated tail) |
| [#1324](https://github.com/missingbulb/Claudinite/issues/1324) |  | blocked |  | 2026-08-25 | L4: merge the gated tail — delete the engine/scheduler skew shims |
| [#1323](https://github.com/missingbulb/Claudinite/issues/1323) |  | blocked |  | 2026-08-25 | L3: observe one full queue cycle fleet-wide on the pack paths |
| [#1322](https://github.com/missingbulb/Claudinite/issues/1322) |  | blocked |  | 2026-08-25 | L2: manual fleet pass — repoint member workflows and routine prompts to the pack paths |
| [#1321](https://github.com/missingbulb/Claudinite/issues/1321) |  | needs-decision |  | 2026-08-30 | L1: fleet-baseline follow — every member's mount carries claudinite-tasks |
| [#1317](https://github.com/missingbulb/Claudinite/issues/1317) |  | unlabelled-backlog |  | 2026-08-24 | Extract the task execution/scheduling surface into a claudinite-tasks pack |
| [#1313](https://github.com/missingbulb/Claudinite/issues/1313) |  | quick-win |  | 2026-08-25 | Gate packs/* against .claudinite/local in the barriers config |
| [#1295](https://github.com/missingbulb/Claudinite/issues/1295) |  | needs-decision |  | 2026-08-31 | A member whose Actions jobs cannot start has no escalation path — report-failure dies with everything else |
| [#1275](https://github.com/missingbulb/Claudinite/issues/1275) | Q | park:approval | retired | 2026-08-23 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#1274](https://github.com/missingbulb/Claudinite/issues/1274) | Q | park:approval | retired | 2026-08-23 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#1271](https://github.com/missingbulb/Claudinite/issues/1271) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-dedup |
| [#1264](https://github.com/missingbulb/Claudinite/issues/1264) |  | blocked |  | 2026-08-31 | Delete the two-name settings-file tolerance once no member carries .claudinite-checks.json |
| [#1237](https://github.com/missingbulb/Claudinite/issues/1237) | Q | blocked | none | 2026-09-02 | Chain 3/3: retire the twice-daily-cron migration tolerances |
| [#1236](https://github.com/missingbulb/Claudinite/issues/1236) | Q | park:action | canon | 2026-08-31 | Chain 2/3: verify the twice-daily cron in production — 2 scheduler runs a day, not 24 |
| [#1224](https://github.com/missingbulb/Claudinite/issues/1224) |  | needs-decision |  | 2026-08-23 | Eliminate avoidable GitHub-platform assumptions from packs |
| [#1214](https://github.com/missingbulb/Claudinite/issues/1214) |  | quick-win |  | 2026-08-25 | Engine: executor drains until empty; scheduler drain job dispatches only when work is pickable |
| [#1174](https://github.com/missingbulb/Claudinite/issues/1174) |  | quick-win |  | 2026-08-23 | fleet-baseline can only force `update` — there is no lever for any other task fleet-wide |
| [#1169](https://github.com/missingbulb/Claudinite/issues/1169) | Q | park:approval | canon | 2026-08-31 | Dissolve docs/skill-usage-metrics/DESIGN.md into the packs that own its subjects |
| [#1160](https://github.com/missingbulb/Claudinite/issues/1160) | Q | park:decision | canon | 2026-08-31 | Verify in production: an extension repo still ships to the store now the pipeline never bumps |
| [#1146](https://github.com/missingbulb/Claudinite/issues/1146) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] tidy-repo/tidy-issues |
| [#1137](https://github.com/missingbulb/Claudinite/issues/1137) |  | needs-decision |  | 2026-09-01 | Verify in production: the next real adoption is fast, measured from its captured bootstrap log |
| [#1130](https://github.com/missingbulb/Claudinite/issues/1130) |  | schedule-board |  | 2026-09-02 | [claudinite-schedule] the schedule board |
| [#1113](https://github.com/missingbulb/Claudinite/issues/1113) |  | needs-decision |  | 2026-09-01 | Verify in production: members re-stamp with date-anchored versions |
| [#1112](https://github.com/missingbulb/Claudinite/issues/1112) |  | needs-decision |  | 2026-09-01 | Verify in production: a member's un-converged workflow still starts a scheduler run through the `tick.mjs` shim |
| [#1106](https://github.com/missingbulb/Claudinite/issues/1106) |  | unlabelled-backlog |  | 2026-08-20 | Remove the legacy single-integer version tolerance |
| [#1096](https://github.com/missingbulb/Claudinite/issues/1096) |  | quick-win |  | 2026-08-28 | Every executor run logs `could not reconcile label "claude-automerge": 404` |
| [#1078](https://github.com/missingbulb/Claudinite/issues/1078) |  | unlabelled-backlog |  | 2026-08-19 | Human-only: trace the request mode refusing an unauthorized mark, live |
| [#1073](https://github.com/missingbulb/Claudinite/issues/1073) |  | blocked |  | 2026-08-20 | Move the Chrome Web Store release pipeline into Claudinite tasks |
| [#1072](https://github.com/missingbulb/Claudinite/issues/1072) |  | quick-win |  | 2026-08-20 | Production code must not reference its tests — land it as a check |
| [#1050](https://github.com/missingbulb/Claudinite/issues/1050) |  | quick-win |  | 2026-08-28 | Collapse the `needs-human` pair into one label — by 2026-08-26 |
| [#1010](https://github.com/missingbulb/Claudinite/issues/1010) |  | blocked |  | 2026-08-20 | Ad-hoc tasks: let the owner mark an issue for Claude to implement |
| [#1003](https://github.com/missingbulb/Claudinite/issues/1003) |  | unlabelled-backlog |  | 2026-08-18 | Manual: register this fleet owner's GitHub App and deploy its token exchange |
| [#996](https://github.com/missingbulb/Claudinite/issues/996) |  | blocked |  | 2026-08-19 | dashboard: sign-in is the only route to a usable rate limit — wire it for the fleet deployment |
| [#991](https://github.com/missingbulb/Claudinite/issues/991) |  | unlabelled-backlog |  | 2026-08-18 | Promote conformance-work-scope to blocking once the fleet carries the step |
| [#952](https://github.com/missingbulb/Claudinite/issues/952) |  | quick-win |  | 2026-08-18 | bootstrap.md Part 9 names a vendored path that cannot exist |
| [#926](https://github.com/missingbulb/Claudinite/issues/926) |  | needs-decision |  | 2026-09-01 | The declarative vocabulary has never reached a member's local pack — fleet census, and the one key that is missing |
| [#923](https://github.com/missingbulb/Claudinite/issues/923) |  | quick-win |  | 2026-08-17 | Fold the last comment-stripper twin into `stripComments` with a `preserveOffsets` option |
| [#920](https://github.com/missingbulb/Claudinite/issues/920) |  | quick-win |  | 2026-08-17 | sharedMount's path regex is mount-only, so the signal is dead in the canon home |
| [#841](https://github.com/missingbulb/Claudinite/issues/841) |  | unlabelled-backlog |  | 2026-08-14 | pack.json migration plan: engine reader + canon conversion, then a versioned fleet migration |
| [#840](https://github.com/missingbulb/Claudinite/issues/840) |  | quick-win |  | 2026-08-19 | Engine-driven format changes to consumer-held files need a first-class migration class |
| [#766](https://github.com/missingbulb/Claudinite/issues/766) |  | quick-win |  | 2026-08-18 | Wrap the remaining 17 RULES.md files to the 100-byte line limit |
| [#748](https://github.com/missingbulb/Claudinite/issues/748) |  | quick-win |  | 2026-08-20 | conformance-backlog: committed-build-artifact check (promote cannot land a check — fixtures sit outside its write surface) |
| [#722](https://github.com/missingbulb/Claudinite/issues/722) |  | needs-decision |  | 2026-08-20 | Align the website repos' release flows on one github-pages-serving standard |
| [#590](https://github.com/missingbulb/Claudinite/issues/590) |  | quick-win |  | 2026-08-19 | Adoption never sets the two repo settings baselining depends on — add them to bootstrap (both are scriptable) |
| [#498](https://github.com/missingbulb/Claudinite/issues/498) |  | needs-decision |  | 2026-07-28 | scheduler-workflow-shape should validate the scopes a repo's tasks actually need, not a fixed two |
| [#409](https://github.com/missingbulb/Claudinite/issues/409) |  | plan-tracking |  | 2026-07-30 | Tracking-issue freshness: keep the plan issue in sync after every merge |
| [#334](https://github.com/missingbulb/Claudinite/issues/334) |  | quick-win |  | 2026-08-19 | DESIGN.md trade-offs: delivery mode is now a security knob; name the vendored mount's supply-chain improvement |
| [#276](https://github.com/missingbulb/Claudinite/issues/276) |  | blocked |  | 2026-08-28 | Move chrome-extension-release plumbing out of core `.github/` into the pack (vendored into consumers) |
| [#239](https://github.com/missingbulb/Claudinite/issues/239) |  | needs-decision |  | 2026-08-15 | Follow-up: wire existing legacy tolerances to the migration resolver |
| [#230](https://github.com/missingbulb/Claudinite/issues/230) |  | quick-win |  | 2026-08-28 | Workflows pin Node 20, now deprecated on Actions runners (forced to Node 24) |
| [#223](https://github.com/missingbulb/Claudinite/issues/223) |  | quick-win |  | 2026-08-17 | Conformance-backlog: check for chrome-extension:// in API Gateway v2 CORS AllowOrigins |
| [#170](https://github.com/missingbulb/Claudinite/issues/170) |  | needs-decision |  | 2026-08-24 | Revisit: Workflow tool's interactive opt-in blocks unattended routines (waiting on Anthropic) |

## missingbulb/GoogleCalendarEventCreator — 35 open (13 queue / 22 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#1133](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1133) | Q | park:action | canon | 2026-09-02 | Align local pack rules and skills to the writing-pack-prose references convention |
| [#1129](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1129) | Q | park:approval | canon | 2026-09-01 | [claudinite-work] gcec/create-extractor |
| [#1118](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1118) |  | unlabelled-backlog |  | 2026-09-01 | Event source request - www.tzavta.co.il |
| [#1103](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1103) |  | unlabelled-backlog |  | 2026-08-30 | Chrome Web Store release pipeline is a generation behind the chrome-extension pack |
| [#1092](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1092) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] product-wiki/wiki-growth |
| [#1089](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1089) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#1088](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1088) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#1085](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1085) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] basics/ci-performance |
| [#1076](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1076) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] tidy-repo/tidy-issues |
| [#1066](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1066) | Q | park:decision | retired | 2026-08-26 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#1041](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1041) |  | unlabelled-backlog |  | 2026-08-25 | prose-to-checks conversion backlog: gcec pack |
| [#1038](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1038) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] gcec/generic-extractor-improvements |
| [#1037](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1037) | Q | park:failure | retired | 2026-08-23 | [claudinite-work] tidy-repo/tidy-prs |
| [#983](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/983) |  | schedule-board |  | 2026-09-02 | [claudinite-schedule] the schedule board |
| [#980](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/980) | Q | park:decision | retired | 2026-08-24 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#979](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/979) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#939](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/939) |  | tidy-tracker |  | 2026-08-18 | Claudinite tracker: Tidy Issues |
| [#829](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/829) |  | tidy-tracker |  | 2026-08-23 | Claudinite tracker: Tidy Branches |
| [#826](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/826) |  | tidy-tracker |  | 2026-08-23 | Claudinite tracker: Tidy PRs |
| [#749](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/749) |  | quick-win |  | 2026-08-16 | product-requirements/README.md cites dev/procedures/technicalGotchas.md, which no longer exists |
| [#748](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/748) | Q | bare-needs-human | retired | 2026-08-15 | Scheduler appears to be firing multiple concurrent executor sessions against the same dispatch issues |
| [#744](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/744) |  | quick-win |  | 2026-08-16 | Untracked .claude/worktrees/ dirs trip the Stop hook's untracked-files check |
| [#727](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/727) |  | quick-win |  | 2026-08-17 | .gitignore misses the Agent tool's isolated-worktree scratch dir |
| [#724](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/724) |  | quick-win |  | 2026-08-17 | Untracked .claude/worktrees/ noise from worktree-isolated background agents |
| [#699](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/699) |  | quick-win |  | 2026-08-18 | Re-paste the Claudinite environment Setup script |
| [#692](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/692) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Product Wiki Growth |
| [#679](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/679) |  | needs-decision |  | 2026-08-16 | Proof of concept: move local capture into Claudinite local packs (.claudinite/local_packs/) |
| [#648](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/648) |  | quick-win |  | 2026-08-17 | Add a Claudinite conformance-checks job to CI (backstop for the Stop hook) |
| [#617](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/617) |  | needs-decision |  | 2026-08-17 | Generate the project's working-instructions doc per Claudinite's generator prompt |
| [#616](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/616) |  | needs-decision |  | 2026-08-16 | Generate the project's working-instructions doc (category: Chrome MV3 extension) |
| [#592](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/592) |  | needs-decision |  | 2026-08-16 | Superseded local instructions (optimize-procedures) |
| [#438](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/438) |  | needs-decision |  | 2026-08-16 | Add a periodic "edge-case review" routine for the UI requirements |
| [#435](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/435) |  | needs-decision |  | 2026-08-16 | Faithfully verify the behavioral UI leaves (events-view-actions stubs the boundary) |
| [#430](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/430) |  | needs-decision |  | 2026-08-16 | Add a daily automated UI-test improvement routine (with its own doc + tracking issue) |
| [#366](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/366) |  | unlabelled-backlog |  | 2026-08-09 | 🤖 Auto-Improvements Tracker - Fallback Extractor Coverage |

## missingbulb/ClaudiniteWebsite — 33 open (13 queue / 20 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#376](https://github.com/missingbulb/ClaudiniteWebsite/issues/376) |  | unlabelled-backlog |  | 2026-08-30 | The site's release pipeline is a hand-rolled copy of the static-website standard, on its retired version scheme |
| [#366](https://github.com/missingbulb/ClaudiniteWebsite/issues/366) |  | blocked |  | 2026-08-30 | Canon patch (blocked on push scope): dedup-prune-integrity false-positives on VERSIONS.md growth |
| [#356](https://github.com/missingbulb/ClaudiniteWebsite/issues/356) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] product-wiki/wiki-growth |
| [#351](https://github.com/missingbulb/ClaudiniteWebsite/issues/351) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#348](https://github.com/missingbulb/ClaudiniteWebsite/issues/348) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/growth-dedup |
| [#325](https://github.com/missingbulb/ClaudiniteWebsite/issues/325) | Q | park:action | canon | 2026-08-31 | Verify https://claudinite.com/ serves the live site, not a GitHub Pages error |
| [#316](https://github.com/missingbulb/ClaudiniteWebsite/issues/316) |  | blocked |  | 2026-08-25 | Canon patch (blocked on push scope): dedup-prune-integrity flags the VERSIONS.md row growth-dedup's own task doc mandates |
| [#308](https://github.com/missingbulb/ClaudiniteWebsite/issues/308) | Q | park:decision | retired | 2026-08-26 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#288](https://github.com/missingbulb/ClaudiniteWebsite/issues/288) | Q | park:decision | retired | 2026-08-26 | Verify in production: the desk-scene hero |
| [#285](https://github.com/missingbulb/ClaudiniteWebsite/issues/285) | Q | park:decision | retired | 2026-08-26 | Verify in production: the redesigned site with the compounding chart |
| [#282](https://github.com/missingbulb/ClaudiniteWebsite/issues/282) |  | unlabelled-backlog |  | 2026-08-23 | site/README.md links a renamed file: .claudinite-checks.json → .claudinite-settings.json |
| [#277](https://github.com/missingbulb/ClaudiniteWebsite/issues/277) |  | unlabelled-backlog |  | 2026-08-23 | converge-item.mjs can't run from a routine-fired Claude Code Web session (MCP-only GitHub access) |
| [#274](https://github.com/missingbulb/ClaudiniteWebsite/issues/274) |  | unlabelled-backlog |  | 2026-08-23 | Canon defect: converge-item.mjs cannot run session-side — this session type has no direct GitHub API access |
| [#270](https://github.com/missingbulb/ClaudiniteWebsite/issues/270) |  | tidy-tracker |  | 2026-08-23 | Claudinite tracker: Product Wiki Growth |
| [#262](https://github.com/missingbulb/ClaudiniteWebsite/issues/262) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] tidy-repo/tidy-issues |
| [#260](https://github.com/missingbulb/ClaudiniteWebsite/issues/260) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] product-wiki/wiki-growth |
| [#255](https://github.com/missingbulb/ClaudiniteWebsite/issues/255) | Q | park:decision | retired | 2026-08-26 | Verify in production: reframed site live at claudinite.com |
| [#247](https://github.com/missingbulb/ClaudiniteWebsite/issues/247) |  | schedule-board |  | 2026-09-02 | [claudinite-schedule] the schedule board |
| [#244](https://github.com/missingbulb/ClaudiniteWebsite/issues/244) | Q | park:decision | retired | 2026-08-24 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#241](https://github.com/missingbulb/ClaudiniteWebsite/issues/241) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-extract |
| [#239](https://github.com/missingbulb/ClaudiniteWebsite/issues/239) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-dedup |
| [#204](https://github.com/missingbulb/ClaudiniteWebsite/issues/204) |  | workflow-failure |  | 2026-08-23 | Claudinite scheduler run failed |
| [#192](https://github.com/missingbulb/ClaudiniteWebsite/issues/192) |  | blocked |  | 2026-08-18 | Vendored queue engine: invoke.mjs points at a missing instructions.md (and prose-to-checks skill's DESIGN.md link is also dead) |
| [#185](https://github.com/missingbulb/ClaudiniteWebsite/issues/185) |  | add-packs |  | 2026-08-16 | Add packs: suspected from this repo’s shape |
| [#77](https://github.com/missingbulb/ClaudiniteWebsite/issues/77) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Tidy Branches |
| [#62](https://github.com/missingbulb/ClaudiniteWebsite/issues/62) |  | needs-decision |  | 2026-08-18 | One-time GitHub settings for the static-site release pipeline |
| [#60](https://github.com/missingbulb/ClaudiniteWebsite/issues/60) |  | needs-decision |  | 2026-08-18 | Adopt the static-website pack — replace the hand-rolled deploy and version bump |
| [#59](https://github.com/missingbulb/ClaudiniteWebsite/issues/59) |  | blocked |  | 2026-08-18 | Canon patch (blocked on push scope): executor-routine fixes for #53–#57 |
| [#57](https://github.com/missingbulb/ClaudiniteWebsite/issues/57) |  | blocked |  | 2026-08-18 | comment-classification fires on routine triggers, which are not owner comments |
| [#55](https://github.com/missingbulb/ClaudiniteWebsite/issues/55) |  | blocked |  | 2026-08-18 | task-lifecycle's remedy tells the agent to amend an already-pushed commit |
| [#54](https://github.com/missingbulb/ClaudiniteWebsite/issues/54) |  | needs-decision |  | 2026-08-23 | resolve-dispatch exit 13 renders as a failed command when it is the normal handshake |
| [#53](https://github.com/missingbulb/ClaudiniteWebsite/issues/53) |  | blocked |  | 2026-08-18 | task-lifecycle fires on the scheduler's maintenance branch, which can never satisfy it |
| [#44](https://github.com/missingbulb/ClaudiniteWebsite/issues/44) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Product Wiki Growth |

## missingbulb/hitbut — 27 open (16 queue / 11 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#153](https://github.com/missingbulb/hitbut/issues/153) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] tidy-repo/tidy-prs |
| [#152](https://github.com/missingbulb/hitbut/issues/152) | Q | park:action | canon | 2026-08-30 | [claudinite-work] tidy-repo/improve-comments |
| [#151](https://github.com/missingbulb/hitbut/issues/151) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] product-wiki/wiki-growth |
| [#147](https://github.com/missingbulb/hitbut/issues/147) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#135](https://github.com/missingbulb/hitbut/issues/135) | Q | park:action | retired | 2026-08-26 | [claudinite-work] tidy-repo/tidy-issues |
| [#125](https://github.com/missingbulb/hitbut/issues/125) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-extract |
| [#108](https://github.com/missingbulb/hitbut/issues/108) | Q | park:decision | retired | 2026-08-24 | [claudinite-work] claudinite-growth/growth-extract |
| [#87](https://github.com/missingbulb/hitbut/issues/87) | Q | park:action | retired | 2026-08-25 | Verify in production: the operator console is published and reads the live Worker |
| [#86](https://github.com/missingbulb/hitbut/issues/86) |  | unlabelled-backlog |  | 2026-08-23 | Turn on GitHub Pages for the operator console (human-only steps) |
| [#83](https://github.com/missingbulb/hitbut/issues/83) |  | tidy-tracker |  | 2026-08-23 | Claudinite tracker: Product Wiki Growth |
| [#79](https://github.com/missingbulb/hitbut/issues/79) | Q | park:action | retired | 2026-08-23 | [claudinite-work] tidy-repo/tidy-prs |
| [#76](https://github.com/missingbulb/hitbut/issues/76) | Q | park:action | retired | 2026-08-23 | [claudinite-work] product-wiki/wiki-growth |
| [#74](https://github.com/missingbulb/hitbut/issues/74) | Q | park:action | retired | 2026-08-23 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#70](https://github.com/missingbulb/hitbut/issues/70) | Q | park:approval | retired | 2026-08-25 | Move the deploy off GitHub Actions and onto Claudinite tasks |
| [#62](https://github.com/missingbulb/hitbut/issues/62) |  | schedule-board |  | 2026-09-02 | [claudinite-schedule] the schedule board |
| [#60](https://github.com/missingbulb/hitbut/issues/60) |  | unlabelled-backlog |  | 2026-08-23 | Adopt canon pack: cloudflare-workers |
| [#36](https://github.com/missingbulb/hitbut/issues/36) |  | unlabelled-backlog |  | 2026-08-23 | The deploy has no smoke test and no rollback path |
| [#34](https://github.com/missingbulb/hitbut/issues/34) |  | unlabelled-backlog |  | 2026-08-22 | Implement the utterance/stance architecture: ingestion, embeddings, backfill |
| [#33](https://github.com/missingbulb/hitbut/issues/33) |  | unlabelled-backlog |  | 2026-08-23 | Nothing names an emergent cluster, so every subject chip is empty |
| [#32](https://github.com/missingbulb/hitbut/issues/32) |  | unlabelled-backlog |  | 2026-08-21 | Reconnaissance and the first two sources |
| [#28](https://github.com/missingbulb/hitbut/issues/28) |  | unlabelled-backlog |  | 2026-08-23 | Honest gaps: what green in the requirements harness does not yet prove |
| [#24](https://github.com/missingbulb/hitbut/issues/24) |  | tidy-tracker |  | 2026-08-21 | Claudinite tracker: Product Wiki Growth |
| [#21](https://github.com/missingbulb/hitbut/issues/21) |  | unlabelled-backlog |  | 2026-08-25 | Adoption hand-over: the two settings no session can reach |
| [#20](https://github.com/missingbulb/hitbut/issues/20) | Q | park:action | retired | 2026-08-23 | [claudinite-work] tidy-repo/tidy-prs |
| [#17](https://github.com/missingbulb/hitbut/issues/17) | Q | park:action | retired | 2026-08-23 | [claudinite-work] product-wiki/wiki-growth |
| [#13](https://github.com/missingbulb/hitbut/issues/13) | Q | park:action | retired | 2026-08-23 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#6](https://github.com/missingbulb/hitbut/issues/6) | Q | park:action | retired | 2026-08-25 | Verify in production: the executor hand-off actually dispatches a work item |

## missingbulb/MissingBulbWebsite — 25 open (12 queue / 13 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#298](https://github.com/missingbulb/MissingBulbWebsite/issues/298) | Q | park:action | canon | 2026-09-02 | Align local pack rules and skills to the writing-pack-prose references convention |
| [#276](https://github.com/missingbulb/MissingBulbWebsite/issues/276) |  | unlabelled-backlog |  | 2026-08-30 | The site's release pipeline is a hand-rolled copy of the static-website standard, on its retired version scheme |
| [#266](https://github.com/missingbulb/MissingBulbWebsite/issues/266) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] tidy-repo/improve-comments |
| [#263](https://github.com/missingbulb/MissingBulbWebsite/issues/263) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#262](https://github.com/missingbulb/MissingBulbWebsite/issues/262) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#260](https://github.com/missingbulb/MissingBulbWebsite/issues/260) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/growth-dedup |
| [#240](https://github.com/missingbulb/MissingBulbWebsite/issues/240) | Q | park:decision | retired | 2026-08-26 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#238](https://github.com/missingbulb/MissingBulbWebsite/issues/238) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-extract |
| [#227](https://github.com/missingbulb/MissingBulbWebsite/issues/227) |  | unlabelled-backlog |  | 2026-08-25 | Agent sessions can't converge Claudinite work items — converge-item.mjs needs direct GitHub REST, sessions are MCP-only |
| [#220](https://github.com/missingbulb/MissingBulbWebsite/issues/220) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] product-wiki/wiki-growth |
| [#217](https://github.com/missingbulb/MissingBulbWebsite/issues/217) |  | unlabelled-backlog |  | 2026-08-23 | Claudinite scheduler fails at job start on every run — the mount has been frozen since 2026-08-21 |
| [#211](https://github.com/missingbulb/MissingBulbWebsite/issues/211) |  | schedule-board |  | 2026-09-02 | [claudinite-schedule] the schedule board |
| [#208](https://github.com/missingbulb/MissingBulbWebsite/issues/208) | Q | park:decision | retired | 2026-08-25 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#207](https://github.com/missingbulb/MissingBulbWebsite/issues/207) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#203](https://github.com/missingbulb/MissingBulbWebsite/issues/203) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-dedup |
| [#169](https://github.com/missingbulb/MissingBulbWebsite/issues/169) |  | unlabelled-backlog |  | 2026-08-17 | core pack required by basics but never materialized in .claudinite-checks.json |
| [#164](https://github.com/missingbulb/MissingBulbWebsite/issues/164) |  | add-packs |  | 2026-08-16 | Add packs: suspected from this repo’s shape |
| [#160](https://github.com/missingbulb/MissingBulbWebsite/issues/160) | Q | bare-needs-human | retired | 2026-08-17 | [claudinite-work] tidy-repo/tidy-issues |
| [#60](https://github.com/missingbulb/MissingBulbWebsite/issues/60) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Product Wiki Growth |
| [#55](https://github.com/missingbulb/MissingBulbWebsite/issues/55) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Tidy Branches |
| [#54](https://github.com/missingbulb/MissingBulbWebsite/issues/54) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Growth Dedup |
| [#51](https://github.com/missingbulb/MissingBulbWebsite/issues/51) |  | tidy-tracker |  | 2026-08-09 | Claudinite tracker: Tidy PRs |
| [#40](https://github.com/missingbulb/MissingBulbWebsite/issues/40) |  | blocked |  | 2026-08-15 | One-time GitHub settings for the static-site release pipeline |
| [#38](https://github.com/missingbulb/MissingBulbWebsite/issues/38) |  | unlabelled-backlog |  | 2026-08-15 | Adopt the static-website pack — replace the hand-rolled deploy and version bump |
| [#28](https://github.com/missingbulb/MissingBulbWebsite/issues/28) |  | tidy-tracker |  | 2026-08-15 | Claudinite tracker: Tidy Issues |

## missingbulb/EdFringeNow — 23 open (7 queue / 16 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#575](https://github.com/missingbulb/EdFringeNow/issues/575) | Q | park:action | canon | 2026-09-02 | Align local pack rules and skills to the writing-pack-prose references convention |
| [#535](https://github.com/missingbulb/EdFringeNow/issues/535) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#532](https://github.com/missingbulb/EdFringeNow/issues/532) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/growth-dedup |
| [#491](https://github.com/missingbulb/EdFringeNow/issues/491) | Q | park:decision | retired | 2026-08-24 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#482](https://github.com/missingbulb/EdFringeNow/issues/482) |  | unlabelled-backlog |  | 2026-08-23 | converge-item.mjs can't run from a routine-fired session — direct api.github.com calls are blocked there |
| [#478](https://github.com/missingbulb/EdFringeNow/issues/478) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] tidy-repo/tidy-prs |
| [#443](https://github.com/missingbulb/EdFringeNow/issues/443) |  | schedule-board |  | 2026-09-02 | [claudinite-schedule] the schedule board |
| [#440](https://github.com/missingbulb/EdFringeNow/issues/440) | Q | park:decision | retired | 2026-08-24 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#439](https://github.com/missingbulb/EdFringeNow/issues/439) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#401](https://github.com/missingbulb/EdFringeNow/issues/401) |  | workflow-failure |  | 2026-08-18 | Claudinite scheduler run failed |
| [#382](https://github.com/missingbulb/EdFringeNow/issues/382) |  | add-packs |  | 2026-08-16 | Add packs: suspected from this repo’s shape |
| [#314](https://github.com/missingbulb/EdFringeNow/issues/314) |  | unlabelled-backlog |  | 2026-08-09 | Replace per-file cache TTLs with a published manifest |
| [#295](https://github.com/missingbulb/EdFringeNow/issues/295) |  | needs-decision |  | 2026-08-09 | The site lists shows edfringe has withdrawn — nothing removes them from the master |
| [#294](https://github.com/missingbulb/EdFringeNow/issues/294) |  | needs-decision |  | 2026-08-09 | Prices exclude the booking fee edfringe advertises — and the recorded `fee` is wrong |
| [#237](https://github.com/missingbulb/EdFringeNow/issues/237) |  | unlabelled-backlog |  | 2026-08-17 | Upstream: baselining's deliver() leaves the scheduler checkout on its maintenance branch |
| [#223](https://github.com/missingbulb/EdFringeNow/issues/223) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Product Wiki Growth |
| [#164](https://github.com/missingbulb/EdFringeNow/issues/164) |  | quick-win |  | 2026-07-30 | Monetization: join Booking.com + Omio and paste the IDs into shared/affiliates.js |
| [#161](https://github.com/missingbulb/EdFringeNow/issues/161) |  | quick-win |  | 2026-07-30 | Monetization: join the 4 affiliate programmes and paste the IDs into js/places.js |
| [#143](https://github.com/missingbulb/EdFringeNow/issues/143) |  | tidy-tracker |  | 2026-08-18 | Claudinite tracker: Tidy Issues |
| [#133](https://github.com/missingbulb/EdFringeNow/issues/133) |  | needs-decision |  | 2026-07-29 | Product requirements: two tracks (live surface, planner surface), not one |
| [#70](https://github.com/missingbulb/EdFringeNow/issues/70) |  | quick-win |  | 2026-07-29 | Re-paste the Claudinite environment Setup script |
| [#17](https://github.com/missingbulb/EdFringeNow/issues/17) |  | needs-decision |  | 2026-07-27 | Claudinite handoff: 2026-07-01 — fixed-seed sort stabilizes pagination against a paginated API |
| [#6](https://github.com/missingbulb/EdFringeNow/issues/6) |  | needs-decision |  | 2026-08-18 | [Prod] Real travel times (routing), not straight-line distance — incl. map-provider pricing review |

## missingbulb/Shepherd — 22 open (13 queue / 9 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#415](https://github.com/missingbulb/Shepherd/issues/415) | Q | running-executor | canon | 2026-09-02 | [claudinite-work] shepherd/fleet-issues-snapshot |
| [#411](https://github.com/missingbulb/Shepherd/issues/411) | Q | park:failure | canon | 2026-09-02 | [claudinite-work] claudinite-fleet-sheepdog/fleet-baseline |
| [#396](https://github.com/missingbulb/Shepherd/issues/396) | Q | park:action | canon | 2026-09-02 | Align local pack rules and skills to the writing-pack-prose references convention |
| [#395](https://github.com/missingbulb/Shepherd/issues/395) |  | unlabelled-backlog |  | 2026-09-01 | Fleet: file ad-hoc tasks to align every member's local packs to the writing-pack-prose convention |
| [#352](https://github.com/missingbulb/Shepherd/issues/352) |  | unlabelled-backlog |  | 2026-09-02 | Turn dashboard sign-in on: register the GitHub App, then run deploy-oauth-exchange |
| [#338](https://github.com/missingbulb/Shepherd/issues/338) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] tidy-repo/tidy-issues |
| [#337](https://github.com/missingbulb/Shepherd/issues/337) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] tidy-repo/improve-comments |
| [#333](https://github.com/missingbulb/Shepherd/issues/333) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#332](https://github.com/missingbulb/Shepherd/issues/332) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#331](https://github.com/missingbulb/Shepherd/issues/331) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/growth-extract |
| [#329](https://github.com/missingbulb/Shepherd/issues/329) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/growth-dedup |
| [#212](https://github.com/missingbulb/Shepherd/issues/212) | Q | park:approval | retired | 2026-08-23 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#209](https://github.com/missingbulb/Shepherd/issues/209) | Q | park:action | retired | 2026-08-23 | [claudinite-work] claudinite-growth/growth-dedup |
| [#205](https://github.com/missingbulb/Shepherd/issues/205) | Q | park:failure | retired | 2026-08-23 | [claudinite-work] claudinite-fleet-sheepdog/fleet-add-missing-packs |
| [#169](https://github.com/missingbulb/Shepherd/issues/169) |  | fleet-drift |  | 2026-09-01 | Claudinite mount has fallen behind on missingbulb/vascularcoloring |
| [#137](https://github.com/missingbulb/Shepherd/issues/137) |  | quick-win |  | 2026-08-22 | The dashboard's morning-brief panel is off, on the repo that writes the briefs |
| [#127](https://github.com/missingbulb/Shepherd/issues/127) |  | schedule-board |  | 2026-09-02 | [claudinite-schedule] the schedule board |
| [#117](https://github.com/missingbulb/Shepherd/issues/117) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-extract |
| [#94](https://github.com/missingbulb/Shepherd/issues/94) |  | fleet-drift |  | 2026-09-01 | Claudinite mount has fallen behind on missingbulb/laughcounter |
| [#91](https://github.com/missingbulb/Shepherd/issues/91) |  | fleet-drift |  | 2026-09-01 | Claudinite mount has fallen behind on missingbulb/crosswordchat |
| [#90](https://github.com/missingbulb/Shepherd/issues/90) |  | fleet-drift |  | 2026-09-01 | Claudinite mount has fallen behind on missingbulb/claudinitewebsite |
| [#3](https://github.com/missingbulb/Shepherd/issues/3) |  | unlabelled-backlog |  | 2026-08-19 | Claudinite adoption: the setup steps only a human can do |

## missingbulb/TLDR — 21 open (6 queue / 15 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#401](https://github.com/missingbulb/TLDR/issues/401) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] tidy-repo/tidy-prs |
| [#397](https://github.com/missingbulb/TLDR/issues/397) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#394](https://github.com/missingbulb/TLDR/issues/394) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/growth-dedup |
| [#367](https://github.com/missingbulb/TLDR/issues/367) | Q | park:decision | retired | 2026-08-24 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#339](https://github.com/missingbulb/TLDR/issues/339) |  | schedule-board |  | 2026-09-02 | [claudinite-schedule] the schedule board |
| [#336](https://github.com/missingbulb/TLDR/issues/336) | Q | park:decision | retired | 2026-08-24 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#282](https://github.com/missingbulb/TLDR/issues/282) |  | quick-win |  | 2026-08-16 | Adopt the canon packs this repo's stack matches but never declared: `aws-sam` and `google-identity` |
| [#280](https://github.com/missingbulb/TLDR/issues/280) |  | unlabelled-backlog |  | 2026-08-16 | Claudinite: queue/instructions.md (and its DESIGN.md) are missing from the vendored mount |
| [#275](https://github.com/missingbulb/TLDR/issues/275) | Q | bare-needs-human | retired | 2026-08-17 | [claudinite-work] tidy-repo/tidy-issues |
| [#245](https://github.com/missingbulb/TLDR/issues/245) |  | needs-decision |  | 2026-08-13 | chrome-release-vendoring materialize would delete the root-package.json version-align step (PR #241) |
| [#179](https://github.com/missingbulb/TLDR/issues/179) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Tidy PRs |
| [#142](https://github.com/missingbulb/TLDR/issues/142) |  | tidy-tracker |  | 2026-08-16 | Claudinite tracker: Tidy Issues |
| [#104](https://github.com/missingbulb/TLDR/issues/104) |  | quick-win |  | 2026-07-26 | Re-paste the Claudinite environment Setup script |
| [#94](https://github.com/missingbulb/TLDR/issues/94) |  | workflow-failure |  | 2026-08-15 | ⚠️ Workflow failing: Release: Daily Auto-Release — 2026-07-13 (run 29229001858) |
| [#93](https://github.com/missingbulb/TLDR/issues/93) |  | workflow-failure |  | 2026-08-15 | ⚠️ Workflow failing: Release: Publish to Chrome Web Store — 2026-07-13 (run 29229001858) |
| [#51](https://github.com/missingbulb/TLDR/issues/51) |  | unlabelled-backlog |  | 2026-07-01 | Daily routine: incrementally improve the executable-requirements suite (gap-finder + breakdown + show-the-result auditor) |
| [#50](https://github.com/missingbulb/TLDR/issues/50) |  | unlabelled-backlog |  | 2026-07-01 | Server integration testing via an in-process fake API Gateway (the server's `fake-chrome`) |
| [#42](https://github.com/missingbulb/TLDR/issues/42) |  | quick-win |  | 2026-07-26 | Side panel ignores the server's nextToken — only the first 50 comments are reachable |
| [#38](https://github.com/missingbulb/TLDR/issues/38) |  | needs-decision |  | 2026-08-01 | Client-side log shipping to AWS (POST /logs → CloudWatch) |
| [#23](https://github.com/missingbulb/TLDR/issues/23) |  | needs-decision |  | 2026-08-01 | Consider anonymous or pseudonymous comments |
| [#17](https://github.com/missingbulb/TLDR/issues/17) |  | quick-win |  | 2026-07-16 | Replace placeholder extension icons with real branding |

## missingbulb/ClaudiniteCanary — 16 open (9 queue / 7 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#283](https://github.com/missingbulb/ClaudiniteCanary/issues/283) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#247](https://github.com/missingbulb/ClaudiniteCanary/issues/247) | Q | park:approval | retired | 2026-08-24 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#239](https://github.com/missingbulb/ClaudiniteCanary/issues/239) |  | unlabelled-backlog |  | 2026-08-23 | converge-item.mjs has no MCP-compatible agent-lane path — a session cannot perform queue instructions.md step 6 |
| [#235](https://github.com/missingbulb/ClaudiniteCanary/issues/235) | Q | park:decision | retired | 2026-08-24 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#231](https://github.com/missingbulb/ClaudiniteCanary/issues/231) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] tidy-repo/tidy-prs |
| [#181](https://github.com/missingbulb/ClaudiniteCanary/issues/181) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] tidy-repo/tidy-issues |
| [#153](https://github.com/missingbulb/ClaudiniteCanary/issues/153) |  | unlabelled-backlog |  | 2026-08-21 | claudinite-dashboard adoption: the setup steps only a human can do |
| [#148](https://github.com/missingbulb/ClaudiniteCanary/issues/148) |  | schedule-board |  | 2026-09-02 | [claudinite-schedule] the schedule board |
| [#133](https://github.com/missingbulb/ClaudiniteCanary/issues/133) | Q | park:approval | retired | 2026-08-19 | [claudinite-work] claudinite-lifecycle/adopt-requested-packs |
| [#129](https://github.com/missingbulb/ClaudiniteCanary/issues/129) | Q | park:approval | retired | 2026-08-23 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#128](https://github.com/missingbulb/ClaudiniteCanary/issues/128) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#126](https://github.com/missingbulb/ClaudiniteCanary/issues/126) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-extract |
| [#95](https://github.com/missingbulb/ClaudiniteCanary/issues/95) |  | tidy-tracker |  | 2026-08-22 | Claudinite tracker: Tidy Issues |
| [#47](https://github.com/missingbulb/ClaudiniteCanary/issues/47) |  | tidy-tracker |  | 2026-08-10 | Claudinite tracker: Growth Extract |
| [#41](https://github.com/missingbulb/ClaudiniteCanary/issues/41) |  | tidy-tracker |  | 2026-08-23 | Claudinite tracker: Prose to Checks |
| [#39](https://github.com/missingbulb/ClaudiniteCanary/issues/39) |  | tidy-tracker |  | 2026-08-30 | Claudinite tracker: Tidy PRs |

## missingbulb/CrosswordChat — 13 open (5 queue / 8 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#352](https://github.com/missingbulb/CrosswordChat/issues/352) |  | unlabelled-backlog |  | 2026-08-30 | Chrome Web Store release pipeline is a generation behind the chrome-extension pack |
| [#307](https://github.com/missingbulb/CrosswordChat/issues/307) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] tidy-repo/tidy-issues |
| [#304](https://github.com/missingbulb/CrosswordChat/issues/304) |  | unlabelled-backlog |  | 2026-08-23 | Connect the Claude GitHub App: converge-item.mjs can't reach the GitHub API from a dispatched session |
| [#303](https://github.com/missingbulb/CrosswordChat/issues/303) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#260](https://github.com/missingbulb/CrosswordChat/issues/260) |  | schedule-board |  | 2026-09-02 | [claudinite-schedule] the schedule board |
| [#257](https://github.com/missingbulb/CrosswordChat/issues/257) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#256](https://github.com/missingbulb/CrosswordChat/issues/256) | Q | park:decision | retired | 2026-08-23 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#252](https://github.com/missingbulb/CrosswordChat/issues/252) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-dedup |
| [#211](https://github.com/missingbulb/CrosswordChat/issues/211) |  | quick-win |  | 2026-08-17 | Recurring vitest cold-start timeout in visual-snapshots.test.js (help-page) |
| [#63](https://github.com/missingbulb/CrosswordChat/issues/63) |  | unlabelled-backlog |  | 2026-07-19 | Manual check: mic indicator clears on bfcache/back-forward teardown (verifies PR #62 pagehide path) |
| [#11](https://github.com/missingbulb/CrosswordChat/issues/11) |  | unlabelled-backlog |  | 2026-07-05 | Live check: mic never goes deaf after clicks; barge-in reliability (MT-13, MT-27) |
| [#9](https://github.com/missingbulb/CrosswordChat/issues/9) |  | unlabelled-backlog |  | 2026-07-09 | Live check: grid-full "next" moves on; "seven across" jumps to the clue (MT-09) |
| [#6](https://github.com/missingbulb/CrosswordChat/issues/6) |  | unlabelled-backlog |  | 2026-07-09 | Live check: penciling on forced answers works on the real page (MT-29, MT-07) |

## missingbulb/VascularColoring — 13 open (8 queue / 5 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#298](https://github.com/missingbulb/VascularColoring/issues/298) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] tidy-repo/tidy-prs |
| [#294](https://github.com/missingbulb/VascularColoring/issues/294) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#258](https://github.com/missingbulb/VascularColoring/issues/258) | Q | park:approval | retired | 2026-08-24 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#254](https://github.com/missingbulb/VascularColoring/issues/254) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] tidy-repo/tidy-issues |
| [#171](https://github.com/missingbulb/VascularColoring/issues/171) |  | schedule-board |  | 2026-09-02 | [claudinite-schedule] the schedule board |
| [#159](https://github.com/missingbulb/VascularColoring/issues/159) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#158](https://github.com/missingbulb/VascularColoring/issues/158) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#156](https://github.com/missingbulb/VascularColoring/issues/156) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-extract |
| [#154](https://github.com/missingbulb/VascularColoring/issues/154) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-dedup |
| [#125](https://github.com/missingbulb/VascularColoring/issues/125) |  | add-packs |  | 2026-08-16 | Add packs: suspected from this repo’s shape |
| [#86](https://github.com/missingbulb/VascularColoring/issues/86) |  | tidy-tracker |  | 2026-08-23 | Claudinite tracker: Tidy Branches |
| [#85](https://github.com/missingbulb/VascularColoring/issues/85) |  | tidy-tracker |  | 2026-08-23 | Claudinite tracker: Tidy PRs |
| [#8](https://github.com/missingbulb/VascularColoring/issues/8) |  | quick-win |  | 2026-07-26 | Re-paste the Claudinite environment Setup script |

## missingbulb/WIP — 13 open (4 queue / 9 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#130](https://github.com/missingbulb/WIP/issues/130) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] product-wiki/wiki-growth |
| [#127](https://github.com/missingbulb/WIP/issues/127) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#126](https://github.com/missingbulb/WIP/issues/126) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#124](https://github.com/missingbulb/WIP/issues/124) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/growth-dedup |
| [#72](https://github.com/missingbulb/WIP/issues/72) |  | tidy-tracker |  | 2026-08-23 | Claudinite tracker: Product Wiki Growth |
| [#62](https://github.com/missingbulb/WIP/issues/62) |  | unlabelled-backlog |  | 2026-08-24 | converge-item.mjs cannot run from a web session — the exact place invoke.mjs sends work |
| [#54](https://github.com/missingbulb/WIP/issues/54) |  | unlabelled-backlog |  | 2026-08-23 | Verify in production: the native recorders capture a real set on a real device |
| [#41](https://github.com/missingbulb/WIP/issues/41) |  | unlabelled-backlog |  | 2026-08-22 | Phase 0 — human-only setup for the Flutter conversion |
| [#40](https://github.com/missingbulb/WIP/issues/40) |  | unlabelled-backlog |  | 2026-08-23 | Tracking: convert the client to Flutter — cross-platform, offline laugh detection, macOS-runner-free CI |
| [#25](https://github.com/missingbulb/WIP/issues/25) |  | schedule-board |  | 2026-09-02 | [claudinite-schedule] the schedule board |
| [#7](https://github.com/missingbulb/WIP/issues/7) |  | tidy-tracker |  | 2026-08-20 | Claudinite tracker: Product Wiki Growth |
| [#6](https://github.com/missingbulb/WIP/issues/6) |  | unlabelled-backlog |  | 2026-08-24 | Tracking: build Set list — Phase A client MVP to App Store, Phase B Cloudflare pipeline + QR share |
| [#5](https://github.com/missingbulb/WIP/issues/5) |  | unlabelled-backlog |  | 2026-08-20 | Phase 0 — human-only setup for Set list build (accounts, secrets, domain) |

## missingbulb/LaughCounter — 8 open (4 queue / 4 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#364](https://github.com/missingbulb/LaughCounter/issues/364) | Q | park:action | canon | 2026-09-01 | [claudinite-work] tidy-repo/tidy-issues |
| [#343](https://github.com/missingbulb/LaughCounter/issues/343) |  | needs-decision |  | 2026-08-31 | This repo fingerprints the `macos` pack but does not declare it, and its DMG release plumbing is unowned |
| [#331](https://github.com/missingbulb/LaughCounter/issues/331) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#254](https://github.com/missingbulb/LaughCounter/issues/254) |  | schedule-board |  | 2026-09-02 | [claudinite-schedule] the schedule board |
| [#239](https://github.com/missingbulb/LaughCounter/issues/239) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#201](https://github.com/missingbulb/LaughCounter/issues/201) |  | add-packs |  | 2026-08-17 | Add packs: suspected from this repo’s shape |
| [#174](https://github.com/missingbulb/LaughCounter/issues/174) |  | blocked |  | 2026-08-17 | Distribute LaughCounter via Homebrew Cask (own tap) |
| [#26](https://github.com/missingbulb/LaughCounter/issues/26) | Q | bare-needs-human | retired | 2026-08-17 | [needs-human] Enable Developer ID signing + notarization for the DMG |

## missingbulb/ShoutsAndWhispers — 6 open (2 queue / 4 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#344](https://github.com/missingbulb/ShoutsAndWhispers/issues/344) | Q | park:action | canon | 2026-09-02 | Align local pack rules and skills to the writing-pack-prose references convention |
| [#273](https://github.com/missingbulb/ShoutsAndWhispers/issues/273) | Q | park:failure | canon | 2026-09-01 | [claudinite-work] claudinite-growth/growth-extract |
| [#201](https://github.com/missingbulb/ShoutsAndWhispers/issues/201) |  | schedule-board |  | 2026-09-02 | [claudinite-schedule] the schedule board |
| [#158](https://github.com/missingbulb/ShoutsAndWhispers/issues/158) |  | add-packs |  | 2026-08-16 | Add packs: suspected from this repo’s shape |
| [#99](https://github.com/missingbulb/ShoutsAndWhispers/issues/99) |  | unlabelled-backlog |  | 2026-08-07 | Get the app running on Appetize.io (browser-based device preview) |
| [#10](https://github.com/missingbulb/ShoutsAndWhispers/issues/10) |  | quick-win |  | 2026-07-30 | Re-paste the Claudinite environment Setup script |

## missingbulb/HelloWorldFlutterApp — 2 open (0 queue / 2 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#26](https://github.com/missingbulb/HelloWorldFlutterApp/issues/26) |  | quick-win |  | 2026-07-27 | Enable "Allow auto-merge" in repository settings (blocks Claudinite auto-merge delivery) |
| [#24](https://github.com/missingbulb/HelloWorldFlutterApp/issues/24) |  | needs-decision |  | 2026-07-26 | Re-paste the Claudinite environment Setup script |

## missingbulb/gRatio — 1 open (0 queue / 1 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#45](https://github.com/missingbulb/gRatio/issues/45) |  | tidy-tracker |  | 2026-07-30 | Claudinite tracker: Tidy Issues |
