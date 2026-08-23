# Version history

The growth lifecycle's record for this pack: every rule a growth run adds, and every rule it
converts to a check, gets a row here in the same commit as the change. A run that changed nothing
writes no row — this is a log of what happened to the pack, never a log of runs.

| Date | Task | What landed |
|---|---|---|
| 2026-08-23 | growth-extract | Widened the tracker-hunt bullet: `list_issues`'s `query` param shares `search_issues`'s unreliability, and `minimal_output: true` alone doesn't bound an overflow — the label/state filter is load-bearing (#209, #210). Widened the `converge-item.mjs` bullet: a fifth session still ran the script itself before switching to the manual path, and the manual replication needs the `approval`-outcome shape spelled out separately from `done` (#202, #212). Added: shallow-clone checkouts can show a stale `origin/main` even after an explicit fetch by name, `--unshallow` is required (#197); `list_pull_requests`'s `head` filter needs an `owner:` qualifier or it silently mismatches (#213); never guess an unborn issue/PR's number inside a body being published (#24); don't manufacture a no-op Bash call while waiting on background tasks (#214); an overflowed `search_issues`/`search_code` result always parses as GitHub's `{total_count, incomplete_results, items}` envelope (#212). |
