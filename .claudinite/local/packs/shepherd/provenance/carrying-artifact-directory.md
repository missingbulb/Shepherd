## 2026-08-18 · born · Claudinite growth: extract lessons (#39)
- **Source:** #23, #27.
- **Reason:** the `digests/` output carried in #23 read as complete; the missing generator surfaced
  only in #27, checked separately.
- **Actor:** growth-extract run, merged by @missingbulb (owner).
- **Model:** Claude, per the commit trailer.
- **Mechanism:** a RULES.md rule, triggered on "Carrying an artifact directory over from a repo
  being retired".
- **Landed:** #39 (Refs #9).

## 2026-09-27 · retired · covered by basics' generator-retirement rule (#782)
- **Source:** growth-dedup run against mounted `basics` (in-window changed pack).
- **Reason:** `basics/RULES.md` — "Retiring a system by folding its function into another —
  audit that the live generator moved, not only its past output: a copied directory of old artifacts
  hides the generator's absence, and a stateless recompute over inputs kept for a bounded window
  starts the series shorter than the file it replaced." — states the same general point this rule
  made in Sheepdog→Shepherd-handoff dress; nothing here survives it.
- **Actor:** growth-dedup task, unattended.
- **Model:** Claude Sonnet 5.
