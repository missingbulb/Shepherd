## 2026-09-22 · born · converted from references.md (check:branch-from-local-main), dated by the conversion
- **Reason:** This checkout's `origin/main` and local `main` can diverge: a fresh checkout's local
  `main` has been observed pinned at the repo's very first commit while `origin/main` carries
  current history, and a `git checkout -b <name> main` branching from the stale local ref fails
  confusingly once the branch is used (a script expecting current `.claudinite/` content finds none)
  (#73).
- **Mechanism:** a check
- **Retire when:** Retire it if this sandbox's checkout ever keeps local `main` synced with
  `origin/main` by construction.
