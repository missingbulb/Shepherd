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
