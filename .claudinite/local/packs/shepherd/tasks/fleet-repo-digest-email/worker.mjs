// The fleet-repo-digest-email code-work entry point — `node worker.mjs`, cwd = this
// task dir, bounded by code_work_timeout. It reads the tracked fleet issues snapshot,
// picks the day's three repos, and sends one email. It writes nothing and opens no
// pull request.
//
// The send is a one-shot external effect, which is why the declaration carries
// `on_interrupt: 'needs-human'`: a recovery path that re-executed the task would mail
// the same digest twice.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { sendEmail, EmailSendError } from '../../skills/sending-email/send.mjs';
import { dayNumber, digestFor, subjectFor, htmlBody, textBody } from './digest.mjs';

// Written by shepherd/fleet-issues-snapshot, which `schedule_after` holds this task
// behind, so the digest is about the fleet as of this morning rather than yesterday's.
const SNAPSHOT_PATH = '.claudinite/local/fleet-issues.GENERATED.json';
const TASK = 'fleet-repo-digest-email';

const item = process.env.CLAUDINITE_ITEM || '';
const log = (s) => console.log(`${TASK}${item ? ` [#${item}]` : ''}: ${s}`);

// The two addresses are repository VARIABLES rather than anything in the tree: which
// address the account may send from and which it may send to are settled in
// Cloudflare, and an address committed to a public repo is a spam target.
const FROM_VAR = 'DIGEST_EMAIL_FROM';
const TO_VAR = 'DIGEST_EMAIL_TO';

class NeedsAction extends Error {}

export async function main({ now = new Date(), env = process.env } = {}) {
  const root = env.CLAUDINITE_REPO_ROOT || process.cwd();
  const accountId = env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = env.CLOUDFLARE_API_TOKEN?.trim();
  const from = env[FROM_VAR]?.trim();
  const to = env[TO_VAR]?.trim();

  // Each of these is one setting somebody has not made yet, so name every missing one
  // at once rather than parking four mornings running for four separate fixes.
  const missing = [
    !accountId && 'the repository variable CLOUDFLARE_ACCOUNT_ID',
    !token && 'the repository secret CLOUDFLARE_API_TOKEN',
    !from && `the repository variable ${FROM_VAR} (an address on a domain this Cloudflare account may send from)`,
    !to && `the repository variable ${TO_VAR} (a verified destination address on this Cloudflare account)`,
  ].filter(Boolean);
  if (missing.length) throw new NeedsAction(`set ${missing.join(', ')}`);

  const snapshot = JSON.parse(readFileSync(join(root, SNAPSHOT_PATH), 'utf8'));
  const entries = digestFor(snapshot, dayNumber(now));
  if (!entries.length) {
    // An empty fleet is the work running and finding nothing, not a fault.
    log('the snapshot lists no repos — nothing to send');
    return;
  }

  const generated = snapshot.generated ?? 'an unknown time';
  const result = await sendEmail({
    accountId,
    token,
    message: {
      from,
      to,
      subject: subjectFor(entries, now),
      html: htmlBody(entries, { generated }),
      text: textBody(entries, { generated }),
      headers: {
        // RFC 3834: this is machinery talking, and a mail client that knows so will
        // not offer to reply to it or count it as correspondence.
        'Auto-Submitted': 'auto-generated',
      },
    },
  });
  log(`${entries.map((e) => e.repo).join(', ')} — delivered to ${(result.delivered ?? []).length}, `
    + `queued for ${(result.queued ?? []).length}`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((e) => {
    // The kind routes the park: a scope, an address or a zone setting is one person's
    // five-second fix, and anything else is a trace somebody reads.
    const action = e instanceof NeedsAction || (e instanceof EmailSendError && e.needsAction);
    console.error(action
      ? `claudinite-needs-human: action — ${e.message}`
      : `${TASK} failed: ${e.stack ?? e.message}`);
    process.exit(1);
  });
}
