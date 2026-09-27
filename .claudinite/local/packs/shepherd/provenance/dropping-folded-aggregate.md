## 2026-08-18 · born · Claudinite growth: extract lessons (#39)
- **Source:** #23, #31.
- **Reason:** `usage-fleet.GENERATED.json` was left out of the Sheepdog carryover on the assumption
  the recompute would refill it, then copied over once the gap was caught.
- **Actor:** growth-extract run, merged by @missingbulb (owner).
- **Model:** Claude, per the commit trailer.
- **Mechanism:** a RULES.md rule, triggered on "Dropping a folded/aggregate GENERATED file because
  the next run recomputes it".
- **Landed:** #39 (Refs #9).

## 2026-09-27 · retired · covered by basics' generator-retirement rule (#782)
- **Source:** growth-dedup run against mounted `basics` (in-window changed pack).
- **Reason:** the same `basics/RULES.md` line as `carrying-artifact-directory` — "a stateless
  recompute over inputs kept for a bounded window starts the series shorter than the file it
  replaced" — states this rule's `usage-fleet.GENERATED.json` point too generally but fully.
- **Actor:** growth-dedup task, unattended.
- **Model:** Claude Sonnet 5.
