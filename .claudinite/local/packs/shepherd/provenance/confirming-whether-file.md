## 2026-08-24 · born · Claudinite growth: extract lessons (#256)
- **Source:** #2.
- **Reason:** the web diff view dropped a root-level addition that was in the commit, costing a
  round trip and a false self-correction.
- **Actor:** growth-extract run, merged by @missingbulb (owner).
- **Model:** Claude, per the commit trailer.
- **Mechanism:** a RULES.md rule, triggered on "Confirming whether a file landed in a PR from Claude
  Code Web".
- **Landed:** #256 (Refs #246).

## 2026-10-18 · retired · covered by git-github-advanced's rendered-diff line (#1069)
- **Reason:** the canon's "The rendered PR-diff view can silently omit a new file - confirm with
  git, not the UI" section says to confirm with `git ls-files` / `git diff --stat`; the local rule
  said nothing more.
- **Actor:** growth-dedup run (#1069).
- **Landed:** #1069
