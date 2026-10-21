## 2026-08-17 · born · Record the fleet-activity filter rule in this repo's local pack (#29)
- **Source:** the fleet-digest promotion, missingbulb/Claudinite#954.
- **Reason:** the machine's own artifacts win any size-or-discussion ranking of this fleet, and a
  guard covering pull requests while issues went unfiltered is the failure it prevents.
- **Actor:** @missingbulb (owner).
- **Model:** Claude Opus 5, per the commit trailer.
- **Mechanism:** a RULES.md rule, triggered on "Reading this fleet's activity to rank or report it".
- **Rejected:** the canon sheepdog pack's RULES.md, where it was first written: enforcer sessions
  read it but cannot edit the sweeps it governs, and canon does not declare that pack.
- **Landed:** #29 (Fixes #28).

## 2026-10-21 · retired · moved the reading-fleets-activity rule into the engine's fleet pack (Engine #416)
- **Reason:** it holds for any fleet manager, not this repo alone, so every manager now receives
  it from the engine instead of from this local pack.
- **Actor:** @missingbulb (owner), who chose the engine's built-in fleet pack.
- **Mechanism:** a rule in the fleet pack's `RULES.md`.
- **Landed:** Engine #416, released in 1.61021.3.
