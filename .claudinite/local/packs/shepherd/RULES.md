# shepherd — this repo's own rules

The capture surface for lessons **specific to this repository**. Loaded into every session
through the rules index, so what lands here should be a directive an agent can act on, not a
description of how something works.

A lesson that would hold in another repo does not belong here — propose it to the Claudinite
canon instead, where every repo gets it.

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

- **Checking whether a `claudinite-lifecycle/update` PR should auto-merge or wait for review** —
  read the `delivery:` and `merges:` lines `cn work validate` prints and `.claudinite/settings.yaml`;
  `.claudinite-settings.json`, `repo-context.mjs` and the `dailyClaudiniteUpdatesRequirePrReview`,
  `"maintenance"` and `"delivery"` names are retired, so grepping for them wastes calls (#242, #248).
  (checking-whether-claudinite)

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

- **Calling `cn work converge` once this session already merged the PR itself** — omit `--pr`;
  passing it still writes "Waiting on a person: merge or close" onto the very comment that
  closes the item (#591, #596). (calling-converge-item)

- **Writing a `guardToolCalls` match pattern for a Bash action check** — anchor it to a
  command-start boundary (e.g. `(?:^|[;&|\n])\s*`); unanchored, it also fires when the pattern is
  merely quoted in an argument like a `--summary` string, not only when the command itself
  invokes it (#714). (writing-guardtoolcalls-match)
