## 2026-09-24 · born · converted from references.md (sending-email-1), dated by the conversion: "Building the message object"
- **Reason:** Cloudflare's Email Service ships two APIs over one service, and the [recipients
  example](https://developers.cloudflare.com/email-service/examples/email-sending/recipients/) gives
  every case in both: the Workers binding takes `{ email, name }` and `replyTo`, the REST API takes
  `{ address, name }` and `reply_to`. The REST API answers a binding-shaped payload with `10001
  email.sending.error.invalid_request_schema` and nothing more specific.
- **Mechanism:** a step of the sending-email skill, a workflow
- **Retire when:** Retire the rule if Cloudflare converges the two spellings.

## 2026-09-24 · strengthened · converted from references.md (sending-email-2), dated by the conversion: "A send that reports every recipient in permanentbounces"
- **Reason:** The [platform limits
  page](https://developers.cloudflare.com/email-service/platform/limits/) states it directly:
  "Before you onboard a sending domain, you can send emails only to verified destination addresses
  in your account… You can only send from your routing domains." The send is *accepted* in that
  state and the recipient lands in `permanent_bounces`, so the failure reads as a delivery problem
  rather than as configuration.
- **Mechanism:** a step of the sending-email skill, a workflow
- **Retire when:** Retire the rule once a sending domain is onboarded on the account and every
  address is deliverable.

## 2026-09-24 · strengthened · converted from references.md (sending-email-3), dated by the conversion: "A park reading 10000 Authentication error"
- **Reason:** The handover that set the account up predicted an unscoped token would be refused with
  the Email Service's own `10102 email.sending.error.authentication.forbidden` (#503); the first
  send that actually reached Cloudflare with the account id and addresses in place came back `10000
  Authentication error` instead (#600), the generic gateway code, which carries no hint that sending
  scope is the subject.
- **Mechanism:** a step of the sending-email skill, a workflow
- **Retire when:** Retire the rule if Cloudflare ever routes an unscoped Email Service call to a
  product-specific code.

## 2026-09-25 · converted · "Adding a second sender to this repo" to the email-service-hardcoded-address check (#697)
- **Reason:** a literal address in `.claudinite/local/**/*.mjs` is a static signature; the guideline
  adds nothing the check's failure message doesn't.
- **Mechanism:** a world-scope `matchLines` check in the skill's `declared-checks.json`.
- **Actor:** prose-to-checks sweep (#685), merged by @missingbulb (owner).
- **Model:** claude-opus-5-5
- **Landed:** #697
