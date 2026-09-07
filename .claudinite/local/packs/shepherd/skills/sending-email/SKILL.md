---
name: sending-email
description: Sending mail from this repo over the Cloudflare Email Service — the one client every sender goes through, the REST field spellings, and what the account must already be set up for. Use when writing or changing code that sends an email, and when a send fails or a park says the Email Service refused one.
metadata:
  force-load-on-file-edits-paths:
    - "**/packs/*/skills/sending-email/**"
    - "**/tasks/*email*/**"
---

# Sending email

Sends go over the [Cloudflare Email Service REST API](https://developers.cloudflare.com/email-service/api/send-emails/rest-api/),
authenticated by the `CLOUDFLARE_API_TOKEN` repo secret against the `CLOUDFLARE_ACCOUNT_ID`
repo variable. There is no SMTP path here and no Workers binding: this repo has no Worker in
the sending path, and the REST endpoint is the one a task's code-work can call directly.

- **Sending anything** — call `sendEmail` from [`send.mjs`](send.mjs), never `fetch` the
  endpoint yourself. It carries the request shape, every documented ceiling, the header
  allowlist and the error-code routing, and a second caller would carry none of them:

  ```js
  import { sendEmail, EmailSendError } from '<path to>/skills/sending-email/send.mjs';
  const result = await sendEmail({ accountId, token, message: { from, to, subject, html, text } });
  ```

- **Building the message object** — it is the **REST** shape, which differs from the Workers
  binding's in exactly the two places every example gets wrong: a named address is
  `{ address, name }` and not `{ email, name }`, and the reply address is `reply_to` and not
  `replyTo`. Copying a `env.EMAIL.send()` snippet out of the docs brings both. (1)

- **Setting a header** — only the Email Service's
  [allowlist](https://developers.cloudflare.com/email-service/reference/headers/) and `X-`
  headers are accepted, and one disallowed header rejects the **whole message** rather than
  being dropped. `From`, `To`, `Cc`, `Bcc`, `Subject` and `Reply-To` are API fields, not
  headers. `validateMessage` holds the current list; extend it there rather than at a call site.

- **Writing the body** — send `text` alongside `html`, never HTML alone: a client with HTML off
  shows nothing, and a missing plain part is one of the signals that grades a sender as bulk.

- **Catching a failure** — `sendEmail` throws `EmailSendError` with `needsAction` set when the
  cause is a person's to fix (the token's permission, the account's entitlement, a zone with
  sending off, a recipient that is not yet a verified destination address). In a task worker
  that is the difference between a `claudinite-needs-human: action` park and a `failure` one,
  so route the park off the flag rather than off the message text.

- **A send that reports every recipient in `permanent_bounces`** — the request was accepted and
  delivered to nobody. Until a sending domain is onboarded, the account can send **only** to
  the verified destination addresses in its Email Routing configuration, and only *from* a
  routing domain; an ordinary address bounces exactly this way. Check the destination is
  verified before suspecting the message. (2)

- **Adding a second sender to this repo** — take the from and to addresses from repo
  *variables* rather than writing them into the tree: an address in a public repo is a spam
  target, and which addresses are sendable is settled in Cloudflare rather than here.
