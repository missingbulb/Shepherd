# Fleet operations briefs

One file per UTC day, `YYYY-MM-DD.md`: what the fleet actually accomplished that day,
and one project worth returning to. Written each morning by the `fleet-digest` task in
this repo's own local pack.

**The dated series is the point.** A brief exists for every day the fleet has been
running, including the days nothing happened — a quiet day says so in one line. That is
what makes a *missing* file legible as a fault rather than as a slow Tuesday.

## How a day becomes a brief

1. **Prework** (code, 05:00 UTC) enumerates every active member, collects the pull
   requests merged and issues closed during the previous UTC day, drops the Claudinite
   maintenance PRs that land in every member nightly, ranks what is left **by size of
   change**, and keeps a shortlist half again longer than the brief needs.
2. **The agent** reads only that shortlist and picks the strongest few — new projects
   first, then biggest improvements, then most complex work — at 20 words apiece. Size
   gets an item onto the shortlist; judgment gets it into the brief.

The task ends there, at a landed file. On a day with nothing to rank, step 2 is skipped
entirely and prework writes the brief itself — there is no judgment in "nothing
happened", and no reason to pay a model for it.

## Backfilling

To catch up after an outage, or to seed the series when it starts: run the
**Claudinite scheduler** workflow manually with

```
overrides: FORCE_TASKS=fleet-digest,DIGEST_BACKFILL_DAYS=7
```

It covers the N most recent complete UTC days, oldest first, and **skips any day that
already has a brief** — so it is safe to re-run and safe to overlap with the daily task.
Quiet days land directly; the rest go to one agent dispatch that writes them all in a
single PR. Bounded at 30 days a run.

Backfilled briefs are written *as-of the morning after their own day*, so a Tuesday from
last week gets the brief that Tuesday would have got — its own accomplishments, and
whatever was quiet **then** — rather than last Tuesday's work with today's neglect
stapled on.

## Getting it read

An ad-hoc session later in the day, whose own notification mechanism does the delivering.
Its whole instruction:

> Read `digests/<yesterday's UTC date>.md` and send it as a notification verbatim.
> Nothing else: no other files, no tests, no commands, no edits.

The second line is the load-bearing one. Left to its own devices a session will read the
repo to "understand" the brief, and what arrives is a re-summary of a summary.

**That is why a brief is plain text despite its `.md` name.** The notification renderer
parses no markdown and collapses every line break, so a brief written in markdown reaches
the owner as its own source code in one running paragraph. Each item opens with `• ` — a
separator that survives the collapse — and carries its URL bare, which the renderer
autolinks. The `digest-plain-text` check holds the landed series to it. This file is
documentation *about* the series, is read on GitHub, and is markdown on purpose.

## Configuration

On this repo's `sheepdog` pack entry in `.claudinite-checks.json`, under `digest`. Both
keys default; an absent block still writes the file.

| key | default | what it does |
|---|---|---|
| `pick` | `4` | how many accomplishments the brief names (the shortlist is `ceil(pick × 1.5)`) |
| `nudge` | on, 7 days | the "worth returning to" prod. `false` switches it off; `{ "quietDays": 21 }` widens the window |

**Quiet is measured on meaningful merges, never on pushes.** Every member's mount is
converged nightly, so `pushed_at` is fresh on every repo in this fleet every day and
would report the whole fleet as permanently active.

## Secrets

`FLEET_GITHUB_TOKEN` — the account-spanning PAT the other fleet sweeps already read
with. The digest uses its **Pull requests: read** on top of what the census asks for.
Nothing else: the task writes a file and stops.
