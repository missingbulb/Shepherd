## 2026-08-21 · born · Claudinite growth: extract lessons from 2026-08-21 window (#120)
- **Source:** #73.
- **Reason:** a fresh checkout's local `main` was observed pinned at the repo's first commit while
  `origin/main` carried current history, and a branch cut from it failed confusingly once used.
- **Actor:** growth-extract run, merged by @missingbulb (owner).
- **Model:** Claude, per the commit trailer.
- **Mechanism:** a RULES.md rule, triggered on "Branching off this checkout's local main".
- **Landed:** #120 (Refs #117).

## 2026-09-13 · converted · Convert branching-from-local-main rule to a declared check (#588)
- **Reason:** a `git checkout -b`/`git branch` from bare `main` is a static Bash-command shape; the
  deletion test found the prose fully covered by the check's message and fix, so it was deleted
  whole.
- **Actor:** prose-to-checks run, merged by @missingbulb (owner).
- **Model:** Claude, per the commit trailer.
- **Mechanism:** an action-scope `guardToolCalls` check on Bash in the pack's
  `declared-checks.json`, blocking after a two-week `since` grace.
- **Retire when:** this sandbox's checkout keeps local `main` synced with `origin/main` by
  construction.
- **Landed:** #588 (Refs #575).
