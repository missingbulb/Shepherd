## 2026-09-21 · born · the file starts here; the rule predates this log
- **Reason:** a timer that re-reads a pull request wakes a session to learn nothing, repeatedly. Pull request events arrive on their own, so a session with nothing to act on should end rather than arrange to come back.
- **Actor:** @missingbulb (owner).
- **Mechanism:** prose in this pack's RULES.md.

## 2026-09-21 · reworded · the trigger now names the moment, not the instruction (#698)
- **Reason:** the rule opened with the directive, so a reader scanning the left margin could not tell which situation it was for. The guide keys a rule to the act the reader is performing; the directive and its strength are unchanged.
- **Actor:** @missingbulb (owner).
- **Landed:** missingbulb/Shepherd#698
