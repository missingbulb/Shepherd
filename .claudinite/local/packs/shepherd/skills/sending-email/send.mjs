// The one place this repo talks to the Cloudflare Email Service. Every sender goes
// through `sendEmail`; the `email-service-single-client` declared check beside this
// file is what keeps that true, because the API's constraints are only worth
// encoding once and a second caller with its own fetch would encode none of them.
//
// The REST surface is documented at
// https://developers.cloudflare.com/email-service/api/send-emails/rest-api/ and its
// header rules at https://developers.cloudflare.com/email-service/reference/headers/.
// `validateMessage` below is those two pages' ceilings and allowlists, applied before
// the request rather than after: the service rejects the WHOLE send on a single bad
// header, so a message that would be refused is worth catching where the reason is
// still in front of whoever wrote it.

const API_BASE = 'https://api.cloudflare.com/client/v4';

// Every ceiling here is from the platform limits page
// (https://developers.cloudflare.com/email-service/platform/limits/), except the two
// header counts, which are the headers reference's own table.
export const MAX_RECIPIENTS = 50; // combined across to, cc and bcc
export const MAX_SUBJECT_CHARS = 998;
export const MAX_MESSAGE_BYTES = 5 * 1024 * 1024;
export const MAX_HEADER_NAME_BYTES = 100;
export const MAX_HEADER_VALUE_BYTES = 2048;
export const MAX_HEADERS_PAYLOAD_BYTES = 16 * 1024;
export const MAX_ALLOWLISTED_HEADERS = 20;

// The headers reference's allowlist, canonical casing, matched case-insensitively.
// Anything not here and not `X-` prefixed is rejected by the API with
// E_HEADER_NOT_ALLOWED — and the rejection is of the whole message, not the header.
export const ALLOWLISTED_HEADERS = [
  'In-Reply-To', 'References', 'Thread-Index', 'Thread-Topic',
  'List-Unsubscribe', 'List-Unsubscribe-Post', 'List-Id', 'List-Archive', 'List-Help',
  'List-Owner', 'List-Post', 'List-Subscribe', 'Precedence',
  'Auto-Submitted',
  'Content-Language', 'Keywords', 'Comments', 'Importance', 'Priority', 'Sensitivity',
  'Organization',
  'Require-Recipient-Valid-Since', 'Expires', 'Reply-By',
  'Archived-At',
];

// Set by the platform, or owned by a first-class API field. Either way the API
// refuses the send when one appears in `headers`; they are listed apart because the
// fix differs — drop it, versus move it to its own field.
const PLATFORM_HEADERS = [
  'Date', 'Message-ID', 'MIME-Version', 'Content-Type', 'Content-Transfer-Encoding',
  'DKIM-Signature', 'Return-Path', 'Received', 'Feedback-ID', 'TLS-Required',
  'TLS-Report-Domain', 'TLS-Report-Submitter', 'CFBL-Address', 'CFBL-Feedback-ID',
];
const API_FIELD_HEADERS = ['From', 'To', 'Cc', 'Bcc', 'Subject', 'Reply-To'];

// The error codes that mean a PERSON has something to change — a token scope, an
// entitlement, a zone setting — as opposed to a request this code got wrong or a
// service having a bad minute. `sendEmail` throws with `needsAction` set from this
// set, and a task worker routes its park by it.
const NEEDS_ACTION_CODES = new Set([
  10101, // authentication.unauthorized — missing or invalid token
  10102, // authentication.forbidden — token lacks permission to send
  10103, // authentication.bad_token_type
  10105, // authentication.not_entitled — account not entitled to Email Sending
  10203, // email.sending_disabled — sending disabled for this zone or account
]);

export class EmailSendError extends Error {
  constructor(message, { needsAction = false } = {}) {
    super(message);
    this.name = 'EmailSendError';
    this.needsAction = needsAction;
  }
}

const bytes = (s) => Buffer.byteLength(String(s), 'utf8');
const asList = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
// A recipient is a bare address or `{ address, name }` — the REST spelling. The
// Workers binding's `{ email, name }` is a different API and is what
// `email-service-rest-field-spellings` watches for.
const addressOf = (r) => (typeof r === 'string' ? r : r?.address);

// Everything the API would reject, as a list of reasons. Empty means the message is
// within every documented ceiling — not that it will deliver, which is the
// recipient's domain's call.
export function validateMessage(message) {
  const problems = [];
  const { from, to, cc, bcc, subject, html, text, headers } = message ?? {};

  if (!addressOf(from)) problems.push('no `from` address');
  const recipients = [...asList(to), ...asList(cc), ...asList(bcc)];
  if (!recipients.length) problems.push('no recipients');
  if (recipients.length > MAX_RECIPIENTS) {
    problems.push(`${recipients.length} recipients across to/cc/bcc, over the limit of ${MAX_RECIPIENTS}`);
  }
  for (const r of recipients) if (!addressOf(r)) problems.push(`a recipient carries no address: ${JSON.stringify(r)}`);

  if (!subject) problems.push('no `subject`');
  else if (String(subject).length > MAX_SUBJECT_CHARS) {
    problems.push(`subject is ${String(subject).length} characters, over the limit of ${MAX_SUBJECT_CHARS}`);
  }
  // Both bodies, always: a mail client with HTML off shows the `text` part, and a
  // send carrying only HTML reads as bulk to the filters that grade it.
  if (!html && !text) problems.push('no `html` and no `text` body');
  else if (html && !text) problems.push('an `html` body with no `text` alternative');

  problems.push(...headerProblems(headers));

  const size = bytes(JSON.stringify(message ?? {}));
  if (size > MAX_MESSAGE_BYTES) {
    problems.push(`the message is ${size} bytes, over the limit of ${MAX_MESSAGE_BYTES}`);
  }
  return problems;
}

