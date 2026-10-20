## 2026-09-21 · born · Claudinite growth: extract lessons (#713)
- **Source:** #591, #596.
- **Reason:** two sessions passed `--pr` after merging their own PR; both caught the wrong closing
  line before posting.
- **Actor:** growth-extract run, merged by @missingbulb (owner).
- **Model:** Claude, per the commit trailer.
- **Mechanism:** a RULES.md rule, triggered on "Calling converge-item.mjs once this session already
  merged the PR itself".
- **Landed:** #713 (Refs #703).

## 2026-10-14 · reworded · Claudinite growth: rule revalidation (#1017)
- **Reason:** revalidation found `converge-item.mjs` replaced by `cn work converge`; probed
  `--outcome done` with and without `--pr` and the "Waiting on a person: merge or close" line still
  appears only with `--pr`, so the behavior holds under the new name.
- **Actor:** rule-revalidation run (#1017).
