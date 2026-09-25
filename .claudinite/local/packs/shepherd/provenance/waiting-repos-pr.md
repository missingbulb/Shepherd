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
