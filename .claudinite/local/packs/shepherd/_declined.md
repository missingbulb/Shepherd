# Rules judged not checkable

## 2026-10-18 · writing-guardtoolcalls-match
Re-derived against the declared-checks vocabulary: a line scan of `declared-checks.json` cannot tell a
`guardToolCalls` `match` from a `matchLines` `match` (same key, same line shape), and the `tool`
that makes it a Bash guard sits on a different line. Any line rule either misses unanchored guards
or fires on world checks. Stays prose.

## 2026-10-18 · calling-converge-item
The violation is a flag on a command inside the session, visible only in the transcript beside the
fact that the session merged the PR itself; that is a work rule over the transcript, which needs a
coded module an unattended run should not ship unreviewed. Stays prose.

## 2026-10-18 · remaining rules
The other rules in `RULES.md` govern in-flight judgment or runtime knowledge and leave no static
signature (waiting on CI, subagent prompting, fleet-activity filtering, store declaration,
confirming a PR diff, fetching refs, parsing saved tool results, reading a settings key).
