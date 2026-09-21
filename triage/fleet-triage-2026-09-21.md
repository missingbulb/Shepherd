# Fleet triage — 2026-09-21

Ninth run in the series, and the first on genuinely new data since 09-17: snapshot
`2026-09-21T09:54:49.575Z`, 391 open issues across 15 in-scope repos.

**Two members have been dark for eight days, and no issue anywhere in the fleet says so.**
`missingbulb/hitbut` and `missingbulb/ShoutsAndWhispers` last touched an issue on 2026-09-13.
Since then canon has bumped pack versions daily, every other member has minted and closed work,
and these two have produced nothing at all. The fleet's one outside-in liveness check stopped
filing issues on 2026-09-07 — six days before the outage — by a deliberate change that moved the
answer to a dashboard tile. This repo carries two open issues saying that dashboard's panels are
off and its sign-in was never enabled.

Eight of the previous runs, this one included until its last pass, measured the fleet by counting
parks. A dark member files no parks. It is the one condition the whole instrument is blind to.

---

## 1. The quiet ladder

Days since *any* open issue in the repo was last touched, as of the snapshot:

| Repo | Open | Last activity | Quiet |
|---|---:|---|---:|
| **LaughCounter** | 3 | 2026-09-06T21:01 | **14.5 d** |
| **WIP** | 18 | 2026-09-07T09:36 | **14.0 d** |
| **ShoutsAndWhispers** | 18 | 2026-09-13T09:49 | **8.0 d** |
| **hitbut** | 23 | 2026-09-13T11:04 | **8.0 d** |
| **TLDR** | 23 | 2026-09-16T09:37 | **5.0 d** |
| NoRFinder | 7 | 2026-09-20T09:10 | 1.0 d |
| GoogleCalendarEventCreator | 33 | 2026-09-20T09:19 | 1.0 d |
| CrosswordChat | 12 | 2026-09-20T09:21 | 1.0 d |
| MissingBulbWebsite | 21 | 2026-09-20T09:27 | 1.0 d |
| ClaudiniteWebsite | 5 | 2026-09-20T19:02 | 0.6 d |
| EdFringeNow | 19 | 2026-09-20T19:24 | 0.6 d |
| Claudinite | 166 | 2026-09-21T08:58 | 0.0 d |
| ClaudiniteCanary | 7 | 2026-09-21T09:54 | 0.0 d |
| Shepherd | 20 | 2026-09-21T09:54 | 0.0 d |
| VascularColoring | 16 | 2026-09-21T09:54 | 0.0 d |

The ladder is staircased, not simultaneous — 09-06, 09-07, 09-13, 09-13, 09-16 — which rules out
one fleet-wide outage and points at members stopping individually.

Five quiet members hold **85 open issues**, 22% of the fleet, none of which any mechanism has
looked at since the date in that row. Every count this series has reported for those repos —
their parks, their lane duplication, their label generation — describes a snapshot nothing has
touched. That caveat belongs beside their numbers in every prior run's tables too.

## 2. The three surviving `failure` parks, and what they are not

`failure` is the only kind `isBlockingPark` matches (canon `public/work-item-grammar.mjs:46`),
and it is in `SUPERSEDABLE_PARKS` (`src/recover/janitor-rules.mjs:42`) — a later clean run clears
it. Both re-derived from canon at `94796c1` this run. Note both files moved again since 09-18;
see §4.

Tracking every `failure` park across four snapshots, with the park's age beside its repo's quiet
clock:

| Snapshot | Failure parks | Survivors |
|---|---:|---|
| 09-13 | 16 | — |
| 09-14 | 10 | — |
| 09-17 | 6 | — |
| 09-21 | **3** | Claudinite#1682, hitbut#286, ShoutsAndWhispers#437 |

The falling count reads as recovery. It is survivorship. Thirteen of the sixteen drained because
their members kept running; the three that remain are:

