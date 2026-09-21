# shepherd — this repo's own rules

The capture surface for lessons **specific to this repository**. Loaded into every session
through the rules index, so what lands here should be a directive an agent can act on, not a
description of how something works.

A lesson that would hold in another repo does not belong here — propose it to the Claudinite
canon instead, where every repo gets it.

- **Reading this fleet's activity to rank or report it** — filter Claudinite's own artifacts out
  of **every** stream you collect, not just the first one you thought of. The machine is the
  busiest actor in this fleet, and its bookkeeping does not merely appear in a size-or-discussion
  ranking, it wins it: a dispatch issue collects a comment per executor stage, so it outweighs the
  work it dispatched, and a guard written for pull requests while issues go through unfiltered
  leaves the whole hole open. Recognize a machine artifact with the engine's own `isDispatchTitle`
  rather than a private regex, since the dispatch-title format is the scheduler's to change. Count
  the maintenance total where it is **tallied**, never by dropping items in the fetch: an issue the
  machinery filed and closed is still a true account of how much of the day this fleet spent
  servicing itself. (reading-fleets-activity)

- **Carrying an artifact directory over from a repo being retired** (the Sheepdog → Shepherd
  fleet-enforcer handoff) — verify the *machinery that produces it* came over too, not just its
  historical output. `digests/`'s files landed in #23 and read as fully carried; the missing
  generator (Sheepdog's `sheepdog-local` pack and its `fleet-digest` task) surfaced only later, in
  #27, once checked separately from the output. A copied output folder visually launders the
  absence of its live producer — audit for the generator explicitly, in the same pass, rather than
  inferring it from the presence of past output. (carrying-artifact-directory)

- **Dropping a folded/aggregate `GENERATED` file because "the next run recomputes it"** — check
  first whether the recompute's own *inputs* retain the same history the current output does. A
  stateless recompute over inputs each fleet member keeps only for a bounded window starts the
  series shorter than a file carried over from elsewhere already holds — nearly true of
  `usage-fleet.GENERATED.json`, first left out of the Sheepdog carryover (#23) on exactly that
  assumption, then copied over verbatim once the gap was caught (#31). "The generator will refill
  it" is not sufficient on its own; confirm the generator's inputs cover the same span first.
  (dropping-folded-aggregate)

- **Waiting on this repo's PR CI** — it's a single `checks` job that completes in roughly 7–15
  seconds (measured directly across #30, #32, #59, #67). Poll `pull_request_read get_check_runs`
  in a short loop instead of a fixed or backgrounded `sleep`. Before stating a PR's status in a
  closing callout, read `get_check_runs` rather than asserting "CI running" as an unread guess
  (#30), and skip grepping `.github/workflows/*.yml` to guess whether a workflow gates the merge —
  the check runs already say so directly (#60). (waiting-repos-pr)

- **Dispatching concurrent subagents that each `git show` a file into the shared scratchpad** (the
  conversation-extract fan-out, or any similar parallel mining pattern) — give every dispatch a
  unique output filename. A shared generic name (`log.jsonl`) collides across concurrent downloads
  and silently hands one agent another agent's bytes; this exact contamination hit a prior
  growth-extract run in six or more of its own subagents (#73) and recurred in this run's own
  fan-out before being caught and re-fetched to a uniquely-named path.
  (dispatching-concurrent-subagents)

- **Fetching a stale `origin/main` in a fresh checkout** — `git fetch origin main` brings it
  current even in a shallow checkout (`git rev-parse --is-shallow-repository` → `true`) — re-tested
  live, a ref six days stale updated correctly with no `--unshallow`. Reach for `--unshallow` only
  if history, not the ref, still comes up short (#470). (fetching-stale-origin)

- **Reading the mount under `.claudinite/shared/` to learn what Claudinite currently declares** —
  a task's `automerge`, a pack's version, any behaviour you are about to report or judge a member
  against — read the canon repo's own `packs/<id>/` at `main` instead. The mount is a snapshot at
  *this* repo's declared version, so it answers what this member runs, never what canon says, and
  the two diverge precisely when something is behind, which is the moment a force-fleet run exists
  to investigate. A fleet report quoted this checkout's stale `update` task (`automerge:
  "anything"`, lifecycle 60907.2) as the fleet's policy while all 14 members already ran 60911.1's
  granular list including `test-changes`; the same `git fetch origin main` that refreshes the ref
  refreshes the mount with it (#556). (reading-mount-claudinite)

- **Writing a PR or issue body that cross-references an object you're about to create** — don't
  guess its number. Issue/PR numbers share one counter per repo, and the object you're creating
  consumes one too; a PR body written before its companion issue exists can end up citing the wrong
  number once the issue actually lands. Create the referenced object first, or leave a placeholder
  and patch the body once the number is known (#24). (writing-pr-issue)

- **Parsing an overflowed `search_issues`/`search_code` result from its saved `tool-results/*.txt`
  file** — the shape is always GitHub's own `{total_count, incomplete_results, items: [...]}`
  envelope. Index `['items']` on the first parse; don't iterate the dict directly or guess a bare
  list shape across several failed attempts (#212). (parsing-overflowed-searchissues)

- **Delivering a re-staged file from `.claudinite/pending-workflows/` during the
  `claudinite-lifecycle/update` task** — go straight to `cp -f <src> <dst> && rm <src>` (or
  `git mv -f`), never a plain `git mv`: this delivery step only fires when the destination workflow
  file already exists (a first-time vendor commits directly instead), so a plain `git mv` always
  fails with `destination exists`. Hit identically in two independent sessions (#233, #248).
  (delivering-re-staged)

- **Checking whether a `claudinite-lifecycle/update` PR should auto-merge or wait for review** —
  grep `.claudinite-settings.json` directly for `dailyClaudiniteUpdatesRequirePrReview`
  (documented in `.claudinite/shared/engine/checks/helpers/repo-context.mjs`); its absence means
  auto-merge. Don't guess `"maintenance"` or `"delivery"` as the key name — the task's own
  instructions still name that retired key, which no longer exists in the schema, and two
  independent sessions burned tool calls chasing it (#242, #248). (checking-whether-claudinite)

- **Confirming whether a file landed in a PR from Claude Code Web** — verify with
  `git ls-files`/`git diff --stat` against the branch, never a rendered PR-diff view: the web diff
  view has been observed to silently drop new root-level file/directory additions from its
  rendering while the file was genuinely present in the commit, costing a round-trip and a false
  self-correction before the git-based check settled it (#2). (confirming-whether-file)

- **Prompting a background subagent that needs a growing reference file's content** — point it at
  the file's *path* to read itself rather than pasting the content inline: cheaper, and immune to
  the class of bug where the paste is left as an unfilled placeholder. A flawed `<existing-rules>`
  placeholder, caught 8 seconds after dispatch, cost ~172s and ~95K tokens of pure duplicate
  compute once corrected (#246). (prompting-background-subagent)

- **Declaring this repo as the store for a role a retiring predecessor already filled** (a
  preferences store, or any other adopted-role declaration) — copy the predecessor's actual
  content in the same change, since the session's own hook diagnostic reporting the gap ("no
  preferences file for this user") sat unactioned in this session's own tool output for over 20
  minutes before the owner had to point out the missing directory (#2). (declaring-repo-store)
