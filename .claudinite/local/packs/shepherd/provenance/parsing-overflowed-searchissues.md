## 2026-08-23 · born · Claudinite growth: extract lessons (#236)
- **Source:** #212.
- **Reason:** a session guessed the saved result's shape across several failed parses.
- **Actor:** growth-extract run, merged by @missingbulb (owner).
- **Model:** Claude, per the commit trailer.
- **Mechanism:** a RULES.md rule, triggered on "Parsing an overflowed search_issues/search_code
  result from its saved tool-results file".
- **Landed:** #236 (Refs #201).

## 2026-10-18 · retired · covered by git-github-advanced's search-overflow envelope line (#1069)
- **Reason:** the canon states "The spilled overflow file for a search call is GitHub's own response
  envelope - `{ total_count, incomplete_results, items: [...] }` - not a bare list. Index
  `['items']` on the first parse"; the local rule said nothing more.
- **Actor:** growth-dedup run (#1069).
- **Landed:** #1069
