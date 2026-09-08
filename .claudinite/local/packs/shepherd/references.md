# shepherd — why the pack's rules and checks say what they say

Maintenance and review only. No rule sends a reader here and no session loads it; the periodic
pass that asks whether a rule still earns its place reads it, from the reason and the minimum
evidence needed to re-test the rule. Entry numbers are stable identifiers within the citing
file's own namespace — a removed entry leaves a gap, and nothing is ever renumbered.

## sending-email

- **(sending-email-1)** Cloudflare's Email Service ships two APIs over one service, and the
  [recipients example](https://developers.cloudflare.com/email-service/examples/email-sending/recipients/)
  gives every case in both: the Workers binding takes `{ email, name }` and `replyTo`, the REST
  API takes `{ address, name }` and `reply_to`. The REST API answers a binding-shaped payload
  with `10001 email.sending.error.invalid_request_schema` and nothing more specific. Retire the
  rule if Cloudflare converges the two spellings.

- **(sending-email-2)** The [platform limits page](https://developers.cloudflare.com/email-service/platform/limits/)
  states it directly: "Before you onboard a sending domain, you can send emails only to verified
  destination addresses in your account… You can only send from your routing domains." The send
  is *accepted* in that state and the recipient lands in `permanent_bounces`, so the failure
  reads as a delivery problem rather than as configuration. Retire the rule once a sending
  domain is onboarded on the account and every address is deliverable.

## Checks

- **(check:email-service-single-client)** The client encodes ceilings and an allowlist read off
  four documentation pages at once; a second caller with its own `fetch` re-encodes none of them
  and the service answers a violation by refusing the whole message. Retire it if the send ever
  moves behind a library that carries the same validation.

- **(check:email-service-rest-field-spellings)** The same evidence as `sending-email-1`: the
  check is the half of that rule a scan can hold, catching the binding's spellings where the
  rule can only warn about them. Retire it with the rule.

- **(check:email-service-headers-owned-elsewhere)** The
  [headers reference](https://developers.cloudflare.com/email-service/reference/headers/) is
  allowlist-based and says so: "Email Service rejects the entire send request if it contains a
  disallowed header. It does not remove the header and continue sending the message." A
  platform-controlled header returns `E_HEADER_NOT_ALLOWED` and a first-class one
  `E_HEADER_USE_API_FIELD`. Retire it if the service ever starts stripping rather than refusing.

- **(check:email-service-list-unsubscribe-post)** Same page: `List-Unsubscribe-Post` "must be
  exactly `List-Unsubscribe=One-Click` (case-sensitive)", and anything else is
  `E_HEADER_VALUE_INVALID` — which, per the paragraph above, fails the whole send. The value is
  a constant from RFC 8058, so the check can compare against it literally.