function headerProblems(headers) {
  if (!headers) return [];
  const problems = [];
  const allowed = new Map(ALLOWLISTED_HEADERS.map((h) => [h.toLowerCase(), h]));
  const platform = new Set(PLATFORM_HEADERS.map((h) => h.toLowerCase()));
  const apiField = new Map(API_FIELD_HEADERS.map((h) => [h.toLowerCase(), h]));
  let allowlisted = 0;
  let payload = 0;

  for (const [name, value] of Object.entries(headers)) {
    const key = name.toLowerCase();
    payload += bytes(name) + 2 + bytes(value ?? '') + 2;
    if (bytes(name) > MAX_HEADER_NAME_BYTES) problems.push(`header \`${name}\` has a name over ${MAX_HEADER_NAME_BYTES} bytes`);
    if (bytes(value ?? '') > MAX_HEADER_VALUE_BYTES) problems.push(`header \`${name}\` has a value over ${MAX_HEADER_VALUE_BYTES} bytes`);
    if (!String(value ?? '').length) problems.push(`header \`${name}\` has an empty value`);
    if (/[\r\n]/.test(String(value ?? ''))) problems.push(`header \`${name}\` has a value carrying a bare CR or LF`);

    if (platform.has(key)) {
      problems.push(`header \`${name}\` is set by the platform and cannot be sent`);
    } else if (apiField.has(key)) {
      problems.push(`header \`${name}\` belongs in its own API field, not in \`headers\``);
    } else if (key.startsWith('x-')) {
      if (!/^X-[A-Za-z0-9\-_]+$/.test(name)) problems.push(`header \`${name}\` is not a valid X- header name`);
    } else if (allowed.has(key)) {
      allowlisted += 1;
      // The one allowlisted header whose VALUE the API pins: RFC 8058 one-click.
      if (key === 'list-unsubscribe-post' && value !== 'List-Unsubscribe=One-Click') {
        problems.push('header `List-Unsubscribe-Post` must be exactly `List-Unsubscribe=One-Click`');
      }
      if (key === 'list-unsubscribe' && !/<(https|mailto):/.test(String(value))) {
        problems.push('header `List-Unsubscribe` must carry an angle-bracketed https: or mailto: URI');
      }
    } else {
      problems.push(`header \`${name}\` is not on the allowlist and is not an X- header`);
    }
  }

  if (allowlisted > MAX_ALLOWLISTED_HEADERS) {
    problems.push(`${allowlisted} allowlisted headers, over the limit of ${MAX_ALLOWLISTED_HEADERS}`);
  }
  if (payload > MAX_HEADERS_PAYLOAD_BYTES) {
    problems.push(`the custom headers total ${payload} bytes, over the limit of ${MAX_HEADERS_PAYLOAD_BYTES}`);
  }
  return problems;
}

// The API's own numeric codes, rendered as the sentence a park is worth reading.
function apiFailure(status, body) {
  const errors = Array.isArray(body?.errors) ? body.errors : [];
  const needsAction = errors.some((e) => NEEDS_ACTION_CODES.has(e?.code));
  const detail = errors.length
    ? errors.map((e) => `${e.code} ${e.message}`).join('; ')
    : `HTTP ${status}`;
  return new EmailSendError(`the Email Service refused the send: ${detail}`, { needsAction });
}

// Sends one message and returns the API's recipient-grouped result. `fetchImpl` is a
// seam for the tests: nothing else passes it.
export async function sendEmail({ accountId, token, message, fetchImpl = fetch }) {
  if (!accountId) throw new EmailSendError('no Cloudflare account id', { needsAction: true });
  if (!token) throw new EmailSendError('no Cloudflare API token', { needsAction: true });

  const problems = validateMessage(message);
  if (problems.length) {
    throw new EmailSendError(`the message would be refused: ${problems.join('; ')}`);
  }

  const response = await fetchImpl(`${API_BASE}/accounts/${accountId}/email/sending/send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });

  // A non-JSON body is a proxy or an outage answering, not the API; say what came
  // back rather than throw a parse error nobody can act on.
  let body = null;
  try { body = await response.json(); } catch { /* handled below */ }
  if (!response.ok || body?.success !== true) throw apiFailure(response.status, body);

  const result = body.result ?? {};
  // A permanent bounce is an accepted request that delivered to nobody. Before a
  // sending domain is onboarded the only deliverable recipients are the account's
  // verified destination addresses, so this is the shape an unverified recipient
  // takes — a person's to fix, not a retry.
  const bounced = asList(result.permanent_bounces);
  if (bounced.length && !asList(result.delivered).length && !asList(result.queued).length) {
    throw new EmailSendError(
      `every recipient permanently bounced: ${bounced.join(', ')} — the address must be a verified `
      + 'destination address until a sending domain is onboarded',
      { needsAction: true },
    );
  }
  return result;
}
