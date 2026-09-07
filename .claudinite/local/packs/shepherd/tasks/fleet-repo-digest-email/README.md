# Fleet repo digest email — three repos in the owner's inbox every morning

**This task runs no agent.** It is `agent_model: none` with `code_work: node worker.mjs`, so the
whole pass is [`worker.mjs`](worker.mjs) over the pure [`digest.mjs`](digest.mjs) beside it.
This file is the human-facing record of what that worker does.

## What it does

Nightly, after `shepherd/fleet-issues-snapshot` has converged: read the tracked
`.claudinite/local/fleet-issues.GENERATED.json`, pick three repos, and send one email over the
[Cloudflare Email Service](../../skills/sending-email/SKILL.md). Each repo gets its name, its
link, its open-issue count and up to five open-issue titles. Nothing is written and no pull
request is opened.

The queue's own `[claudinite-work]` items are **counted, not listed**: on an active member they
outnumber the project's real work several times over, so five titles would be five work items.
The count line says how many of the open issues are the machinery's, and the titles below it are
the repo's own.

Force one now:

```
node .claudinite/shared/packs/claudinite-tasks/queue/create-work-item.mjs shepherd/fleet-repo-digest-email
```

## How the three are chosen

Day *N* since the epoch takes the sorted roster's entries 3N, 3N+1 and 3N+2, wrapping. Three
different repos every morning, the whole fleet covered in `ceil(n / 3)` days, and — the reason
it is arithmetic rather than a least-recently-sent record — **no state**, so the task keeps no
file, opens no pull request, and a missed night costs the rotation nothing.

## What the owner has to have set up

Four settings, none of them in this repo's tree:

| Setting | Where | What it is |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | repo secret | a token whose **Send email** permission covers the account |
| `CLOUDFLARE_ACCOUNT_ID` | repo variable | the account the sending domain lives under |
| `DIGEST_EMAIL_FROM` | repo variable | an address on a domain the account may send from |
| `DIGEST_EMAIL_TO` | repo variable | the recipient — a verified destination address, until a sending domain is onboarded |

A run missing any of them parks at `task:status:needs-human-action` naming all of them at once.

## Why the declaration reads as it does

- **`due:daily`, and nothing about repo activity.** The digest's subject is the fleet, not this
  repo, so a quiet night here is exactly a night the owner still wants the mail.
- **`schedule_after: shepherd/fleet-issues-snapshot`.** It reads what that task writes; without
  the edge it would mail yesterday's snapshot on the mornings it won the race.
- **`on_interrupt: needs-human`.** A sent email cannot be un-sent, so a recovery path that
  re-executes the task would mail the digest twice; this routes an interrupted run to triage
  instead.
- **`code_work_timeout: 120`.** One local file read and one HTTPS request.
- **No `automerge`.** The outcome is `no_code_changes` — there is no pull request to land.
