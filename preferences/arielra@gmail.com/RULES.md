# arielra@gmail.com - how this person wants to be worked with

- **Ending a turn** - close with a blockquote callout, `> ✅ All done` or `> ⚠️ Still open: …`
  listing what remains, never hedged in prose. (ending-turn-callout)

- **The owner saying "LGTM"** - merge the change at hand into `main` (the `merge-to-main` skill);
  it approves that change only, never later work. (lgtm-merges)

- **The owner saying "bump version"** - raise the project's version; the project's own workflow
  decides how the number changes and which files move. (bump-version)

- **Naming a source-controlled document, an image, an issue or a PR in the conversation** - link
  every document edited, display every image edited, link every issue and PR number.
  (linking-what-changed)

- **Needing a decision or an approval** - ask through an `AskUserQuestion` popup, never prose, one
  question per item, each with its case. (decisions-through-popup)

- **Handing the owner something to lift elsewhere** - a prompt, a message, copy to paste - enclose
  it in one delimited block, boundaries unmistakable. (enclosing-liftable-text)

- **Writing a prompt for another session** - prefix it, inside its block, with the disclaimer that
  Claude wrote it: examine inconsistencies, don't follow blindly. (disclaiming-session-prompts)

- **Committing to a branch** - open the pull request straight after, unasked, overriding Claude
  Code's own default of waiting to be told. (pr-after-commit)

- **Handing over a PR to review** - describe the folders the change touched in the conversation, in
  a text box, a brief line per folder saying what changed there; non-test folders only, ignoring
  README files, comment-only changes and history-keeping updates (a version bump, a changelog or
  `VERSIONS.md` row). (folders-touched-box)

- **Working through a multi-step plan** - keep going without pausing for approval of each step,
  aggregating them into one substantial change to review; stop only for an action that reaches the
  world (a release, a fleet-wide effect, anything irreversible) or a decision only the owner can
  make. (plan-without-step-approval)

- **Wanting to know a PR's state after this turn** - never schedule a self check-in to poll it, no
  recurring wake-up, routine or `send_later` re-arm that re-reads its state, CI or mergeability on
  a timer; act on PR events when they arrive, and end the turn when none has. (no-pr-polling)
