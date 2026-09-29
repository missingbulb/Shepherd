# Fleet triage — 2026-09-29

**The rise in parks is one weekly sweep and one canon check, not a fleet getting worse. The four-day
gap in this series was Shepherd's own collector, and it failed in the open for four days with
nothing escalating it.**

Snapshot: the fleet-issues file `shepherd/fleet-issues-snapshot` writes, generated `2026-09-29T15:19:30.023Z`,
394 open issues across 15 in-scope repos.

Eleventh run in the series. It corrects the 09-25 liveness read and the 09-25 engine finding.

---

## 1. The collector was down for four days

From 09-26 to 09-28, and again on the first run on 09-29, `shepherd/fleet-issues-snapshot` parked
`failure` with one line:

```
fleet-issues-snapshot failed: no branch to deliver on — the executor resolves it and hands it in as CLAUDINITE_TARGET_BRANCH
```

- **Cause.** The vendored delivery stopped choosing a branch for itself and began requiring the
  executor's resolved target. Canon's own workers get that argument bound automatically through the
  runner's entry point. Shepherd's local worker still passed the retired `branchPrefix`.
- **Dating.** The stricter contract was cut in the 09-24 mount update. It reached `main` only when
  [#747](https://github.com/missingbulb/Shepherd/pull/747) merged on 09-25 at 18:19. The 09-25 09:35
  run ([#754](https://github.com/missingbulb/Shepherd/issues/754)) therefore passed, and every run
  from 09-26 failed: [#771](https://github.com/missingbulb/Shepherd/issues/771),
  [#788](https://github.com/missingbulb/Shepherd/issues/788),
  [#801](https://github.com/missingbulb/Shepherd/issues/801), and the first attempt of
  [#816](https://github.com/missingbulb/Shepherd/issues/816).
- **Fix.** It landed as [#821](https://github.com/missingbulb/Shepherd/pull/821). #816 was re-run,
  closed `done` at 15:19, and delivered [#824](https://github.com/missingbulb/Shepherd/pull/824), which
  is this snapshot.

**What is worth keeping from it:** a canon-surface change broke a *local* worker, and each daily
failure was just one more `failure` park on the same lane. Nothing escalated a lane failing on
consecutive days. The only reader who would notice was this triage, which depends on that lane for
its input. It is the same shape as the 09-17 finding (a re-shelve broke the one consumer no repo can
fix from inside itself), seen from the other side.

The three residue parks (#771, #788, #801) are `failure` + `planned`, and a later clean run now
exists. That is exactly rule E's premise. At snapshot time the janitor had not yet passed over them.
Whether it closes them is the next run's first check.

## 2. Liveness, corrected: the snapshot cannot see a run that leaves nothing open

On 09-25 I called 7 of 15 members **dark**, meaning their open set had not changed at all across the
window. Three of the seven have since moved: CrosswordChat, MissingBulbWebsite and ClaudiniteWebsite.

| member | 09-25 read | newest open activity at 09-29 |
|---|---|---|
| CrosswordChat | dark 5.0d | 2.2d (weekly sweep, 09-27) |
| MissingBulbWebsite | dark 5.0d | 2.2d (weekly sweep, 09-27) |
| ClaudiniteWebsite | dark 4.6d | 1.2d (two new failure parks) |
| hitbut | dark 11.9d | **16.2d** |
| ShoutsAndWhispers | dark 12.0d | **16.2d** |
| WIP | dark 18.0d | **22.2d** |
| LaughCounter | dark 18.5d | **22.8d** |

Five members read exactly **2.2 days**: Canary, CrosswordChat, MissingBulbWebsite, TLDR and
VascularColoring. That is the 09-27 ~10:00 `prose-to-checks-sweep`, a weekly task that parks
`approval`. A daily task that runs and closes cleanly inside a day never appears in any snapshot. So
the open set measures **runs that leave something open**, not **runs**. A member whose only
park-producing lane is weekly reads "dark" for up to six days while running normally.

The corrected test is therefore **missed sweeps, not quiet days**. Every live member parked on the
09-27 sweep. The four that did not also produced nothing on 09-20:

- **hitbut** and **ShoutsAndWhispers** were last touched in the same minute, 09-13 09:49. That is the
  12-item cluster in this run's timestamp table. hitbut carries an open `Claudinite scheduler run
  failed` (#286, 16.2d).
- **WIP** (22.2d) and **LaughCounter** (22.8d) have been silent for longer than the whole window
  this series has measured liveness over.

Those four are dark on evidence that holds up; the other three were artefacts of the window length.
Why the four stopped is still unestablished, for the same reason as before: their own run history is
out of this session's reach.

## 3. Where the +14 parks came from

Parks went from 89 to 103 (105 counting two bare legacy `needs-human`). All 14 of the increase is in
live members; the four dark ones are frozen at 16 → 16. It breaks down into three causes, and none of
them is new backlog in the sense the count implies.

### 3a. `prose-to-checks-sweep`: an approval park every week, per member

This is the fleet's dominant task: 25 open items, and 5 of the 13 duplicated lanes. On 09-27 it
parked `approval` in Canary (#554), CrosswordChat (#573), GoogleCalendarEventCreator (#1350),
MissingBulbWebsite (#534) and TLDR (#625). Lanes are now 5 deep in CrosswordChat and
VascularColoring, and 4 deep in GoogleCalendarEventCreator and MissingBulbWebsite.

An `approval` park is outside `SUPERSEDABLE_PARKS`, so a later clean run never clears the one
before it. Only merging or closing its PR does, through rule G, and only where the item carries
`Ends-when`. So each week the sweep adds one park per member, and one park only leaves when a person
acts on its PR. That is the accumulation mechanism. I could not check whether the older parks' PRs
are still open: every one of these lanes is in a member outside this session's scope.

### 3b. `dedup-prune-integrity`: one canon defect, filed six times

In the same 09-27 window, five members independently filed the same finding: the check counts a
pack's provenance appends as pack prose, so a dedup prune cannot record itself. The filings are
GoogleCalendarEventCreator #1361, NoRFinder #211, TLDR #634, VascularColoring #535, and canon's own
[Claudinite#2367](https://github.com/missingbulb/Claudinite/issues/2367). The sixth effect is the
`failure` park it causes on canon's growth-dedup lane,
[Claudinite#2353](https://github.com/missingbulb/Claudinite/issues/2353). Sampled: that agent pruned
correctly, delivered #2366, then could not pass its own work-scope sweep, and says so. One fix in
canon (#2367) closes all six; nothing in the members needs doing. A related older issue,
[Claudinite#1868](https://github.com/missingbulb/Claudinite/issues/1868), is still open on the same
check.

### 3c. `growth-promote`: five parks, one PR

Canon's `growth-promote` lane is 6 deep: #2269, #2304, #2333, #2351 and #2384 parked `approval`,
plus #2396 waiting. Sampled #2384. Every daily occurrence amends the **same** open PR,
[Claudinite#2283](https://github.com/missingbulb/Claudinite/pull/2283) (open since 09-23, 12 commits,
+644/−10), and parks with `Ends-when: #2283 closed`. That is the working design, not a fault: one
merge (or close) of #2283 lets rule G clear the whole lane. The distinct question count here is
**1**, not 5.

## 4. Failure parks: 12, attributed

| member | item | age | origin | cause |
|---|---|---|---|---|
| Shepherd | #771, #788, #801 | 1–3d | planned | §1, fixed; residue for rule E |
| Claudinite | #2353 | 2.2d | planned | §3b, canon check defect #2367 |
| ClaudiniteWebsite | #697 site-stats, #719 public-installs | 1–2d | planned | not sampled (out of scope) |
| GoogleCalendarEventCreator | #1373 improve-comments | 0.7d | planned | not sampled (out of scope) |
| NoRFinder | #198 Add packs | 2.2d | ad-hoc | not sampled (out of scope) |
| Claudinite | #1682 retire barrier legacy read | 25.4d | ad-hoc | pre-existing, carried from earlier runs |
| ClaudiniteCanary | #510 scheduler run failed | 7.0d | github | Canary is running (parked on 09-27), so this is stale |
| hitbut | #286 scheduler run failed | 16.2d | github | the dark member's own last word (§2) |

Four of the twelve are one fixed cause (Shepherd's snapshot lane). One is a canon defect with its
issue already open. The two ClaudiniteWebsite failures are the only new, unexplained ones: two
different website tasks failing on consecutive days in one member.

## 5. What can end a park now: 10 of 103

Rule E can reach 10 of 103 parks (10%), up from 4 of 89 (4%). The rise is entirely the new `failure`
parks, which are supersedable. The other 93 need a person or a rule G end condition. That share is
unchanged from 09-25: roughly nine parks in ten will not self-clear.

## 6. The series numbers

```
snap   generated          total  queue  plain  unlabelled | parks  fail appr deci acti
0902   2026-09-02T11:56    349    133    216         107 |   125    36   25   40   24
0908   2026-09-08T08:50    410    184    226         199 |   120    29   41   36   14
0913   2026-09-13T16:03    417    177    240         212 |   125    16   57   38   14
0917   2026-09-17T09:24    372    131    241         214 |    98     6   48   33   11
0921   2026-09-21T09:54    391    134    257         230 |    96     3   50   31   12
0925   2026-09-25T09:35    375    124    251         228 |    89     5   40   33   11
0929   2026-09-29T15:19    394    134    260         238 |   103    12   45   32   14
```

Unlabelled plain issues grew 228 → 238 and are now 60% of every open issue. The 09-27 cross-repo
filings (§3b) are part of that growth.

## 7. What I could not establish

- **Whether older `prose-to-checks-sweep` approval parks still have open PRs**, and so whether rule G
  can ever reach them. All of those lanes are in members this session cannot read.
- **Why the four dark members stopped.** Their scheduler runs are on their own repos.
- **The ClaudiniteWebsite failures' cause.** Same reach limit.

## 8. Shepherd's own state: 13 open (6 queue / 7 plain)

The snapshot lane is recovered (§1). Its three residue parks wait on rule E. #816 was
`running-executor` at snapshot time and has since closed `done`. `growth-extract` (#823) was
running. Shepherd's engine moved `60902.1 → 60928.1` in the 09-28 update, ending the 23-day freeze I
reported on 09-25 (§9).

## 9. Corrections to earlier runs

- **09-25, liveness.** I read 7 of 15 members as dark. Three were artefacts of a window shorter than
  their only park-producing cadence (§2). The honest count is 4, and the test is missed weekly sweeps,
  not days of quiet.
- **09-25, follow-up answer: "Shepherd's engine has not advanced in 23 days."** That was true when I
  said it. The 09-28 update moved it to `60928.1`. The question I left open, *why* 18 updates in a
  row upgraded packs only, is still unanswered, but it is no longer a live gap here.
- **09-25, follow-up answer.** I listed the `claude-code-web-users-support` mount lag as open. It was
  under two days of normal lag, and `main` has since ignored the session pack root on its own
  (09-27).

## 10. Still open: recommendations, not actions

1. **Merge or close [Claudinite#2283](https://github.com/missingbulb/Claudinite/pull/2283).** One
   action clears five parks through rule G, the largest single drain available.
2. **Fix [Claudinite#2367](https://github.com/missingbulb/Claudinite/issues/2367) in canon.** It
   unblocks growth-dedup fleet-wide, and the five member filings can then close as duplicates of it.
3. **Decide the `prose-to-checks-sweep` cadence against the owner's merge rate.** It adds one
   approval park per member per week, and nothing but a merge removes one. Either the PRs get
   merged at that pace, or the sweep's output should amend one standing PR per member, as
   growth-promote already does.
4. **Give a lane that fails on consecutive days an escalation.** The snapshot lane failed four days
   running and only the triage noticed. That is a canon question, not a Shepherd one.
5. **The four dark members** still need someone with their repos in reach.

---

# Appendix — every open issue, per repo

394 open issues across 15 in-scope repos under `missingbulb` (snapshot generated 2026-09-29T15:19:30.023Z).
`Q` = queue-managed. `Gen` = label generation (canon `task:status:*` vs retired `needs-human`/`task:needs-human-*`).


## missingbulb/Claudinite — 182 open (48 queue / 134 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#2405](https://github.com/missingbulb/Claudinite/issues/2405) |  | unlabelled-backlog |  | 2026-09-29 | converge-item plans "Waiting on a person" on a done that closes the item |
| [#2402](https://github.com/missingbulb/Claudinite/issues/2402) |  | unlabelled-backlog |  | 2026-09-29 | claudinite-canon-curation: say what makes a relevanceDetector fingerprint reliable |
| [#2401](https://github.com/missingbulb/Claudinite/issues/2401) |  | unlabelled-backlog |  | 2026-09-29 | shared-tree-edit-guard blocks read-only Bash that merely mentions the mount path after a ">" |
| [#2396](https://github.com/missingbulb/Claudinite/issues/2396) | Q | waiting-for-executor | canon | 2026-09-29 | [claudinite-work] claudinite-canon-curation/growth-promote |
| [#2395](https://github.com/missingbulb/Claudinite/issues/2395) |  | unlabelled-backlog |  | 2026-09-28 | Retire the manifest spec's tolerance of the `contributes` and `contributedRules` fields |
| [#2392](https://github.com/missingbulb/Claudinite/issues/2392) |  | unlabelled-backlog |  | 2026-09-28 | converge-item's done comment tells the reader to merge a PR the run already merged, and to close an item it closes itself |
| [#2391](https://github.com/missingbulb/Claudinite/issues/2391) |  | unlabelled-backlog |  | 2026-09-28 | deliver-pr.md's --base example invites the bare local main, so a policy verdict is computed over the wrong diff |
| [#2389](https://github.com/missingbulb/Claudinite/issues/2389) |  | unlabelled-backlog |  | 2026-09-28 | merge-to-main's step 1 tells the session to call ToolSearch, and the guard denies it every time |
| [#2384](https://github.com/missingbulb/Claudinite/issues/2384) | Q | park:approval | canon | 2026-09-28 | [claudinite-work] claudinite-canon-curation/growth-promote |
| [#2380](https://github.com/missingbulb/Claudinite/issues/2380) |  | unlabelled-backlog |  | 2026-09-27 | force-load-on-tool-calls matches a Bash token inside heredoc or quoted data, blocking the call and discarding its write |
| [#2374](https://github.com/missingbulb/Claudinite/issues/2374) |  | unlabelled-backlog |  | 2026-09-27 | Retire the manifest spec's tolerance of the `detect` and `marker` fields |
| [#2367](https://github.com/missingbulb/Claudinite/issues/2367) |  | unlabelled-backlog |  | 2026-09-27 | dedup-prune-integrity counts provenance logs as pack prose, so a dedup run cannot record its prunes |
| [#2362](https://github.com/missingbulb/Claudinite/issues/2362) |  | unlabelled-backlog |  | 2026-09-27 | github-api-via-shell's message says every repo-scoped api.github.com call 403s; an in-scope repo answers 200 |
| [#2353](https://github.com/missingbulb/Claudinite/issues/2353) | Q | park:failure | canon | 2026-09-27 | [claudinite-work] claudinite-growth/growth-dedup |
| [#2351](https://github.com/missingbulb/Claudinite/issues/2351) | Q | park:approval | canon | 2026-09-27 | [claudinite-work] claudinite-canon-curation/growth-promote |
| [#2341](https://github.com/missingbulb/Claudinite/issues/2341) | Q | park:approval | canon | 2026-09-26 | stop-hook-not-world says check_the_world "is what CI runs"; CI runs both sweeps |
| [#2333](https://github.com/missingbulb/Claudinite/issues/2333) | Q | park:approval | canon | 2026-09-26 | [claudinite-work] claudinite-canon-curation/growth-promote |
| [#2323](https://github.com/missingbulb/Claudinite/issues/2323) | Q | blocked | canon | 2026-09-25 | Retire the pre-flat and pre-usage-directory path tolerances |
| [#2319](https://github.com/missingbulb/Claudinite/issues/2319) | Q | blocked | canon | 2026-09-25 | Stop reading a check's retired `severity` spelling |
| [#2313](https://github.com/missingbulb/Claudinite/issues/2313) | Q | park:approval | canon | 2026-09-25 | Route the last 11 fixture git spawns through the shared runner |
| [#2312](https://github.com/missingbulb/Claudinite/issues/2312) |  | unlabelled-backlog |  | 2026-09-25 | deliver-pr.md tells the landing lane to pass a local branch name as --base |
| [#2304](https://github.com/missingbulb/Claudinite/issues/2304) | Q | park:approval | canon | 2026-09-25 | [claudinite-work] claudinite-canon-curation/growth-promote |
| [#2295](https://github.com/missingbulb/Claudinite/issues/2295) |  | unlabelled-backlog |  | 2026-09-24 | Drop the `countWords` shim from token-estimate.mjs once every member's basics pack has converged |
| [#2284](https://github.com/missingbulb/Claudinite/issues/2284) |  | unlabelled-backlog |  | 2026-09-23 | fixture-git-housekeeping goes blocking 2026-10-05 with 12 files still reporting |
| [#2277](https://github.com/missingbulb/Claudinite/issues/2277) | Q | park:approval | canon | 2026-09-23 | provenance.mjs answers from the clone's horizon on a shallow checkout |
| [#2269](https://github.com/missingbulb/Claudinite/issues/2269) | Q | park:approval | canon | 2026-09-23 | [claudinite-work] claudinite-canon-curation/growth-promote |
| [#2261](https://github.com/missingbulb/Claudinite/issues/2261) | Q | park:approval | canon | 2026-09-22 | Give a check the run's instruments, and isolate a rule that throws |
| [#2254](https://github.com/missingbulb/Claudinite/issues/2254) | Q | blocked | canon | 2026-09-29 | Retire the `static-website` pack id tolerance, and the rename map with it |
| [#2247](https://github.com/missingbulb/Claudinite/issues/2247) |  | unlabelled-backlog |  | 2026-09-28 | Merge the sibling sweep tasks inside claudinite-growth, claudinite-canon-curation and claudinite-fleet-sheepdog |
| [#2246](https://github.com/missingbulb/Claudinite/issues/2246) | Q | park:approval | canon | 2026-09-22 | A usage rule should know whether its subject could have fired at all |
| [#2243](https://github.com/missingbulb/Claudinite/issues/2243) |  | unlabelled-backlog |  | 2026-09-22 | The eight print-then-exit sites that need control flow restructured, not a token swapped |
| [#2240](https://github.com/missingbulb/Claudinite/issues/2240) | Q | blocked | canon | 2026-09-22 | Retrospective: the usage review loop |
| [#2239](https://github.com/missingbulb/Claudinite/issues/2239) | Q | blocked | canon | 2026-09-28 | Delete docs/usage-review/DESIGN.md once the loop has proven itself |
| [#2238](https://github.com/missingbulb/Claudinite/issues/2238) | Q | blocked | canon | 2026-09-22 | Verify in production: the usage review files and closes its own issues |
| [#2193](https://github.com/missingbulb/Claudinite/issues/2193) |  | unlabelled-backlog |  | 2026-09-21 | no-new-long-dashes reads a pure rename as added lines, so moving a file with long dashes fires once per line |
| [#2188](https://github.com/missingbulb/Claudinite/issues/2188) |  | unlabelled-backlog |  | 2026-09-21 | Remove the deprecated alias left by the personal-pack change |
| [#2181](https://github.com/missingbulb/Claudinite/issues/2181) | Q | blocked | canon | 2026-09-23 | Take the retired taskScheduler anchor keys off the accepted list |
| [#2173](https://github.com/missingbulb/Claudinite/issues/2173) | Q | blocked | canon | 2026-09-27 | Retrospective: provenance, a week after the shelf's last empty file fills |
| [#2172](https://github.com/missingbulb/Claudinite/issues/2172) | Q | blocked | canon | 2026-09-20 | Retrospective: provenance, a week after the marking pass |
| [#2171](https://github.com/missingbulb/Claudinite/issues/2171) | Q | blocked | canon | 2026-09-20 | Verify in production: a promote PR carries a reduced provenance file beside its marked rule |
| [#2170](https://github.com/missingbulb/Claudinite/issues/2170) | Q | blocked | canon | 2026-09-25 | Provenance L5: retire the references.md conversion tolerance at the window's end |
| [#2169](https://github.com/missingbulb/Claudinite/issues/2169) |  | unlabelled-backlog |  | 2026-09-25 | Provenance: a per-element decision log for every pack — tracking issue |
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
| [#1683](https://github.com/missingbulb/Claudinite/issues/1683) | Q | blocked | canon | 2026-09-29 | Retrospective: barriers folded into basics |
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
| [#1346](https://github.com/missingbulb/Claudinite/issues/1346) | Q | blocked | none | 2026-09-29 | Move taskScheduler from a top-level settings key into the claudinite-tasks pack's own config |
| [#1341](https://github.com/missingbulb/Claudinite/issues/1341) |  | unlabelled-backlog |  | 2026-08-24 | Eliminate the task-janitor: fold its recovery into the scheduler run, its visibility into the dashboard |
| [#1333](https://github.com/missingbulb/Claudinite/issues/1333) |  | unlabelled-backlog |  | 2026-09-06 | claudinite-canary-repo: the withhold lane it probes no longer exists |
| [#1317](https://github.com/missingbulb/Claudinite/issues/1317) |  | unlabelled-backlog |  | 2026-09-06 | Extract the task execution/scheduling surface into a claudinite-tasks pack |
| [#1313](https://github.com/missingbulb/Claudinite/issues/1313) |  | unlabelled-backlog |  | 2026-09-06 | Gate packs/* against .claudinite/local in the barriers config |
| [#1295](https://github.com/missingbulb/Claudinite/issues/1295) |  | unlabelled-backlog |  | 2026-09-06 | A member whose Actions jobs cannot start has no escalation path — report-failure dies with everything else |
| [#1275](https://github.com/missingbulb/Claudinite/issues/1275) | Q | park:approval | retired | 2026-08-23 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#1274](https://github.com/missingbulb/Claudinite/issues/1274) | Q | park:approval | retired | 2026-08-23 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#1264](https://github.com/missingbulb/Claudinite/issues/1264) |  | unlabelled-backlog |  | 2026-09-06 | Delete the two-name settings-file tolerance once no member carries .claudinite-checks.json |
| [#1237](https://github.com/missingbulb/Claudinite/issues/1237) | Q | blocked | none | 2026-09-29 | Chain 3/3: retire the twice-daily-cron migration tolerances |
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

## missingbulb/GoogleCalendarEventCreator — 37 open (13 queue / 24 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#1373](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1373) | Q | park:failure | canon | 2026-09-28 | [claudinite-work] basics/improve-comments |
| [#1361](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1361) |  | unlabelled-backlog |  | 2026-09-27 | dedup-prune-integrity doesn't exempt provenance/ appends from its shrink-only check |
| [#1350](https://github.com/missingbulb/GoogleCalendarEventCreator/issues/1350) | Q | park:approval | canon | 2026-09-27 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
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

## missingbulb/TLDR — 24 open (7 queue / 17 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#634](https://github.com/missingbulb/TLDR/issues/634) |  | unlabelled-backlog |  | 2026-09-27 | dedup-prune-integrity blocks a legitimate strip once it carries its required provenance entry |
| [#625](https://github.com/missingbulb/TLDR/issues/625) | Q | park:approval | canon | 2026-09-27 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
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

## missingbulb/MissingBulbWebsite — 22 open (9 queue / 13 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#534](https://github.com/missingbulb/MissingBulbWebsite/issues/534) | Q | park:approval | canon | 2026-09-27 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
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

## missingbulb/VascularColoring — 14 open (6 queue / 8 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#535](https://github.com/missingbulb/VascularColoring/issues/535) |  | unlabelled-backlog |  | 2026-09-27 | dedup-prune-integrity's shrink invariant fires on the provenance entry growth-dedup itself requires |
| [#533](https://github.com/missingbulb/VascularColoring/issues/533) | Q | park:action | canon | 2026-09-27 | Add packs: suspected from this repo’s shape |
| [#463](https://github.com/missingbulb/VascularColoring/issues/463) | Q | park:approval | canon | 2026-09-20 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#460](https://github.com/missingbulb/VascularColoring/issues/460) |  | unlabelled-backlog |  | 2026-09-20 | Adopt canon pack: numpy-image-processing |
| [#436](https://github.com/missingbulb/VascularColoring/issues/436) |  | unlabelled-backlog |  | 2026-09-16 | Executor routine's stored prompt still points at queue/instructions.md, which moved to public/ in #422 |
| [#406](https://github.com/missingbulb/VascularColoring/issues/406) | Q | park:approval | canon | 2026-09-13 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#375](https://github.com/missingbulb/VascularColoring/issues/375) |  | unlabelled-backlog |  | 2026-09-07 | README pack-badge block links to two undeclared packs |
| [#370](https://github.com/missingbulb/VascularColoring/issues/370) | Q | park:approval | canon | 2026-09-07 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#361](https://github.com/missingbulb/VascularColoring/issues/361) |  | unlabelled-backlog |  | 2026-09-06 | Dangling README badge link: .claudinite/shared/packs/barriers/badge.svg |
| [#294](https://github.com/missingbulb/VascularColoring/issues/294) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#258](https://github.com/missingbulb/VascularColoring/issues/258) | Q | park:approval | retired | 2026-08-24 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#86](https://github.com/missingbulb/VascularColoring/issues/86) |  | tidy-tracker |  | 2026-08-23 | Claudinite tracker: Tidy Branches |
| [#85](https://github.com/missingbulb/VascularColoring/issues/85) |  | tidy-tracker |  | 2026-08-23 | Claudinite tracker: Tidy PRs |
| [#8](https://github.com/missingbulb/VascularColoring/issues/8) |  | unlabelled-backlog |  | 2026-09-06 | Re-paste the Claudinite environment Setup script |

## missingbulb/CrosswordChat — 13 open (5 queue / 8 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#573](https://github.com/missingbulb/CrosswordChat/issues/573) | Q | park:approval | canon | 2026-09-27 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
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

## missingbulb/Shepherd — 13 open (6 queue / 7 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#823](https://github.com/missingbulb/Shepherd/issues/823) | Q | running-agent | canon | 2026-09-29 | [claudinite-work] claudinite-growth/growth-extract |
| [#816](https://github.com/missingbulb/Shepherd/issues/816) | Q | running-executor | canon | 2026-09-29 | [claudinite-work] shepherd/fleet-issues-snapshot |
| [#801](https://github.com/missingbulb/Shepherd/issues/801) | Q | park:failure | canon | 2026-09-28 | [claudinite-work] shepherd/fleet-issues-snapshot |
| [#788](https://github.com/missingbulb/Shepherd/issues/788) | Q | park:failure | canon | 2026-09-27 | [claudinite-work] shepherd/fleet-issues-snapshot |
| [#771](https://github.com/missingbulb/Shepherd/issues/771) | Q | park:failure | canon | 2026-09-26 | [claudinite-work] shepherd/fleet-issues-snapshot |
| [#617](https://github.com/missingbulb/Shepherd/issues/617) |  | unlabelled-backlog |  | 2026-09-15 | Two tasks in one executor run died on vendored modules that are present at the sha it checked out |
| [#606](https://github.com/missingbulb/Shepherd/issues/606) |  | unlabelled-backlog |  | 2026-09-15 | Support using github projects for task chains of more than 2 |
| [#540](https://github.com/missingbulb/Shepherd/issues/540) |  | unlabelled-backlog |  | 2026-09-10 | Dashboard sign-in: no way to measure button use vs. token-box use |
| [#420](https://github.com/missingbulb/Shepherd/issues/420) |  | unlabelled-backlog |  | 2026-09-02 | Fleet triage 2026-09-02: 53% of parks sit in a kind no rule can drain |
| [#396](https://github.com/missingbulb/Shepherd/issues/396) | Q | park:action | canon | 2026-09-02 | Align local pack rules and skills to the writing-pack-prose references convention |
| [#395](https://github.com/missingbulb/Shepherd/issues/395) |  | unlabelled-backlog |  | 2026-09-01 | Fleet: file ad-hoc tasks to align every member's local packs to the writing-pack-prose convention |
| [#352](https://github.com/missingbulb/Shepherd/issues/352) |  | unlabelled-backlog |  | 2026-09-10 | Turn dashboard sign-in on: register the GitHub App, then run deploy-oauth-exchange |
| [#137](https://github.com/missingbulb/Shepherd/issues/137) |  | unlabelled-backlog |  | 2026-09-06 | The dashboard's morning-brief panel is off, on the repo that writes the briefs |

## missingbulb/EdFringeNow — 9 open (5 queue / 4 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#954](https://github.com/missingbulb/EdFringeNow/issues/954) | Q | running-agent | canon | 2026-09-29 | [claudinite-work] claudinite-growth/growth-extract |
| [#921](https://github.com/missingbulb/EdFringeNow/issues/921) | Q | park:action | canon | 2026-09-27 | Add packs: suspected from this repo’s shape |
| [#876](https://github.com/missingbulb/EdFringeNow/issues/876) |  | unlabelled-backlog |  | 2026-09-24 | Turn on live flight fares: Travelpayouts account, token and marker |
| [#314](https://github.com/missingbulb/EdFringeNow/issues/314) | Q | park:approval | canon | 2026-09-21 | Replace per-file cache TTLs with a published manifest |
| [#295](https://github.com/missingbulb/EdFringeNow/issues/295) | Q | park:approval | canon | 2026-09-21 | The site lists shows edfringe has withdrawn — nothing removes them from the master |
| [#294](https://github.com/missingbulb/EdFringeNow/issues/294) | Q | park:action | canon | 2026-09-25 | Quote fee-inclusive totals, and fix the recorded `fee` they depend on |
| [#237](https://github.com/missingbulb/EdFringeNow/issues/237) |  | unlabelled-backlog |  | 2026-08-17 | Upstream: baselining's deliver() leaves the scheduler checkout on its maintenance branch |
| [#164](https://github.com/missingbulb/EdFringeNow/issues/164) |  | quick-win |  | 2026-09-07 | Monetization: join Booking.com + Omio and paste the IDs into shared/affiliates.js |
| [#161](https://github.com/missingbulb/EdFringeNow/issues/161) |  | quick-win |  | 2026-09-07 | Monetization: join the 4 affiliate programmes and paste the IDs into js/places.js |

## missingbulb/ClaudiniteWebsite — 8 open (3 queue / 5 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#719](https://github.com/missingbulb/ClaudiniteWebsite/issues/719) | Q | park:failure | canon | 2026-09-28 | [claudinite-work] claudinite-website/public-installs |
| [#697](https://github.com/missingbulb/ClaudiniteWebsite/issues/697) | Q | park:failure | canon | 2026-09-27 | [claudinite-work] claudinite-website/site-stats |
| [#669](https://github.com/missingbulb/ClaudiniteWebsite/issues/669) |  | unlabelled-backlog |  | 2026-09-27 | Register the Claudinite Dashboard GitHub App and turn on sign-in |
| [#624](https://github.com/missingbulb/ClaudiniteWebsite/issues/624) |  | unlabelled-backlog |  | 2026-09-20 | site-release's unreleased-commits gate is broader than the site it publishes — 82% of week-1 releases shipped no visible change |
| [#565](https://github.com/missingbulb/ClaudiniteWebsite/issues/565) |  | unlabelled-backlog |  | 2026-09-16 | Executor routine's stored prompt still names the pre-#549 path (queue/instructions.md) |
| [#533](https://github.com/missingbulb/ClaudiniteWebsite/issues/533) |  | unlabelled-backlog |  | 2026-09-13 | git-github-advanced gap: `git rebase --continue`'s default cleanup silently drops commit-message lines starting with `#` |
| [#316](https://github.com/missingbulb/ClaudiniteWebsite/issues/316) |  | blocked |  | 2026-09-07 | Canon patch (blocked on push scope): dedup-prune-integrity flags the VERSIONS.md row growth-dedup's own task doc mandates |
| [#285](https://github.com/missingbulb/ClaudiniteWebsite/issues/285) | Q | park:decision | retired | 2026-08-26 | Verify in production: the redesigned site with the compounding chart |

## missingbulb/ClaudiniteCanary — 6 open (3 queue / 3 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#554](https://github.com/missingbulb/ClaudiniteCanary/issues/554) | Q | park:approval | canon | 2026-09-27 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#510](https://github.com/missingbulb/ClaudiniteCanary/issues/510) | Q | park:failure | canon | 2026-09-22 | Claudinite scheduler run failed |
| [#448](https://github.com/missingbulb/ClaudiniteCanary/issues/448) |  | unlabelled-backlog |  | 2026-09-16 | Repoint the executor routine's stored prompt at public/instructions.md |
| [#373](https://github.com/missingbulb/ClaudiniteCanary/issues/373) |  | unlabelled-backlog |  | 2026-09-07 | Issue #322 stuck: closed by its own PR's `Closes #N` before queue convergence, still wearing task:status:running-agent |
| [#283](https://github.com/missingbulb/ClaudiniteCanary/issues/283) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#239](https://github.com/missingbulb/ClaudiniteCanary/issues/239) |  | unlabelled-backlog |  | 2026-08-23 | converge-item.mjs has no MCP-compatible agent-lane path — a session cannot perform queue instructions.md step 6 |

## missingbulb/NoRFinder — 4 open (1 queue / 3 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#245](https://github.com/missingbulb/NoRFinder/issues/245) |  | unlabelled-backlog |  | 2026-09-29 | Drive setup checklist (#234) doesn't mention clientId and appId, which drive.js requires |
| [#211](https://github.com/missingbulb/NoRFinder/issues/211) |  | unlabelled-backlog |  | 2026-09-27 | dedup-prune-integrity's shrink invariant scopes over provenance/ files, which are mandated to grow |
| [#198](https://github.com/missingbulb/NoRFinder/issues/198) | Q | park:failure | canon | 2026-09-28 | Add packs: suspected from this repo’s shape |
| [#17](https://github.com/missingbulb/NoRFinder/issues/17) |  | unlabelled-backlog |  | 2026-09-05 | tests/test_invariance.py runs in no gate |

## missingbulb/LaughCounter — 3 open (1 queue / 2 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#343](https://github.com/missingbulb/LaughCounter/issues/343) |  | unlabelled-backlog |  | 2026-09-06 | This repo fingerprints the `macos` pack but does not declare it, and its DMG release plumbing is unowned |
| [#174](https://github.com/missingbulb/LaughCounter/issues/174) |  | unlabelled-backlog |  | 2026-09-06 | Distribute LaughCounter via Homebrew Cask (own tap) |
| [#26](https://github.com/missingbulb/LaughCounter/issues/26) | Q | bare-needs-human | retired | 2026-08-17 | [needs-human] Enable Developer ID signing + notarization for the DMG |
