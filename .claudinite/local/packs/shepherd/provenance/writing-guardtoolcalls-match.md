## 2026-09-22 · born · Claudinite growth: extract lessons (#728)
- **Source:** #714.
- **Reason:** an authoring lesson for this pack's future action guards, not tied to one call site;
  `branch-from-local-main` carries the same unanchored shape.
- **Actor:** growth-extract run, merged by @missingbulb (owner).
- **Model:** Claude, per the commit trailer.
- **Mechanism:** a RULES.md rule, triggered on "Writing a guardToolCalls match pattern for a Bash
  action check".
- **Rejected:** a check that every Bash `guardToolCalls` match is anchored: the declared-checks
  vocabulary cannot select into that array shape, and a custom rule module is unreviewed logic an
  unattended run should not ship.
- **Landed:** #728 (Refs #718).
