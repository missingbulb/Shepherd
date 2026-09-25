## 2026-09-08 · born · Mail three fleet repos every morning (#504)
- **Reason:** the client encodes ceilings and an allowlist read off four documentation pages; a
  second caller with its own `fetch` re-encodes none of them, and the service refuses the whole
  message on a violation.
- **Actor:** @missingbulb (owner).
- **Model:** Claude Opus 5, per the commit trailer.
- **Mechanism:** a declared check in the sending-email skill's `declared-checks.json`, firing
  repo-wide at Stop and in CI on a hand-rolled request to the endpoint.
- **Rejected:** force-load paths on the sending-email skill: no path predicts someone adding a
  second sender anywhere in the tree.
- **Retire when:** the send moves behind a library that carries the same validation.
- **Landed:** #504 (Refs #502).
