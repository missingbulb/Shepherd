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
