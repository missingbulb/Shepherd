## 2026-09-08 · born · Mail three fleet repos every morning (#504)
- **Source:** Cloudflare's [headers
  reference](https://developers.cloudflare.com/email-service/reference/headers/).
- **Reason:** the service is allowlist-based and rejects the whole send on a disallowed header
  (`E_HEADER_NOT_ALLOWED`, or `E_HEADER_USE_API_FIELD` for a first-class one) rather than stripping
  it.
- **Actor:** @missingbulb (owner).
- **Model:** Claude Opus 5, per the commit trailer.
- **Mechanism:** a declared check in the sending-email skill's `declared-checks.json`.
- **Retire when:** the service starts stripping rather than refusing.
- **Landed:** #504 (Refs #502).
