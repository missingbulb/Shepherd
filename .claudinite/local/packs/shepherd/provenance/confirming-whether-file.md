## 2026-08-24 · born · Claudinite growth: extract lessons (#256)
- **Source:** #2.
- **Reason:** the web diff view dropped a root-level addition that was in the commit, costing a
  round trip and a false self-correction.
- **Actor:** growth-extract run, merged by @missingbulb (owner).
- **Model:** Claude, per the commit trailer.
- **Mechanism:** a RULES.md rule, triggered on "Confirming whether a file landed in a PR from Claude
  Code Web".
- **Landed:** #256 (Refs #246).
