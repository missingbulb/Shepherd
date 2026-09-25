## 2026-08-17 · born · Adopt Claudinite (#1)
- **Reason:** seeded empty at adoption as the capture surface for lessons true of this repo alone; a
  lesson that would hold elsewhere goes to a canon pack instead.
- **Actor:** @missingbulb (owner).
- **Mechanism:** the pack manifest, prose in RULES.md, no fingerprint (`detect: null`) since the
  pack is this repo's own.
- **Landed:** #1 · pack version 1.

## 2026-08-30 · scope-changed · worldRules discovered structurally (#347)
- **Reason:** the pack gained its first coded rule; listing `worldRules` in the manifest would make
  every new rule module touch it too.
- **Actor:** prose-to-checks run, merged by @missingbulb (owner).
- **Model:** Claude, per the commit trailer.
- **Mechanism:** worldRules discovered from `worldRules/*.mjs`, left unspoken in the manifest.
- **Landed:** #347 (Refs #332).
