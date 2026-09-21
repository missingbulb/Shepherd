## 2026-09-21 · born · converted from references.md (check:email-service-single-client), dated by the conversion
- **Reason:** The client encodes ceilings and an allowlist read off four documentation pages at
  once; a second caller with its own `fetch` re-encodes none of them and the service answers a
  violation by refusing the whole message.
- **Mechanism:** a check
- **Retire when:** Retire it if the send ever moves behind a library that carries the same
  validation.
