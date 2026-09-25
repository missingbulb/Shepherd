## 2026-09-25 · born · converted from the sending-email skill's "Adding a second sender" guideline (#697)
- **Reason:** an address in a public repo is a spam target, and which addresses can send or receive
  is a Cloudflare account setting, not a constant this tree asserts.
- **Mechanism:** a world-scope `matchLines` check over `.claudinite/local/**/*.mjs`, tests excluded.
- **Retire when:** a task needs a deliberately public address (a documented support alias, say).
- **Landed:** #697
