## 2026-08-21 · born · Claudinite growth: extract lessons from 2026-08-21 window (#120)
- **Source:** #73.
- **Reason:** a shared scratchpad filename handed one subagent another's bytes in six or more
  subagents of a prior extract run, and again in this run's own fan-out.
- **Actor:** growth-extract run, merged by @missingbulb (owner).
- **Model:** Claude, per the commit trailer.
- **Mechanism:** a RULES.md rule, triggered on "Dispatching concurrent subagents that each git show
  a file into the shared scratchpad".
- **Landed:** #120 (Refs #117).
