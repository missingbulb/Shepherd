## 2026-08-18 · born · Claudinite growth: extract lessons (#39)
- **Source:** #23, #31.
- **Reason:** `usage-fleet.GENERATED.json` was left out of the Sheepdog carryover on the assumption
  the recompute would refill it, then copied over once the gap was caught.
- **Actor:** growth-extract run, merged by @missingbulb (owner).
- **Model:** Claude, per the commit trailer.
- **Mechanism:** a RULES.md rule, triggered on "Dropping a folded/aggregate GENERATED file because
  the next run recomputes it".
- **Landed:** #39 (Refs #9).
