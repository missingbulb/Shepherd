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
  servicing itself.

- **Carrying an artifact directory over from a repo being retired** (the Sheepdog → Shepherd
  fleet-enforcer handoff) — verify the *machinery that produces it* came over too, not just its
  historical output. `digests/`'s files landed in #23 and read as fully carried; the missing
  generator (Sheepdog's `sheepdog-local` pack and its `fleet-digest` task) surfaced only later, in
  #27, once checked separately from the output. A copied output folder visually launders the
  absence of its live producer — audit for the generator explicitly, in the same pass, rather than
  inferring it from the presence of past output.

- **Moving an artifact series between repos** — the same pass owes the *consumers* what the bullet
  above owes the producer, and the consumers are the harder half: a scheduled routine lives in the
  account rather than in either repo, so no check, grep or CI run here can see one still reading the
  old address. Enumerate them from the account (`list_triggers`) rather than from the tree. A reader
  left behind does not go quiet, which is what makes it expensive — it finds the retired repo's
  frozen directory, reads it correctly, and reports its last file as a stalled generator, so the
  failure arrives disguised as an alarm about healthy machinery and gets debugged from the wrong
  end. The digest reader stayed on Sheepdog for three days after #23 moved the series, and cost a
  session of generator forensics before anyone read the routine (#99). Budget for one more trap
  while there: a routine's source repo cannot be changed through the API, so repointing it is a
  human step in the UI and belongs in its own issue from the start.

- **Scheduling anything to read what another scheduled job writes** — anchor it to when the
  artifact *lands*, never to when the writer is *due*. A task's anchor only makes its work item
  ready; the tick that claims it, the agent that writes it and the merge that lands it are all
  downstream, and GitHub's own cron is late by minutes to an hour besides. The digest reader fired
  at 05:09Z against a 05:00Z anchor whose brief merged at 05:47Z (#99) — the two were nominally in
  order and never once in order in practice. Measure the real landing time from recent merges and
  leave hours of clearance, not minutes.

- **Dropping a folded/aggregate `GENERATED` file because "the next run recomputes it"** — check
  first whether the recompute's own *inputs* retain the same history the current output does. A
  stateless recompute over inputs each fleet member keeps only for a bounded window starts the
  series shorter than a file carried over from elsewhere already holds — nearly true of
  `usage-fleet.GENERATED.json`, first left out of the Sheepdog carryover (#23) on exactly that
  assumption, then copied over verbatim once the gap was caught (#31). "The generator will refill
  it" is not sufficient on its own; confirm the generator's inputs cover the same span first.

- **Scoping a fleet-wide text/reference sweep from this repo** — don't trust
  `mcp__github__search_code` alone to enumerate the affected member repos; its index can lag and
  silently undercount. Cross-check against the full known member roster (fetch each member's
  `.claudinite-checks.json` directly) before scoping the sweep: a Sheepdog-reference sweep found
  only 3 repos via search but 11 by direct check (#24).

- **Renaming, adding, or removing a pack in `.claudinite-checks.json`** — re-run
  `node .claudinite/shared/engine/scheduler/converge-wiring.mjs missingbulb/Shepherd --badges` in
  the same change. The README's `<!-- claudinite:packs -->` badge row is a one-time seed the
  update flow deliberately never re-derives, so it silently goes stale on every declaration
  change and only resurfaces later as a blocking `reference-integrity` finding — this exact gap
  hit twice, once for the `core`/`grow_with_claudinite` rename (#67, fixed in #69) and again for
  the `sheepdog` → `claudinite-fleet-sheepdog` rename (#79, fixed in #80/#81).

- **Waiting on this repo's PR CI** — it's a single `checks` job that completes in roughly 7–15
  seconds (measured directly across #30, #32, #59, #67). Poll `pull_request_read get_check_runs`
  in a short loop instead of a fixed or backgrounded `sleep`, and don't call
  `enable_pr_auto_merge` in the same breath as opening the PR — GitHub refuses it with "unstable
  status" if the check hasn't started yet, which is a sign to wait and re-poll, not license to
  merge by hand instead (#59). Before stating a PR's status in a closing callout, read
  `get_check_runs` rather than asserting "CI running" as an unread guess (#30), and skip grepping
  `.github/workflows/*.yml` to guess whether a workflow gates the merge — the check runs already
  say so directly (#60).

- **Firing an `AskUserQuestion`** — check first whether the answer is already decided: by a rule
  already loaded in context, by fleet or repo state one read away (a sibling's
  `.claudinite-checks.json`, a pending adoption interview), or by the option marked
  "(Recommended)" simply being the status quo. Batch every open decision a run will need into one
  question instead of asking serially. Four sessions lost 17 to 105 minutes of pure
  human-round-trip idle time to questions whose answer was already available or was the presented
  default (#2, #22, #28, #32).

- **Leaving multiple PRs open for the owner after a fleet-wide sweep** — call
  `subscribe_pr_activity` on every one of them, not a sample. #24's sweep subscribed only 2 of 12
  open PRs, then spent over two hours and ~29 API calls re-polling the other 10 on a self-armed
  hourly wake-up with zero state change, while the 2 subscribed PRs' merges arrived instantly as
  activity events the moment the owner acted.
