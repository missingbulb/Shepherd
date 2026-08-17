# This fleet's per-user preferences

One file per person — `<email>.md` — holding that person's **personal interaction
preferences**: tone, summary style, end-of-turn conventions, how results and decisions are
surfaced, and the phrases they use to trigger defined commands.

These are **not** project conventions. Project conventions are shared canon and live in
[Claudinite's `packs/`](https://github.com/missingbulb/Claudinite/tree/main/packs), which every
fleet mounts. Personal preferences are the concern of **this fleet's users**, which is why they
live here, in the fleet's own repo, and not in the canon: the canon is the wrong host for one
owner's preferences and the wrong authority on where they belong.

## How a session finds them

Each member of the fleet declares the `claude-code-web-users-support` pack in its own
`.claudinite-checks.json`, and names this repo as the store:

```json
{ "id": "claude-code-web-users-support", "config": { "repo": "missingbulb/Shepherd" } }
```

That pack's session-start step reads `preferences/<the session user's email>.md` from it —
locally when the session is *in this repo* (the working copy is the truth here), over HTTPS
otherwise. Every miss is fail-soft: one note in the session context, and the session proceeds
on default interaction behavior.

The declaration is written into each member by this repo's `fleet-pack-seeds` sweep, from the
`packSeeds` list on this repo's own sheepdog config — which is why no consuming repo has to know
this repo's name by hand. Neither Claudinite's engine nor the sheepdog pack knows what any of
this is *for*: the engine runs the pack's step because the pack ships one, and the sweep seeds
the declaration because this repo's config names it.

## Adding or editing preferences

Add a file named for the person's email address, or edit theirs. One distilled preference per
bullet, in the imperative — a preference is a rule the assistant can act on, not a description
of a mood. Nothing here is secret, but nothing here needs to be shared either: it is the
fleet's own repo, and it stays that way.
