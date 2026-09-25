## 2026-08-23 · born · Claudinite growth: extract lessons (#236)
- **Source:** #197.
- **Reason:** `origin/main` read frozen at the initial commit after a fetch by name, producing a
  bogus wall-to-wall diff.
- **Actor:** growth-extract run, merged by @missingbulb (owner).
- **Model:** Claude, per the commit trailer.
- **Mechanism:** a RULES.md rule, triggered on "Comparing against origin/main in a fresh checkout".
- **Landed:** #236 (Refs #201).

## 2026-09-07 · reworded · Claudinite growth: rule revalidation (#479)
- **Source:** #470.
- **Reason:** re-probed live, a plain `git fetch origin main` updated a six-day-stale ref in a
  shallow checkout, so the claim that `--unshallow` was needed did not reproduce.
- **Actor:** rule-revalidation run, merged by @missingbulb (owner).
- **Landed:** #479 (Refs #470).

## 2026-09-20 · reworded · Claudinite growth: dedup local packs (#696)
- **Reason:** the general stale-ref point is now canon's git-github-advanced; stripped to the
  residue canon does not make, that a plain fetch suffices even when shallow.
- **Actor:** growth-dedup run, merged by @missingbulb (owner).
- **Landed:** #696 (Refs #683).
