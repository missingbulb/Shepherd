## 2026-09-21 · born · Claudinite growth: extract lessons (#713)
- **Source:** #573.
- **Reason:** the committing convention's closing keyword and `converge-item.mjs` both close the
  work item, so the PR's merge made the script refuse it; a structural conflict, not a one-off.
- **Actor:** growth-extract run, merged by @missingbulb (owner).
- **Model:** Claude, per the commit trailer.
- **Mechanism:** a RULES.md rule, triggered on "Writing a Claudinite task's own delivered PR".
- **Landed:** #713 (Refs #703).

## 2026-09-27 · retired · covered by claudinite-tasks' own instructions.md (#782)
- **Source:** growth-dedup run against mounted `claudinite-tasks` (in-window changed pack).
- **Reason:** `claudinite-tasks/public/instructions.md` — "Never give the PR body a closing
  keyword (`Closes #<n>`) naming this item's own issue. GitHub auto-closes it on merge regardless of
  the run's outcome, racing ahead of `converge-item.mjs`'s comment-and-label transition" — every
  session running a task already reads this exact instruction; the #573 incident was illustration,
  not a narrower case.
- **Actor:** growth-dedup task, unattended.
- **Model:** Claude Sonnet 5.
