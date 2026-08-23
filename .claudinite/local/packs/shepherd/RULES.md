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

- **Triaging a `fleet-drift` issue that names another repo** — don't spend a call on
  `mcp__github__get_file_contents` (or any other repo-scoped MCP read) against that repo: this
  session's GitHub access is scoped to `missingbulb/Shepherd` only, and every such repo-scoped
  call is denied outright. A tool that takes no repo argument — `search_code`, `search_issues` —
  is not scoped the same way and can still return results from other repos, so it isn't a safe
  substitute either; only the repo-scoped reads are guaranteed to refuse. Five separate triage
  subagents each independently spent a call rediscovering the repo-scoped denial before falling
  back to the only place the answer actually lives — the issue body's own self-description of how
  the item converges (#104).

- **Hunting for this repo's own standing tracker issue by its exact title** —
  `mcp__github__search_issues` with a quoted title and `in:title` does not reliably filter; it can
  return the same broad, unfiltered issue list regardless of the query text, burying the real
  tracker in a couple dozen unrelated hits (and once, overflowing the token cap entirely). Scan the
  returned list for the exact title yourself, or narrow with `minimal_output: true` plus a
  label/state filter, rather than trusting the query to do the narrowing (#104, #88).

- **Pushing a change that touches `.github/workflows/`, `.claudinite-checks.json`, or pack
  config** — run `node .claudinite/shared/engine/checks/check_the_world.mjs` locally first. It's
  the exact script the PR's `checks` CI job runs, and finding a `[BLOCKING]` finding live on the PR
  costs a full push-PR-CI-diagnose-fix-re-push round trip that one ~4-second local run skips
  (#106).

- **Dispatching concurrent subagents that each `git show` a file into the shared scratchpad** (the
  conversation-extract fan-out, or any similar parallel mining pattern) — give every dispatch a
  unique output filename. A shared generic name (`log.jsonl`) collides across concurrent downloads
  and silently hands one agent another agent's bytes; this exact contamination hit a prior
  growth-extract run in six or more of its own subagents (#73) and recurred in this run's own
  fan-out before being caught and re-fetched to a uniquely-named path.

- **Branching off this checkout's local `main`** — it does not track the live default branch, and
  has been observed pinned at the repo's very first commit. A plain `git checkout -b <name> main`
  silently branches from that frozen history and the next script that expects current content
  (e.g. a `.claudinite/` path) fails confusingly. Always `git fetch origin main` and branch from
  `origin/main` explicitly (#73).

- **Reaching step 6 of a work-item run** (`node .../scheduler/queue/converge-item.mjs`) — it will
  fail here: the script's read/write path (`signals/gh.mjs`) is documented in its own header as
  Action-side only ("everything session-side stays MCP-only"), and this session's `GITHUB_TOKEN` is
  a proxy placeholder the REST API rejects outright ("GitHub access is not enabled for this
  session"), confirmed across attempts with `GITHUB_REPOSITORY` set, with `NODE_USE_ENV_PROXY=1`,
  and via raw `curl`. Don't re-diagnose it — go straight to replicating the transition by hand
  over the GitHub MCP tools: the execution-record comment in `run-record.mjs`'s exact format
  (`claudinite-task-exec v1 <pack>/<task> [#<n>] <status>`), the `task:agent`→outcome label swap,
  the close with the matching `state_reason`, and (what `readyDependents` would have released) a
  check for any open item naming `Blocked-by: #<n>`. Four independent sessions in one day each lost
  2–5 minutes rediscovering this same dead end (#126, #130, #133, #166).