| Park | Filed | Park age | Repo quiet |
|---|---|---:|---:|
| [Claudinite#1682](https://github.com/missingbulb/Claudinite/issues/1682) | 2026-09-04 | 17.1 d | 0.0 d |
| [hitbut#286](https://github.com/missingbulb/hitbut/issues/286) | 2026-09-13T10:34 | **8.0 d** | **8.0 d** |
| [ShoutsAndWhispers#437](https://github.com/missingbulb/ShoutsAndWhispers/issues/437) | 2026-09-13T09:47 | **8.0 d** | **8.0 d** |

For the two dark members, park age and repo quiet time are equal at **every** snapshot in the
series — 0.3/0.3, 1.0/1.0, 4.0/4.0, 8.0/8.0. The member has been frozen for exactly as long as
the park has existed.

### A hypothesis this run raised and dropped

The obvious reading of that table is that the blocking park froze the member. I wrote that
conclusion, then tested it and it does not hold:

- **The control case refutes it.** Claudinite#1682 is a blocking `failure` park 17 days old, and
  Claudinite is the most active repo in the fleet (quiet 0.0 d, 19 issues filed in four days). A
  blocking park holds *its own lane*, not its member. #1682 is `task:origin:ad-hoc` — a migration
  chain link with no recurring lane — so it blocks nothing that recurs.
- **The timestamps put the park inside the freeze, not before it.** ShoutsAndWhispers#437 was
  filed 09-13T09:47 and the repo's *other* seventeen issues were last touched 09-13T09:49, two
  minutes later, by a janitor sweep. The sweep ran after the park. Then everything stopped
  together.
- **hitbut#286 states the cause in its title** — "Claudinite scheduler run failed", carrying
  `workflow-failure` and `task:origin:github`. The scheduler crashed; the park is the record of
  the crash.

So the park is the tombstone, not the cause. What canon *does* explain is why neither member
recovers: `task-janitor` is declared `"trigger": "schedule"`
(`packs/claudinite-tasks/tasks/task-janitor/task.json`). The rule that would supersede the park
is itself a scheduled task inside the member whose scheduler stopped. A frozen member cannot
un-freeze itself.

**What I could not establish:** the cause of the 09-13 stop. That needs each member's Actions
runs, and this session is scoped to Shepherd; an `add_repo` for TLDR was denied by the auto-mode
classifier ("External System Writes"), as one for ClaudiniteCanary was on 09-17. I also checked
and discarded the tempting explanation that the `public/` re-shelve broke them: the first
re-shelve ([Claudinite#2068](https://github.com/missingbulb/Claudinite/pull/2068)) landed
**2026-09-15T19:02**, two days *after* both members went dark. The 09-15 and 09-17 reports leaned
on that re-shelve as the fleet's central breakage; it cannot account for this.

## 3. Why nothing reported it — canon says so in its own words

The fleet-roster sweep's freshness half opens with the problem stated exactly
(`packs/claudinite-fleet-sheepdog/tasks/fleet-roster/freshness.mjs`, header):

> Under per-project scheduling every member maintains ITSELF … That is the right architecture —
> and it removed the last thing that ever looked at a member from the outside. A member whose
> scheduler was never vendored, whose workflow was deleted, or whose baselining has been failing
> for a fortnight is otherwise invisible: it still carries a declaration, so the coverage half
> calls it covered, and it files no failure issue because nothing runs there to fail.
> **Self-maintenance cannot detect its own absence.**

The sweep can classify this — its report table has a `no scheduler` column. The question is where
that answer goes, and the same header says:

> WHERE THE ANSWER GOES: the run report, and nowhere else. This half filed a `fleet-drift` issue
> per unhealthy member until #1854.

That removal is `c802c4d`, *"Answer fleet freshness on the run report, not in an issue per member
(#1855)"*, merged **2026-09-07T11:32**. The reasoning was sound — the dashboard's Drift tile
measures the same fact from the same source and recomputes on load, so the issues were the staler
of two surfaces.

The chain that leaves:

1. **2026-09-07T06:28** — [Shepherd#169](https://github.com/missingbulb/Shepherd/issues/169)
   is filed, `fleet-drift`, naming VascularColoring. Five hours later the filing is removed. It
   is the last `fleet-drift` issue in the fleet, still open, a fossil.
2. **2026-09-07T11:32** — `c802c4d`. Liveness now answers only into a workflow run report and a
   dashboard tile.
3. **2026-09-13** — hitbut and ShoutsAndWhispers go dark.
4. **2026-09-21** — eight days on, no issue in any of the 391 names either repo's silence.

And the surviving surface is not being read. This repo carries
[Shepherd#137](https://github.com/missingbulb/Shepherd/issues/137) — *"The dashboard's
morning-brief panel is off"* — and
[Shepherd#352](https://github.com/missingbulb/Shepherd/issues/352) — *"Turn dashboard sign-in on:
register the GitHub App"*. Both open, both predating the outage.

Nothing here is a defect in `c802c4d`. Two surfaces for one question is a real cost, and the
tile genuinely is fresher. What the change assumed is that somebody is looking at the tile.

## 4. `public/` moved — and the one consumer shape nobody checked

The 09-18 run corrected the 09-17 headline by crediting canon's `public/` folder as the durable
answer to the stored-prompt breakage, on the strength of its stated contract
(`packs/claudinite-tasks/README.md`):

> One folder, one promise: **a name in `public/` does not move.**

That sentence is still in canon's README today. Since 09-18, twenty-one names have moved out of
`public/`:

| Commit | Merged | What |
|---|---|---|
| `238466d` (#2116) | 2026-09-20T11:52 | Restructure the public surface **behind shims** |
| `6fddbd9` (#2167) | 2026-09-20T13:42 | **Delete** the 21 retired shims |

`create-work-item.mjs`, `work-items.mjs`, `task-contract.mjs`, `merge-policy.mjs`, `executor.mjs`,
`wake.mjs` and fifteen others now live under `src/`.

The shim window was **110 minutes** — but that number is misleading and the migration was in fact
driven properly. #2167's own message says the convergence was forced, not waited out:

> Every member's two workflow files now run the src/ entry points and no member's local pack
> imports a retired path (fourteen member pull requests, each merged from the migration session
> and each scheduler run green on the new lines)

That is `basics/RULES.md`'s migration rule executed correctly — converge in one forced pass rather
than trickle across nightly cycles. **The claim is also true as stated.** I tested it against this
member: Shepherd's four `.mjs` imports of the tasks pack all name `delivery.mjs`,
`task-constants.mjs` and `task-declaration.mjs` — three names that survived.

The gap is the word *imports*. Shepherd's local pack names a retired path twice, in **prose**, as
a shell command:

```
.claudinite/local/packs/shepherd/skills/fleet-triage/SKILL.md:38
.claudinite/local/packs/shepherd/tasks/fleet-issues-snapshot/README.md:12
    node .claudinite/shared/packs/claudinite-tasks/public/create-work-item.mjs shepherd/fleet-issues-snapshot
```

The blocking guard that enforces the surface, `tasks-pack-read-through-its-surface`, cannot see
these. Its `scanFiles` is `.m?js` only and its matcher requires an `import`/`from`:

```json
"scanFiles": "/^(\\.claudinite\\/(shared|local)\\/packs\\/(?!claudinite-tasks\\/).*\\.m?js|packs\\/(?!claudinite-tasks\\/)(?!.*(\\/test\\/|\\.test\\.m?js$)).*\\.m?js)$/",
"matchLines": [{ "match": "/(?:from|import\\s*\\()\\s*['\"][^'\"]*claudinite-tasks\\/(?!public\\/)[^'\"]*['\"]/" }]
```

The 09-18 run flagged that scope as a theoretical gap. This is it firing, with a consequence, in
this repository. **It is not broken today** — Shepherd's mount still carries the shims, one
converge behind canon, so the path resolves right now. It stops resolving on the next converge,
and what stops working is the command in §1 of the very skill that produces this report.

A path a person or an agent runs from prose is a consumer of `public/` exactly as an `import` is.
Neither the guard nor the migration's verification covers that shape, and the lifecycle rules put
a member's own local-pack prose beyond anything a converge may rewrite.

## 5. Correcting the 09-17 headline: the prediction did not come true

The 09-17 run named an eight-member cohort that had each filed an issue saying its executor
routine's stored prompt still pointed at the pre-move `queue/instructions.md`, and rested on
`create-work-item.mjs`'s header, which predicts the consequence:

> A member spends every window between its mount refreshing (nightly) and those being re-pointed
> (whenever) running whichever path it still names — so a run that finds nothing here is a repo
> whose queue stops silently, with no run left to fix it.

Five days later, that is measurably not what happened.

| Repo | Issue | Filed | Repo quiet at 09-21 |
|---|---|---|---:|
| VascularColoring | #436 | 09-16T09:24 | 0.0 d |
| ClaudiniteCanary | #448 | 09-16T09:24 | 0.0 d |
| ClaudiniteWebsite | #565 | 09-16T09:29 | 0.6 d |
| EdFringeNow | #726 | 09-16T09:46 | 0.6 d |
| GoogleCalendarEventCreator | #1260 | 09-16T09:32 | 1.0 d |
| MissingBulbWebsite | #421 | 09-15T19:58 | 1.0 d |
| NoRFinder | #102 | 09-16T09:41 | 1.0 d |
| **TLDR** | **#545** | **09-16T09:37** | **5.0 d** |

**Seven of the eight kept running.** Only TLDR went quiet, and its last activity is that issue
itself — one data point, consistent with the prediction but equally consistent with TLDR stopping
for the reason hitbut and ShoutsAndWhispers did.

The 09-17 report presented the cohort as the fleet's most serious condition on the strength of
that predicted failure mode. The prediction is not supported by five days of subsequent data. The
*condition* is real — the stored prompts are still wrong — but it is not what is stopping members.

A second measurement on the same cohort: **all eight issues are byte-identical across the 09-17
and 09-21 snapshots** — same `created_at`, same `updated_at`, zero comments, no label, untouched
in five days. Whatever they are waiting for, nothing is coming for them. The 09-17 finding that
no canon issue exists for the one-time backfill still holds.

## 6. The half of the fleet this series keeps under-reporting

| Snapshot | Total | Queue | Plain | of which unlabelled |
|---|---:|---:|---:|---:|
| 09-02 | 349 | 133 | 216 | 107 |
| 09-08 | 410 | 184 | 226 | 199 |
| 09-13 | 417 | 177 | 240 | 212 |
| 09-17 | 372 | 131 | 241 | 214 |
| 09-21 | 391 | **134** | **257** | **230** |

The queue half is flat across nineteen days (133 → 134). The plain half has grown every single
snapshot, and the unlabelled backlog inside it has more than doubled, 107 → 230. It is now **59%
of every open issue in the fleet**.

Every run in this series, including this one, has spent most of its analysis on the 134. The
mechanisms are there, so that is where the findings are. But the untriaged pile is the larger
number and the one with no mechanism pointed at it at all — it has no janitor, no supersession,
no rule, and nothing that ages it out.

## 7. Park semantics and the standing distribution

Re-derived from canon at `94796c1`, unchanged in substance since 09-17:

- `isBlockingPark` — **`failure` only** (`public/work-item-grammar.mjs:46`).
- `SUPERSEDABLE_PARKS` — **`['failure', 'action']`** (`src/recover/janitor-rules.mjs:42`).
- `decision` and `approval` are in neither set: they hold no lane and no rule drains them. They
  accumulate by construction.

| Kind | Count | Blocking | Superseable |
|---|---:|---|---|
| approval | 50 | no | **no** |
| decision | 31 | no | **no** |
| blocked | 22 | — | — |
| action | 12 | no | yes |
| waiting-for-executor | 10 | — | — |
| failure | 3 | **yes** | yes |
| bare-needs-human | 2 | — | — |
| running-agent / running-executor | 4 | — | — |

81 of 134 queue items (60%) are `approval` or `decision` — the two kinds nothing mechanical can
end. That share has been between 53% and 62% in every run since 09-02.
[Claudinite#2010](https://github.com/missingbulb/Claudinite/issues/2010) remains the open issue
for it.

**Label generation**: 114 canon, 18 retired, 2 with no status label at all. The retired population
is down from 18 of 131 to 18 of 134 — i.e. unchanged in absolute terms. Nothing re-labels a
parked item, and eight of the eighteen sit in the five quiet repos.

### Lane duplication

42 distinct lanes carry 73 items; 13 lanes hold more than one, for 31 redundant items. The worst:

| Lane | Items |
|---|---:|
| Claudinite / `claudinite-canon-curation/growth-promote` | 8 |
| TLDR / `claudinite-growth/rule-revalidation` | 5 |
| VascularColoring / `claudinite-growth/prose-to-checks-sweep` | 5 |
| CrosswordChat / `claudinite-growth/prose-to-checks-sweep` | 4 |

**Correcting the 09-17 correction on `growth-promote`.** That run found the six items were two
open PRs with later items amending earlier ones — a working mechanism, not backlog. The lane is
now eight items and **three** open PRs:
[#1886](https://github.com/missingbulb/Claudinite/pull/1886) (09-07, 14 days),
[#2032](https://github.com/missingbulb/Claudinite/pull/2032) (09-14),
[#2206](https://github.com/missingbulb/Claudinite/pull/2206) (09-21). The mechanism still works as
described; what has changed is that the oldest PR has been open a fortnight, so the amendment
chain is accumulating rather than draining. Four tasks in `claudinite-growth` plus this one still
carry 53 of the 73 lane items.

### The blocked population

22 blocked items, all `task:origin:ad-hoc`. Eleven of them are one chain:
**ShoutsAndWhispers #383–#395**, a plan decomposed on 2026-09-06 into thirteen chained issues, of
which eleven are still blocked at **14.8 days**. Their release is the Action-side
`readyDependents` hand-off, which runs in the member — the member that has been dark since 09-13.
Ten more are Claudinite's own migration chains (#1237, #1346, #1683, #1881, #1909, #2017,
#2170–#2173), on a live member and progressing normally.

Report the S&W chain as **one** stalled item, not eleven. Nothing there is individually stuck.

## 8. Shepherd's own state

Converged all ten items the 09-17 run listed (#634–#643, all closed). Minted seven fresh
occurrences at 09-21T09:52 (#699–#705, all `waiting-for-executor`) plus #708 running, and this
snapshot is #711's output. Twenty open: twelve queue, eight plain.

Carrying three items with direct bearing on this report:
[#137](https://github.com/missingbulb/Shepherd/issues/137) and
[#352](https://github.com/missingbulb/Shepherd/issues/352) (the dashboard that now holds the only
liveness surface), and [#169](https://github.com/missingbulb/Shepherd/issues/169) (the fleet's
last `fleet-drift` issue, open since the day filing was removed).
[#617](https://github.com/missingbulb/Shepherd/issues/617) is still unaddressed in canon.

## 9. Corrections to earlier runs in this series

1. **09-17's headline overstated the stored-prompt cohort.** Its predicted failure mode — members
   silently stopping — did not occur in seven of the eight over five days (§5).
2. **09-15 and 09-17 attributed fleet breakage to the `public/` re-shelve.** The first re-shelve
   merged 09-15T19:02, after both dark members stopped on 09-13. It cannot explain them (§2).
3. **09-18 credited `public/`'s "a name here does not move" as the durable answer.** Twenty-one
   names moved out on 09-20. The migration was driven correctly and the README sentence was not
   (§4).
4. **09-17's `growth-promote` correction needs updating** — two open PRs is now three, oldest 14
   days (§7).
5. **This run's own first reading — that a blocking park froze two members — is wrong**, refuted
   by its control case and by its own timestamps (§2).
6. **Every prior run's per-repo numbers for the five quiet members** describe snapshots no
   mechanism has touched since, in one case for a fortnight (§1).

## 10. Still open — recommendations, not actions

This skill assesses and reports. Every item below is somebody's explicit call.

1. **hitbut and ShoutsAndWhispers have been dark 8 days.** Nothing in the fleet will notice or
   recover them; the janitor that would is scheduled inside them. Needs a person to read each
   member's Actions runs.
2. **LaughCounter (14.5 d), WIP (14.0 d), TLDR (5.0 d)** are on the same ladder and unverified.
3. **Nothing files an issue when a member goes silent.** Since `c802c4d` the answer lives in a
   workflow run report and a dashboard tile, and Shepherd#137/#352 say the dashboard isn't being
   read. A liveness signal that reaches somebody is a canon change, not a fleet one.
4. **`tasks-pack-read-through-its-surface` is `.m?js`-and-`import`-only.** Shepherd's own two
   prose pointers at `public/create-work-item.mjs` break on its next converge — including this
   skill's documented command.
5. **Canon's `claudinite-tasks/README.md` still promises names in `public/` do not move**, after
   twenty-one did.
6. **The one-time backfill of eight members' stored prompts** still has no canon issue, and all
   eight member issues are untouched in five days.
7. **81 of 134 queue items are `approval` or `decision`** — neither blocking nor superseable.
   [Claudinite#2010](https://github.com/missingbulb/Claudinite/issues/2010).
8. **230 unlabelled plain issues, 59% of the fleet**, with no mechanism pointed at them.
9. **ShoutsAndWhispers' 11-item blocked chain** cannot release until its member runs again — one
   stalled item, not eleven.
10. **`growth-promote`'s oldest PR has been open 14 days**, and the lane amends rather than drains.

The next run wants a snapshot newer than 2026-09-21T09:54Z, which arrives when Shepherd's
scheduler next fires. It should check the quiet ladder first — before counting anything.

---

*Per-repo evidence for all 391 issues follows.*

391 open issues across 15 in-scope repos under `missingbulb` (snapshot generated 2026-09-21T09:54:49.575Z).
`Q` = queue-managed. `Gen` = label generation (canon `task:status:*` vs retired `needs-human`/`task:needs-human-*`).


## missingbulb/Claudinite — 166 open (45 queue / 121 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#2194](https://github.com/missingbulb/Claudinite/issues/2194) | Q | waiting-for-executor | canon | 2026-09-21 | [claudinite-work] claudinite-canon-curation/growth-promote |
| [#2193](https://github.com/missingbulb/Claudinite/issues/2193) |  | unlabelled-backlog |  | 2026-09-21 | no-new-long-dashes reads a pure rename as added lines, so moving a file with long dashes fires once per line |
| [#2188](https://github.com/missingbulb/Claudinite/issues/2188) |  | unlabelled-backlog |  | 2026-09-21 | Remove the deprecated alias left by the personal-pack change |
| [#2181](https://github.com/missingbulb/Claudinite/issues/2181) |  | unlabelled-backlog |  | 2026-09-20 | Take the retired taskScheduler anchor keys off the accepted list |
| [#2173](https://github.com/missingbulb/Claudinite/issues/2173) | Q | blocked | canon | 2026-09-20 | Retrospective: provenance, a week after the shelf's last empty file fills |
| [#2172](https://github.com/missingbulb/Claudinite/issues/2172) | Q | blocked | canon | 2026-09-20 | Retrospective: provenance, a week after the marking pass |
| [#2171](https://github.com/missingbulb/Claudinite/issues/2171) | Q | blocked | canon | 2026-09-20 | Verify in production: a promote PR carries a reduced provenance file beside its marked rule |
| [#2170](https://github.com/missingbulb/Claudinite/issues/2170) | Q | blocked | canon | 2026-09-20 | Provenance L5: retire the references.md conversion tolerance at the window's end |
| [#2169](https://github.com/missingbulb/Claudinite/issues/2169) |  | unlabelled-backlog |  | 2026-09-21 | Provenance: a per-element decision log for every pack — tracking issue |
| [#2165](https://github.com/missingbulb/Claudinite/issues/2165) |  | unlabelled-backlog |  | 2026-09-20 | canon-prose-to-checks cannot write its own worklist: the inventory sits outside its automerge prediction |
| [#2163](https://github.com/missingbulb/Claudinite/issues/2163) |  | unlabelled-backlog |  | 2026-09-20 | converge-item: `--pr` on a `done` outcome plans an approval-park sentence |
| [#2139](https://github.com/missingbulb/Claudinite/issues/2139) |  | unlabelled-backlog |  | 2026-09-20 | The `task-cadence-terms` migration record probes a path #1890 moved, so it has been inert since 2026-09-14 |
| [#2137](https://github.com/missingbulb/Claudinite/issues/2137) |  | unlabelled-backlog |  | 2026-09-19 | A chain link in another repo can tick its tracker box without routing its record there — #1691's CrosswordChat link blocks retrospective #1724 |
| [#2129](https://github.com/missingbulb/Claudinite/issues/2129) |  | unlabelled-backlog |  | 2026-09-18 | Author cloudflare-site/internal-links-omit-html-extension as a check |
| [#2128](https://github.com/missingbulb/Claudinite/issues/2128) |  | unlabelled-backlog |  | 2026-09-18 | The local-rules rehearsal fixture points $schema at a pack its member never declares, so both its modes have been red since #2058 |
| [#2126](https://github.com/missingbulb/Claudinite/issues/2126) |  | unlabelled-backlog |  | 2026-09-18 | No canon rule says a pack file may not name another pack — the owner has corrected it twice, two months apart |
| [#2125](https://github.com/missingbulb/Claudinite/issues/2125) |  | unlabelled-backlog |  | 2026-09-18 | SURFACE.GENERATED.md is stale since #2101, so pack-surface.test.mjs fails under CI on every branch |
| [#2117](https://github.com/missingbulb/Claudinite/issues/2117) | Q | park:approval | canon | 2026-09-18 | [claudinite-work] claudinite-canon-curation/growth-promote |
| [#2113](https://github.com/missingbulb/Claudinite/issues/2113) |  | unlabelled-backlog |  | 2026-09-17 | Retire the cloudflare-site/bump-version.mjs shim once no member prose names it |
| [#2089](https://github.com/missingbulb/Claudinite/issues/2089) | Q | park:approval | canon | 2026-09-17 | [claudinite-work] claudinite-canon-curation/growth-promote |
| [#2085](https://github.com/missingbulb/Claudinite/issues/2085) |  | unlabelled-backlog |  | 2026-09-15 | Test-suite performance: what is left, and what was ruled out |
| [#2083](https://github.com/missingbulb/Claudinite/issues/2083) |  | unlabelled-backlog |  | 2026-09-15 | converge-item.mjs prints "Waiting on a person… then close this item" onto a `done` it closes in the same plan |
| [#2077](https://github.com/missingbulb/Claudinite/issues/2077) |  | unlabelled-backlog |  | 2026-09-15 | Should the tasks usage fold count janitor repairs and leash reclaims? |
| [#2067](https://github.com/missingbulb/Claudinite/issues/2067) |  | unlabelled-backlog |  | 2026-09-15 | update-worker.test.mjs asserts on worker.mjs's source text because main() is the only way in |
| [#2065](https://github.com/missingbulb/Claudinite/issues/2065) | Q | park:approval | canon | 2026-09-15 | Sweep the remaining process.exit() calls that can truncate their own output |
| [#2024](https://github.com/missingbulb/Claudinite/issues/2024) | Q | park:approval | canon | 2026-09-14 | [claudinite-work] claudinite-canon-curation/growth-promote |
| [#2023](https://github.com/missingbulb/Claudinite/issues/2023) |  | unlabelled-backlog |  | 2026-09-13 | A pack's load fails under parallel test load — cause still unidentified |
| [#2020](https://github.com/missingbulb/Claudinite/issues/2020) |  | unlabelled-backlog |  | 2026-09-13 | loadPacks drops discovery errors, so a pack that fails to load silently stops forcing its skills |
| [#2017](https://github.com/missingbulb/Claudinite/issues/2017) | Q | blocked | canon | 2026-09-20 | Verify in production: the scheduler's weekly-window run no longer spends minutes on commit reads |
| [#2014](https://github.com/missingbulb/Claudinite/issues/2014) |  | unlabelled-backlog |  | 2026-09-13 | fleet-baseline's follow budget can exceed its own code_work_timeout, so a long follow is killed instead of reported |
| [#2012](https://github.com/missingbulb/Claudinite/issues/2012) |  | unlabelled-backlog |  | 2026-09-13 | GitHub Actions cache: where it helps Claudinite's machinery and members, and where it doesn't |
| [#2011](https://github.com/missingbulb/Claudinite/issues/2011) |  | unlabelled-backlog |  | 2026-09-13 | `fleet-baseline` has no verdict for a review-gated member, so it fails the run and parks |
| [#2010](https://github.com/missingbulb/Claudinite/issues/2010) |  | unlabelled-backlog |  | 2026-09-13 | The executor leash still parks `decision` — #1515 was fixed on the agent leash only |
| [#2000](https://github.com/missingbulb/Claudinite/issues/2000) |  | unlabelled-backlog |  | 2026-09-13 | rules-append-only and rules-line-length are in tension for any rule headline over ~96 bytes |
| [#1999](https://github.com/missingbulb/Claudinite/issues/1999) |  | unlabelled-backlog |  | 2026-09-13 | queue/instructions.md defines no branch for a fire that carries no payload |
| [#1996](https://github.com/missingbulb/Claudinite/issues/1996) |  | unlabelled-backlog |  | 2026-09-13 | `task:origin:manual`'s description claims the woken case, which wears `task:origin:planned` |
| [#1994](https://github.com/missingbulb/Claudinite/issues/1994) |  | unlabelled-backlog |  | 2026-09-13 | The scheduler's log drops the `asked` line for a task whose standing item is live |
| [#1989](https://github.com/missingbulb/Claudinite/issues/1989) |  | unlabelled-backlog |  | 2026-09-13 | Retire the re-export shims left by dropping the rule-token metric |
| [#1988](https://github.com/missingbulb/Claudinite/issues/1988) |  | unlabelled-backlog |  | 2026-09-13 | Personal preferences: from a context-token provider to a personal pack provider |
| [#1983](https://github.com/missingbulb/Claudinite/issues/1983) |  | unlabelled-backlog |  | 2026-09-15 | Dashboard: require sign-in on its own screen, remember the credential, and put account controls under the avatar |
| [#1972](https://github.com/missingbulb/Claudinite/issues/1972) |  | unlabelled-backlog |  | 2026-09-13 | converge-item's `--pr` stamps a "waiting on a person" line onto a `done` that closes the item |
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
| [#1909](https://github.com/missingbulb/Claudinite/issues/1909) | Q | blocked | canon | 2026-09-21 | Retire the `barriers` and `tidy-repo` pack id tolerances |
| [#1904](https://github.com/missingbulb/Claudinite/issues/1904) |  | unlabelled-backlog |  | 2026-09-09 | A forced wake ignores `taskScheduler.disabledTasks` and runs a task the repo turned off |
| [#1892](https://github.com/missingbulb/Claudinite/issues/1892) | Q | park:approval | canon | 2026-09-08 | [claudinite-work] claudinite-canon-curation/growth-promote |
| [#1891](https://github.com/missingbulb/Claudinite/issues/1891) |  | unlabelled-backlog |  | 2026-09-08 | Rule I's rationale cites a lane-hold that planSchedulerRun no longer performs |
| [#1885](https://github.com/missingbulb/Claudinite/issues/1885) |  | unlabelled-backlog |  | 2026-09-07 | Retrospective-lane review: the 0–3 / &gt;5 weekly filing bound reads a heavy-refactor week as overuse |
| [#1884](https://github.com/missingbulb/Claudinite/issues/1884) |  | unlabelled-backlog |  | 2026-09-07 | production-retrospective filing has no dedup guard — #1609 and #1624 duplicate the same subject |
| [#1881](https://github.com/missingbulb/Claudinite/issues/1881) | Q | blocked | canon | 2026-09-16 | Retrospective: the claudinite-tasks reorganization — roles, harness, principles, rewrites, measurement |
| [#1869](https://github.com/missingbulb/Claudinite/issues/1869) |  | unlabelled-backlog |  | 2026-09-15 | Reorganize claudinite-tasks: roles as folders, the simulator as the harness, principles as the spec |
| [#1868](https://github.com/missingbulb/Claudinite/issues/1868) |  | unlabelled-backlog |  | 2026-09-07 | dedup-prune-integrity misfires on any local-pack-confined branch whose commit message says "dedup" |
| [#1861](https://github.com/missingbulb/Claudinite/issues/1861) | Q | park:approval | canon | 2026-09-07 | [claudinite-work] claudinite-canon-curation/growth-promote |
| [#1849](https://github.com/missingbulb/Claudinite/issues/1849) |  | unlabelled-backlog |  | 2026-09-07 | `INCLUDE_DORMANT=true` is a no-op — the scheduler's dormancy gate runs before the forced wake |
| [#1847](https://github.com/missingbulb/Claudinite/issues/1847) |  | unlabelled-backlog |  | 2026-09-07 | claudinite-lifecycle/update's task.md narrates how its PR lands |
| [#1846](https://github.com/missingbulb/Claudinite/issues/1846) |  | unlabelled-backlog |  | 2026-09-07 | Retire the top-level `dormant` tolerance once the fleet has converged onto the pack-entry spelling |
| [#1837](https://github.com/missingbulb/Claudinite/issues/1837) |  | unlabelled-backlog |  | 2026-09-06 | The repo ledger counts a person's close of a park as "no outcome", and flags it bad |
| [#1823](https://github.com/missingbulb/Claudinite/issues/1823) |  | unlabelled-backlog |  | 2026-09-06 | forbidRemovedLinesMatching cannot see a deleted file, so updates-export-removed misses the worst case |
| [#1816](https://github.com/missingbulb/Claudinite/issues/1816) | Q | park:decision | canon | 2026-09-13 | Retrospective: the claudinite-tasks pack boundary |
| [#1806](https://github.com/missingbulb/Claudinite/issues/1806) |  | unlabelled-backlog |  | 2026-09-06 | Check that a migration record's `version` is above its pack's current version |
| [#1789](https://github.com/missingbulb/Claudinite/issues/1789) | Q | park:approval | canon | 2026-09-21 | Retire the trigger derivation: a task declaration must state its own `trigger` |
| [#1783](https://github.com/missingbulb/Claudinite/issues/1783) |  | unlabelled-backlog |  | 2026-09-06 | A pack migration record cannot name the version it lands at now that versions are cut on main |
| [#1759](https://github.com/missingbulb/Claudinite/issues/1759) |  | unlabelled-backlog |  | 2026-09-06 | merge-to-main's prompt trigger misses a lowercase "lgtm" |
| [#1749](https://github.com/missingbulb/Claudinite/issues/1749) |  | unlabelled-backlog |  | 2026-09-06 | Move .claudinite-settings.json into .claudinite/ |
| [#1732](https://github.com/missingbulb/Claudinite/issues/1732) | Q | park:approval | canon | 2026-09-19 | Retire the frequency door: a task declaration states its cadence as a precondition term |
| [#1725](https://github.com/missingbulb/Claudinite/issues/1725) |  | unlabelled-backlog |  | 2026-09-06 | Scheduling as preconditions: retire `frequency` and the schedule board |
| [#1724](https://github.com/missingbulb/Claudinite/issues/1724) | Q | park:action | canon | 2026-09-19 | Retrospective: the local-pack consolidation and the three packs it promoted |
| [#1720](https://github.com/missingbulb/Claudinite/issues/1720) |  | unlabelled-backlog |  | 2026-09-05 | A merge resolution can silently delete a VERSIONS.md row, and nothing catches it |
| [#1716](https://github.com/missingbulb/Claudinite/issues/1716) | Q | park:decision | canon | 2026-09-07 | Verify in production: the executor amends or supersedes a task's open pull request |
| [#1710](https://github.com/missingbulb/Claudinite/issues/1710) |  | unlabelled-backlog |  | 2026-09-04 | Waking verify-production mints a standing item that can only park |
| [#1704](https://github.com/missingbulb/Claudinite/issues/1704) |  | unlabelled-backlog |  | 2026-09-04 | guardToolCalls needs a session-context predicate — guard a tool in trigger-fired sessions only |
| [#1703](https://github.com/missingbulb/Claudinite/issues/1703) | Q | park:decision | canon | 2026-09-13 | Retrospective: the four-moment declared-check mechanism |
| [#1698](https://github.com/missingbulb/Claudinite/issues/1698) | Q | park:approval | canon | 2026-09-12 | Retire the target hand-off tolerances: the update worker's own disposal and the generated lane's prefix discovery |
| [#1683](https://github.com/missingbulb/Claudinite/issues/1683) | Q | blocked | canon | 2026-09-21 | Retrospective: barriers folded into basics |
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
| [#1346](https://github.com/missingbulb/Claudinite/issues/1346) | Q | blocked | none | 2026-09-21 | Move taskScheduler from a top-level settings key into the claudinite-tasks pack's own config |
| [#1341](https://github.com/missingbulb/Claudinite/issues/1341) |  | unlabelled-backlog |  | 2026-08-24 | Eliminate the task-janitor: fold its recovery into the scheduler run, its visibility into the dashboard |
| [#1333](https://github.com/missingbulb/Claudinite/issues/1333) |  | unlabelled-backlog |  | 2026-09-06 | claudinite-canary-repo: the withhold lane it probes no longer exists |
| [#1317](https://github.com/missingbulb/Claudinite/issues/1317) |  | unlabelled-backlog |  | 2026-09-06 | Extract the task execution/scheduling surface into a claudinite-tasks pack |
| [#1313](https://github.com/missingbulb/Claudinite/issues/1313) |  | unlabelled-backlog |  | 2026-09-06 | Gate packs/* against .claudinite/local in the barriers config |
| [#1295](https://github.com/missingbulb/Claudinite/issues/1295) |  | unlabelled-backlog |  | 2026-09-06 | A member whose Actions jobs cannot start has no escalation path — report-failure dies with everything else |
| [#1275](https://github.com/missingbulb/Claudinite/issues/1275) | Q | park:approval | retired | 2026-08-23 | [claudinite-work] claudinite-growth/rule-revalidation |
| [#1274](https://github.com/missingbulb/Claudinite/issues/1274) | Q | park:approval | retired | 2026-08-23 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#1264](https://github.com/missingbulb/Claudinite/issues/1264) |  | unlabelled-backlog |  | 2026-09-06 | Delete the two-name settings-file tolerance once no member carries .claudinite-checks.json |
| [#1237](https://github.com/missingbulb/Claudinite/issues/1237) | Q | blocked | none | 2026-09-21 | Chain 3/3: retire the twice-daily-cron migration tolerances |
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

## missingbulb/GoogleCalendarEventCreator — 33 open (11 queue / 22 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
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

## missingbulb/TLDR — 23 open (8 queue / 15 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#545](https://github.com/missingbulb/TLDR/issues/545) |  | unlabelled-backlog |  | 2026-09-16 | Executor routine's stored prompt points at a path instructions.md no longer lives at |
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

## missingbulb/Shepherd — 20 open (12 queue / 8 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#708](https://github.com/missingbulb/Shepherd/issues/708) | Q | running-executor | canon | 2026-09-21 | [claudinite-work] shepherd/fleet-issues-snapshot |
| [#705](https://github.com/missingbulb/Shepherd/issues/705) | Q | waiting-for-executor | canon | 2026-09-21 | [claudinite-work] claudinite-tasks/task-janitor |
| [#704](https://github.com/missingbulb/Shepherd/issues/704) | Q | waiting-for-executor | canon | 2026-09-21 | [claudinite-work] claudinite-lifecycle/update |
| [#703](https://github.com/missingbulb/Shepherd/issues/703) | Q | waiting-for-executor | canon | 2026-09-21 | [claudinite-work] claudinite-growth/growth-extract |
| [#702](https://github.com/missingbulb/Shepherd/issues/702) | Q | waiting-for-executor | canon | 2026-09-21 | [claudinite-work] claudinite-fleet-sheepdog/fleet-roster |
| [#700](https://github.com/missingbulb/Shepherd/issues/700) | Q | waiting-for-executor | canon | 2026-09-21 | [claudinite-work] claudinite-dashboard/publish-pages |
| [#699](https://github.com/missingbulb/Shepherd/issues/699) | Q | waiting-for-executor | canon | 2026-09-21 | [claudinite-work] basics/improve-comments |
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

## missingbulb/EdFringeNow — 19 open (4 queue / 15 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#796](https://github.com/missingbulb/EdFringeNow/issues/796) |  | unlabelled-backlog |  | 2026-09-20 | npm test warns MODULE_TYPELESS_PACKAGE_JSON on every import of a site/ ES module |
| [#794](https://github.com/missingbulb/EdFringeNow/issues/794) |  | unlabelled-backlog |  | 2026-09-20 | Encode the Jerusalem planner's language in the URL |
| [#792](https://github.com/missingbulb/EdFringeNow/issues/792) |  | unlabelled-backlog |  | 2026-09-20 | Shorten the UI golden lane: cases one at a time is 141s of waiting |
| [#791](https://github.com/missingbulb/EdFringeNow/issues/791) | Q | blocked | canon | 2026-09-20 | Verify in production: the UI lane actually skips rendering on an out-of-scope diff |
| [#790](https://github.com/missingbulb/EdFringeNow/issues/790) |  | unlabelled-backlog |  | 2026-09-20 | shared-tree-immutable blocks the install runner's own legitimate commits |
| [#726](https://github.com/missingbulb/EdFringeNow/issues/726) |  | unlabelled-backlog |  | 2026-09-16 | Executor routine's stored prompt still names the pre-rename queue/instructions.md path |
| [#695](https://github.com/missingbulb/EdFringeNow/issues/695) |  | unlabelled-backlog |  | 2026-09-13 | scrape.yml commits generated data with no retry on a rejected push |
| [#677](https://github.com/missingbulb/EdFringeNow/issues/677) |  | unlabelled-backlog |  | 2026-09-11 | sw/version-bumped and improve-comments-scope conflict when a comment fix touches a published file |
| [#615](https://github.com/missingbulb/EdFringeNow/issues/615) |  | unlabelled-backlog |  | 2026-09-16 | ui-requirements goldens flap: the same tree fails different cases run to run |
| [#610](https://github.com/missingbulb/EdFringeNow/issues/610) |  | unlabelled-backlog |  | 2026-09-04 | UX research services: what's available, what they cost, and a case for a claudinite pack |
| [#575](https://github.com/missingbulb/EdFringeNow/issues/575) | Q | park:action | canon | 2026-09-02 | Align local pack rules and skills to the writing-pack-prose references convention |
| [#532](https://github.com/missingbulb/EdFringeNow/issues/532) | Q | park:decision | canon | 2026-08-30 | [claudinite-work] claudinite-growth/growth-dedup |
| [#382](https://github.com/missingbulb/EdFringeNow/issues/382) | Q | park:approval | canon | 2026-09-20 | Add packs: suspected from this repo’s shape |
| [#314](https://github.com/missingbulb/EdFringeNow/issues/314) |  | unlabelled-backlog |  | 2026-08-09 | Replace per-file cache TTLs with a published manifest |
| [#295](https://github.com/missingbulb/EdFringeNow/issues/295) |  | needs-decision |  | 2026-09-07 | The site lists shows edfringe has withdrawn — nothing removes them from the master |
| [#294](https://github.com/missingbulb/EdFringeNow/issues/294) |  | needs-decision |  | 2026-09-07 | Prices exclude the booking fee edfringe advertises — and the recorded `fee` is wrong |
| [#237](https://github.com/missingbulb/EdFringeNow/issues/237) |  | unlabelled-backlog |  | 2026-08-17 | Upstream: baselining's deliver() leaves the scheduler checkout on its maintenance branch |
| [#164](https://github.com/missingbulb/EdFringeNow/issues/164) |  | quick-win |  | 2026-09-07 | Monetization: join Booking.com + Omio and paste the IDs into shared/affiliates.js |
| [#161](https://github.com/missingbulb/EdFringeNow/issues/161) |  | quick-win |  | 2026-09-07 | Monetization: join the 4 affiliate programmes and paste the IDs into js/places.js |

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

## missingbulb/VascularColoring — 16 open (9 queue / 7 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#476](https://github.com/missingbulb/VascularColoring/issues/476) | Q | waiting-for-executor | canon | 2026-09-21 | [claudinite-work] claudinite-tasks/usage-fold |
| [#474](https://github.com/missingbulb/VascularColoring/issues/474) | Q | waiting-for-executor | canon | 2026-09-21 | [claudinite-work] claudinite-tasks/task-janitor |
| [#473](https://github.com/missingbulb/VascularColoring/issues/473) | Q | running-agent | canon | 2026-09-21 | [claudinite-work] claudinite-lifecycle/update |
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

## missingbulb/ClaudiniteCanary — 7 open (4 queue / 3 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
| [#491](https://github.com/missingbulb/ClaudiniteCanary/issues/491) | Q | running-executor | canon | 2026-09-21 | [claudinite-work] claudinite-tasks/usage-fold |
| [#489](https://github.com/missingbulb/ClaudiniteCanary/issues/489) | Q | waiting-for-executor | canon | 2026-09-21 | [claudinite-work] claudinite-tasks/task-janitor |
| [#488](https://github.com/missingbulb/ClaudiniteCanary/issues/488) | Q | running-agent | canon | 2026-09-21 | [claudinite-work] claudinite-lifecycle/update |
| [#448](https://github.com/missingbulb/ClaudiniteCanary/issues/448) |  | unlabelled-backlog |  | 2026-09-16 | Repoint the executor routine's stored prompt at public/instructions.md |
| [#373](https://github.com/missingbulb/ClaudiniteCanary/issues/373) |  | unlabelled-backlog |  | 2026-09-07 | Issue #322 stuck: closed by its own PR's `Closes #N` before queue convergence, still wearing task:status:running-agent |
| [#283](https://github.com/missingbulb/ClaudiniteCanary/issues/283) | Q | park:approval | canon | 2026-08-30 | [claudinite-work] claudinite-growth/prose-to-checks-sweep |
| [#239](https://github.com/missingbulb/ClaudiniteCanary/issues/239) |  | unlabelled-backlog |  | 2026-08-23 | converge-item.mjs has no MCP-compatible agent-lane path — a session cannot perform queue instructions.md step 6 |

## missingbulb/NoRFinder — 7 open (0 queue / 7 plain)

| # | Q | State | Gen | Updated | Title |
|---|---|-------|-----|---------|-------|
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
