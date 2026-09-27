## 2026-09-13 · born · Read canon, not this repo's mount, when reporting what Claudinite declares (#557)
- **Source:** #556.
- **Reason:** a force-fleet report quoted this checkout's stale mount as the fleet's `automerge`
  policy; the fleet-sheepdog and lifecycle rules did not reach a file present in the mount and
  quoted as current.
- **Actor:** @missingbulb (owner).
- **Model:** Claude Opus 5, per the commit trailer.
- **Mechanism:** a RULES.md rule, triggered on "Reading the mount under .claudinite/shared/ to learn
  what Claudinite currently declares".
- **Landed:** #557 (Closes #556).

## 2026-09-27 · retired · covered by claudinite-lifecycle's own mount-vs-canon rule (#782)
- **Source:** growth-dedup run against mounted `claudinite-lifecycle` (in-window changed pack).
- **Reason:** `claudinite-lifecycle/RULES.md` — "Reporting or judging behavior against what a
  pack, task or the engine currently does ... read the canon repo's own `packs/<id>/` at its default
  branch, never this repo's mounted `.claudinite/shared/` ... Refreshing the mount costs nothing
  beyond the `git fetch` you'd need anyway." — makes the identical point this rule made in this
  repo's own names (the #556 incident was illustration, not a narrower case).
- **Actor:** growth-dedup task, unattended.
- **Model:** Claude Sonnet 5.
