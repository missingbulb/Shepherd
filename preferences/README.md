# This fleet's per-user packs

One directory per person — `<email>/` — holding the **pack that travels with them**: how they
want to be worked with (tone, summary style, end-of-turn conventions, the phrases they use to
trigger defined commands), and anything else a Claudinite pack can carry.

These are **not** project conventions. Project conventions are shared canon and live in
[Claudinite's `packs/`](https://github.com/missingbulb/Claudinite/tree/main/packs), which every
fleet mounts. A person's own pack is the concern of **this fleet's users**, which is why it
lives here, in the fleet's own repo, and not in the canon: the canon is the wrong host for one
person's rules and the wrong authority on where they belong.

## What a person's directory holds

`<email>/` is an ordinary pack directory. The only file most people need is `RULES.md`. A
person who wants more can add any of:

| File | What it does |
|---|---|
| `RULES.md` | the rules, loaded into every session they open on a member repo |
| `skills/<name>/SKILL.md` | a skill of their own, mounted like any pack's |
| `worldRules/`, `workRules/`, `declared-checks.json` | checks of their own |
| `provenance/` | the decision log behind each rule, one file per rule |
| `pack.mjs` | a manifest, only where one is needed; it sets neither `id` nor `version` |

Because it is copied into every session on every member repo, it may hold nothing that belongs
to one project. A project convention goes in the pack that owns its subject.

## How a session finds it

Each member of the fleet declares the `claude-code-web-users-support` pack in its own
`.claudinite-settings.json`, and names this repo as the store:

```json
{ "id": "claude-code-web-users-support", "config": { "repo": "missingbulb/Shepherd" } }
```

That pack copies `preferences/<the session user's email>/` into the member's session pack root
before anything reads it — from the working copy when the session is *in this repo*, by a
shallow sparse clone otherwise. From there the member's own engine loads it like any other
pack. Every miss is fail-soft: one note in the session context, and the session proceeds on
default interaction behavior.

The declaration is written into each member by this repo's `fleet-pack-seeds` sweep, from the
`packSeeds` list on this repo's own sheepdog config — which is why no consuming repo has to know
this repo's name by hand. Neither Claudinite's engine nor the sheepdog pack knows what any of
this is *for*: the engine runs the pack's step because the pack ships one, and the sweep seeds
the declaration because this repo's config names it.

## Adding or editing a person's pack

Create `<their exact email>/RULES.md`, or edit theirs. The directory name is the whole address,
case included, so any other name is silently never read. One distilled rule per bullet, in the
imperative — a rule is something the assistant can act on, not a description of a mood.

**Write access here is the power to run code in someone's sessions**: a pack's checks and
skills execute inside every session it is copied into. Treat a change under someone else's
directory as you would a change to their own repo.

Nothing here is secret, but nothing here needs to be shared either: it is the fleet's own repo,
and it stays that way.
