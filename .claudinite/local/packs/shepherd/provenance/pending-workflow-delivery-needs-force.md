## 2026-09-25 · born · converted from the delivering-re-staged rule (#697)
- **Reason:** the re-stage delivery step only fires once the destination workflow already exists, so
  a plain `git mv` always fails with `destination exists`.
- **Mechanism:** an action-scope guard on Bash, so the call is refused before it runs.
- **Retire when:** the delivery step stops requiring the destination to pre-exist.
- **Landed:** #697
