## 2026-09-08 · born · Mail three fleet repos every morning (#504)
- **Source:** Cloudflare's [recipients
  example](https://developers.cloudflare.com/email-service/examples/email-sending/recipients/).
- **Reason:** the half of the sending-email skill's REST-versus-binding step a scan can hold,
  catching the binding's spellings where the step can only warn.
- **Actor:** @missingbulb (owner).
- **Model:** Claude Opus 5, per the commit trailer.
- **Mechanism:** a declared check in the sending-email skill's `declared-checks.json`.
- **Retire when:** Cloudflare converges the two spellings, with the step.
- **Landed:** #504 (Refs #502).
