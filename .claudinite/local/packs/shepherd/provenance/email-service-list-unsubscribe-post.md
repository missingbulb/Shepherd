## 2026-09-08 · born · Mail three fleet repos every morning (#504)
- **Source:** Cloudflare's headers reference; RFC 8058.
- **Reason:** any value other than `List-Unsubscribe=One-Click` is `E_HEADER_VALUE_INVALID` and
  fails the whole send; the value is a constant, so a literal comparison holds it.
- **Actor:** @missingbulb (owner).
- **Model:** Claude Opus 5, per the commit trailer.
- **Mechanism:** a declared check in the sending-email skill's `declared-checks.json`.
- **Landed:** #504 (Refs #502).
