## 2026-09-21 · born · converted from references.md (check:email-service-list-unsubscribe-post), dated by the conversion
- **Reason:** Same page: `List-Unsubscribe-Post` "must be exactly `List-Unsubscribe=One-Click`
  (case-sensitive)", and anything else is `E_HEADER_VALUE_INVALID` — which, per the paragraph
  above, fails the whole send. The value is a constant from RFC 8058, so the check can compare
  against it literally.
- **Mechanism:** a check
