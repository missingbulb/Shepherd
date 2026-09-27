## 2026-08-21 · born · Claudinite growth: extract lessons from 2026-08-21 window (#120)
- **Source:** #73.
- **Reason:** a shared scratchpad filename handed one subagent another's bytes in six or more
  subagents of a prior extract run, and again in this run's own fan-out.
- **Actor:** growth-extract run, merged by @missingbulb (owner).
- **Model:** Claude, per the commit trailer.
- **Mechanism:** a RULES.md rule, triggered on "Dispatching concurrent subagents that each git show
  a file into the shared scratchpad".
- **Landed:** #120 (Refs #117).

## 2026-09-27 · retired · covered by unattended-agents' collision-proof-filename rule (#782)
- **Source:** growth-dedup run against mounted `claudinite-growth` (in-window changed pack).
- **Reason:** `claudinite-growth/skills/unattended-agents/SKILL.md` — "Parallel background agents
  that each dump external content to disk need a collision-proof filename, not a shared generic one
  ... Give each agent's output a name that can't collide with its siblings'" — states the same
  rule this `git show`-into-scratchpad case illustrated, generically and with the same `log.jsonl`
  example.
- **Actor:** growth-dedup task, unattended.
- **Model:** Claude Sonnet 5.
