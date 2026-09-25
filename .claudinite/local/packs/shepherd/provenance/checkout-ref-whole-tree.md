## 2026-09-21 · born · Claudinite growth: extract lessons (#713)
- **Source:** #704.
- **Reason:** `git checkout origin/main -- .` flipped 154 tracked files on the branch about to be
  pushed, recovered only by a hard reset.
- **Actor:** growth-extract run, merged by @missingbulb (owner).
- **Model:** Claude, per the commit trailer.
- **Mechanism:** an action-scope `guardToolCalls` check on Bash, blocking from 2026-09-21: the
  command shape is narrow and confident enough to check rather than spend prose on.
- **Landed:** #713 (Refs #703).

## 2026-09-21 · scope-changed · Fix checkout-ref-whole-tree: anchor the match, don't fire on prose (#714)
- **Source:** converging #703 tripped the check on a `--summary` argument quoting the command.
- **Reason:** a mention is not an invocation.
- **Actor:** growth-extract run, merged by @missingbulb (owner).
- **Model:** Claude, per the commit trailer.
- **Mechanism:** the match anchored at a command-start boundary.
- **Landed:** #714 (Refs #703).
