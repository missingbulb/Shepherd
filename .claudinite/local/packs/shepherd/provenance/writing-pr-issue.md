## 2026-08-23 · born · Claudinite growth: extract lessons (#236)
- **Source:** #24; #29's first commit said `Fixes #24` for what became #28.
- **Reason:** a number written before its object existed pointed at the wrong one.
- **Actor:** growth-extract run, merged by @missingbulb (owner).
- **Model:** Claude, per the commit trailer.
- **Mechanism:** a RULES.md rule, triggered on "Writing a PR or issue body that cross-references an
  object you're about to create".
- **Landed:** #236 (Refs #201).

## 2026-10-11 · retired · Claudinite growth: dedup local packs (#973)
- **Reason:** superseded by the git-github canon skill git-github-advanced, which states the same
  rule: "Issue and PR numbers share one counter per repo, so a comment or PR body written before its
  companion object is filed ... can end up citing the wrong number ... File or create the referenced
  object first ... or leave an explicit placeholder and patch it once the number is known."
- **Actor:** growth-dedup run (#973).
- **Landed:** Refs #973.
