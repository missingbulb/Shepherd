## 2026-08-24 · born · extracted after the same failure hit two sessions (#233, #248)
- **Mechanism:** a rule in the shepherd pack's RULES.md
- **Landed:** #256

## 2026-09-25 · retired · converted to the pending-workflow-delivery-needs-force guard (#697)
- **Reason:** prose alone let it recur; the plain `git mv` is a statically recognisable call, and
  the guard's message and fix carry everything the rule said (deletion test passed).
- **Actor:** prose-to-checks sweep (#685), merged by @missingbulb (owner).
- **Model:** claude-opus-5-5
- **Landed:** #697
