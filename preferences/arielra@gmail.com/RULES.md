# Owner's pack

How the repo owner wants to be worked with — tone, summary style, end-of-turn conventions, how results and decisions are surfaced, and the phrases they use to trigger defined commands. These are **not** project conventions (those live in the [packs/](https://github.com/missingbulb/Claudinite/tree/main/packs) corpus, each pack bundling its skills); they travel with the owner into every project. Where a rule triggers a command whose mechanics are a project convention, the mechanics stay in their own doc and the rule here just owns the trigger phrase.

## Rules

- **End every turn with a blockquote callout** — `> ✅ All done`, or `> ⚠️ Still open: …` listing what remains — never hedged in prose. (ending-turn-callout)

- **"LGTM"** merges the change at hand into `main` (`merge-to-main` skill); it approves that change only, never later work. (lgtm-merges)

- **"bump version"** raises the project's version; the project's own workflow decides how it changes and which files change. (bump-version)

- **In the conversation**: link every source-controlled document you edit, display every image you edit, link every issue/PR number. (linking-what-changed)

- **Ask every decision or approval through an `AskUserQuestion` popup, never prose** — one question per item, each with its case. (decisions-through-popup)

- **Enclose anything the owner will lift elsewhere** — a prompt, a message, copy to paste — in one delimited block, boundaries unmistakable. (enclosing-liftable-text)

- **Prefix a prompt for another session, inside its block, with a disclaimer**: Claude wrote it — examine inconsistencies, don't follow blindly. (disclaiming-session-prompts)

- **Open a pull request right after committing to a branch**, unasked — overriding Claude Code's default of waiting to be told. (pr-after-commit)

- **When handing over a PR to review, describe the folders the change touched in the conversation, in a text box** — a brief line per folder saying what changed there. Show non-test folders only, and ignore README files, comment-only changes, and history-keeping updates (a version bump, a changelog or `VERSIONS.md` row). (folders-touched-box)

- **Keep working through a multi-step plan without pausing for approval of each step** — aggregate the steps into one substantial change to review, and stop only for an action that reaches the world (a release, a fleet-wide effect, anything irreversible) or a decision only the owner can make. (plan-without-step-approval)

- **Never schedule a self check-in to poll a PR** — no recurring wake-up, routine, or `send_later` re-arm that re-reads a PR's state, CI or mergeability on a timer. Act on PR events when they arrive; when nothing has arrived, end the turn. (no-pr-polling)
