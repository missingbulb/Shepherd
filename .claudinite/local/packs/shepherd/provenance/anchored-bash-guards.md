## 2026-10-04 · born · Convert anchored Bash guard patterns to a world rule (#880)
- **Source:** #714.
- **Reason:** anchoring is a static property of each declaration; the earlier rejection (declared
  vocabulary cannot select into the guards array) is met by a coded world rule reviewed in this PR,
  and its one violator, `branch-from-local-main`, is anchored in the same change.
- **Actor:** prose-to-checks run (#880).
- **Model:** Claude, per the commit trailer.
- **Mechanism:** a coded world rule in `worldRules/`, blocking after a two-week `since` grace. The
  fixture fires on an unanchored match and stays quiet on an anchored one and non-Bash guards.
