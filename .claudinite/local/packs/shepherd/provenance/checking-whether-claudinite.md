## 2026-08-24 · born · Claudinite growth: extract lessons (#256)
- **Source:** #242, #248.
- **Reason:** the update task's own text still names the retired key, and two sessions chased it.
- **Actor:** growth-extract run, merged by @missingbulb (owner).
- **Model:** Claude, per the commit trailer.
- **Mechanism:** a RULES.md rule, triggered on "Checking whether a claudinite-lifecycle/update PR
  should auto-merge or wait for review".
- **Landed:** #256 (Refs #246).

## 2026-10-14 · reworded · Claudinite growth: rule revalidation (#1017)
- **Reason:** revalidation found the engine moved to `cn`: `.claudinite-settings.json` and
  `repo-context.mjs` no longer exist and the key is absent from `.claudinite/settings.yaml`, so the
  rule's grep pointed at nothing.
- **Actor:** rule-revalidation run (#1017).
