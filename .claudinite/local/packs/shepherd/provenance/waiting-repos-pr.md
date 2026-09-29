## 2026-08-20 · born · Claudinite growth: extract lessons (#82)
- **Source:** captured conversations of #30, #32, #59, #60, #67.
- **Reason:** sessions slept, guessed a PR's status or grepped workflows while a 7-15 second check
  was one read away.
- **Actor:** growth-extract run, merged by @missingbulb (owner).
- **Model:** Claude, per the commit trailer.
- **Mechanism:** a RULES.md rule, triggered on "Waiting on this repo's PR CI".
- **Landed:** #82 (Refs #73).

## 2026-09-13 · reworded · Claudinite growth: dedup local packs (#586)
- **Reason:** the `enable_pr_auto_merge` "unstable status" clause was dropped as covered by canon's
  git-github-advanced ("An auto-merge refusal is not a verdict"); the repo's CI timing stays.
- **Actor:** growth-dedup run, merged by @missingbulb (owner).
- **Landed:** #586.

## 2026-09-29 · reworded · Claudinite growth: extract lessons (#825)
- **Source:** captured conversation of pr-821 (#821).
- **Reason:** the rule covered blind sleep/guessing but not subscribe-and-idle; that session's
  `subscribe_pr_activity` call landed around when CI finished (12s) and the event never woke it,
  costing ~10 minutes idle before a human prompt resumed it.
- **Actor:** growth-extract run, merged by @missingbulb (owner).
- **Model:** Claude, per the commit trailer.
- **Landed:** #825 (Refs #823).
