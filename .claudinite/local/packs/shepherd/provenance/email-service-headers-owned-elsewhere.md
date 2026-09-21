## 2026-09-21 · born · converted from references.md (check:email-service-headers-owned-elsewhere), dated by the conversion
- **Reason:** The [headers
  reference](https://developers.cloudflare.com/email-service/reference/headers/) is allowlist-based
  and says so: "Email Service rejects the entire send request if it contains a disallowed header. It
  does not remove the header and continue sending the message." A platform-controlled header returns
  `E_HEADER_NOT_ALLOWED` and a first-class one `E_HEADER_USE_API_FIELD`.
- **Mechanism:** a check
- **Retire when:** Retire it if the service ever starts stripping rather than refusing.
