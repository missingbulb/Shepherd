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

- **Waiting on this repo's PR CI** — it's a single `checks` job that completes in roughly 7–15
  seconds (measured directly across #30, #32, #59, #67). Poll `pull_request_read get_check_runs`
  in a short loop instead of a fixed or backgrounded `sleep`. Before stating a PR's status in a
  closing callout, read `get_check_runs` rather than asserting "CI running" as an unread guess
  (#30), and skip grepping `.github/workflows/*.yml` to guess whether a workflow gates the merge —
  the check runs already say so directly (#60). `subscribe_pr_activity` and then going idle isn't
  safe either at this cadence — a run can start and finish before the subscribe call lands, with
  no event left to wake on; poll `get_check_runs` a couple more times right after subscribing
  instead of trusting the event alone (#821: a 12s CI finish sat unnoticed for ~10 minutes).
  (waiting-repos-pr)

- **Fetching a stale `origin/main` in a fresh checkout** — `git fetch origin main` brings it
  current even in a shallow checkout (`git rev-parse --is-shallow-repository` → `true`) — re-tested
  live, a ref six days stale updated correctly with no `--unshallow`. Reach for `--unshallow` only
  if history, not the ref, still comes up short (#470). (fetching-stale-origin)

- **Writing a PR or issue body that cross-references an object you're about to create** — don't
  guess its number. Issue/PR numbers share one counter per repo, and the object you're creating
  consumes one too; a PR body written before its companion issue exists can end up citing the wrong
  number once the issue actually lands. Create the referenced object first, or leave a placeholder
  and patch the body once the number is known (#24). (writing-pr-issue)

- **Parsing an overflowed `search_issues`/`search_code` result from its saved `tool-results/*.txt`
  file** — the shape is always GitHub's own `{total_count, incomplete_results, items: [...]}`
  envelope. Index `['items']` on the first parse; don't iterate the dict directly or guess a bare
  list shape across several failed attempts (#212). (parsing-overflowed-searchissues)

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

- **Calling `converge-item.mjs` once this session already merged the PR itself** — omit `--pr`;
  passing it still writes "Waiting on a person: merge or close" onto the very comment that
  closes the item (#591, #596). (calling-converge-item)

- **Writing a `guardToolCalls` match pattern for a Bash action check** — anchor it to a
  command-start boundary (e.g. `(?:^|[;&|\n])\s*`); unanchored, it also fires when the pattern is
  merely quoted in an argument like a `--summary` string, not only when the command itself
  invokes it (#714). (writing-guardtoolcalls-match)
