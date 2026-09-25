## 2026-09-21 · born · Claudinite growth: extract lessons (#713)
- **Source:** #591, #596.
- **Reason:** two sessions passed `--pr` after merging their own PR; both caught the wrong closing
  line before posting.
- **Actor:** growth-extract run, merged by @missingbulb (owner).
- **Model:** Claude, per the commit trailer.
- **Mechanism:** a RULES.md rule, triggered on "Calling converge-item.mjs once this session already
  merged the PR itself".
- **Landed:** #713 (Refs #703).
