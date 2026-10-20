# The fleet's own packs

Each folder here is one pack this fleet publishes to its members and to no one else, laid out
as a pack on the shelf: a `pack.json` carrying `version` (MAJOR.YMMDD.BUILD) and
`minEngineVersion`, then its `RULES.md`, `skills/`, `checks/` and `tasks/`.
A change here is approved by merging it; the fleet-directory task then vendors each pack at a
version it has not published and signs it into the directory. A published version is never
rewritten, so a change raises the version.
