import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  sendEmail, validateMessage, EmailSendError, MAX_RECIPIENTS, MAX_SUBJECT_CHARS,
} from '../../../skills/sending-email/send.mjs';

// The client's contract: which messages it refuses before spending a request, and how
// it routes what the API says back. The fetch seam is a stub throughout — nothing here
// reaches Cloudflare, so what these cases CANNOT catch is the request shape actually
// being the one the service accepts; only a real send proves that.

const ok = {
  from: 'digest@example.com',
  to: 'owner@example.com',
  subject: 'Fleet digest',
  html: '<p>hi</p>',
  text: 'hi',
};

const stub = (response) => {
  const calls = [];
  const fetchImpl = async (url, init) => { calls.push({ url, init }); return response; };
  return { calls, fetchImpl };
};
const json = (status, body) => ({ ok: status < 400, status, json: async () => body });
const delivered = json(200, { success: true, result: { delivered: ['owner@example.com'], permanent_bounces: [], queued: [] } });

test('a message inside every ceiling has nothing to say against it', () => {
  assert.deepEqual(validateMessage(ok), []);
});

test('the documented ceilings are refused before a request is spent', () => {
  const over = (m) => validateMessage({ ...ok, ...m }).join(' ');
  assert.match(over({ to: Array.from({ length: MAX_RECIPIENTS + 1 }, (_, i) => `a${i}@example.com`) }), /over the limit of 50/);
  assert.match(over({ subject: 'x'.repeat(MAX_SUBJECT_CHARS + 1) }), /over the limit of 998/);
  assert.match(over({ text: 'x'.repeat(6 * 1024 * 1024) }), /over the limit of 5242880/);
  // The recipient cap is the COMBINED count across to, cc and bcc.
  assert.match(over({
    to: Array.from({ length: 25 }, (_, i) => `a${i}@example.com`),
    cc: Array.from({ length: 26 }, (_, i) => `b${i}@example.com`),
  }), /51 recipients/);
});

test('HTML with no plain-text alternative is refused', () => {
  assert.match(validateMessage({ ...ok, text: undefined }).join(' '), /no `text` alternative/);
  assert.match(validateMessage({ ...ok, html: undefined, text: undefined }).join(' '), /no `html` and no `text`/);
});

test('a recipient may be a bare address or the REST named form, not the Workers one', () => {
  assert.deepEqual(validateMessage({ ...ok, to: { address: 'a@example.com', name: 'A' } }), []);
  assert.match(validateMessage({ ...ok, to: { email: 'a@example.com', name: 'A' } }).join(' '), /carries no address/);
});

test('a header the platform owns, or one that has its own field, is refused', () => {
  const problems = (headers) => validateMessage({ ...ok, headers }).join(' ');
  assert.match(problems({ 'Message-ID': '<x@y>' }), /set by the platform/);
  assert.match(problems({ 'DKIM-Signature': 'v=1' }), /set by the platform/);
  assert.match(problems({ Subject: 'no' }), /belongs in its own API field/);
  assert.match(problems({ 'Reply-To': 'a@example.com' }), /belongs in its own API field/);
  // Case-insensitive, per RFC 5322 §2.2 and the service's own matching.
  assert.match(problems({ 'message-id': '<x@y>' }), /set by the platform/);
});

test('an allowlisted header passes, an invented one does not, and any X- header does', () => {
  assert.deepEqual(validateMessage({ ...ok, headers: { 'Auto-Submitted': 'auto-generated' } }), []);
  assert.deepEqual(validateMessage({ ...ok, headers: { 'X-Campaign-ID': 'digest' } }), []);
  assert.match(validateMessage({ ...ok, headers: { 'Invented-Header': 'v' } }).join(' '), /not on the allowlist/);
  assert.match(validateMessage({ ...ok, headers: { 'X-Bad Header': 'v' } }).join(' '), /not a valid X- header name/);
});

test('the two headers whose values the service pins are checked against those values', () => {
  const problems = (headers) => validateMessage({ ...ok, headers }).join(' ');
  assert.match(problems({ 'List-Unsubscribe-Post': 'one-click' }), /exactly `List-Unsubscribe=One-Click`/);
  assert.equal(problems({ 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }), '');
  assert.match(problems({ 'List-Unsubscribe': 'https://example.com/u' }), /angle-bracketed/);
  assert.equal(problems({ 'List-Unsubscribe': '<https://example.com/u>' }), '');
});

test('an empty value and a value carrying a bare newline are refused', () => {
  assert.match(validateMessage({ ...ok, headers: { 'X-A': '' } }).join(' '), /empty value/);
  assert.match(validateMessage({ ...ok, headers: { 'X-A': 'a\nb' } }).join(' '), /bare CR or LF/);
});

test('a refused message spends no request at all', async () => {
  const { calls, fetchImpl } = stub(delivered);
  await assert.rejects(
    sendEmail({ accountId: 'acc', token: 't', message: { ...ok, text: undefined }, fetchImpl }),
    (e) => e instanceof EmailSendError && !e.needsAction && /would be refused/.test(e.message),
  );
  assert.equal(calls.length, 0);
});

test('a send posts the message to the account endpoint as bearer-authenticated JSON', async () => {
  const { calls, fetchImpl } = stub(delivered);
  const result = await sendEmail({ accountId: 'acc123', token: 'tok', message: ok, fetchImpl });
  assert.deepEqual(result.delivered, ['owner@example.com']);
  assert.equal(calls[0].url, 'https://api.cloudflare.com/client/v4/accounts/acc123/email/sending/send');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer tok');
  assert.deepEqual(JSON.parse(calls[0].init.body), ok);
});

test('a permission, entitlement or sending-disabled refusal is a person\'s to fix', async () => {
  for (const code of [10101, 10102, 10103, 10105, 10203]) {
    const { fetchImpl } = stub(json(403, { success: false, errors: [{ code, message: `code.${code}` }] }));
    await assert.rejects(
      sendEmail({ accountId: 'acc', token: 't', message: ok, fetchImpl }),
      (e) => e.needsAction === true && e.message.includes(String(code)),
      `code ${code} should route to a needs-action park`,
    );
  }
});

test('a schema error, a throttle and an outage are the worker\'s failure, not a setting', async () => {
  for (const [status, code] of [[400, 10001], [429, 10004], [500, 10002]]) {
    const { fetchImpl } = stub(json(status, { success: false, errors: [{ code, message: `code.${code}` }] }));
    await assert.rejects(
      sendEmail({ accountId: 'acc', token: 't', message: ok, fetchImpl }),
      (e) => e.needsAction === false,
      `code ${code} should not route to a needs-action park`,
    );
  }
});

test('a body that is not the API answering still fails with what came back', async () => {
  const { fetchImpl } = stub({ ok: false, status: 502, json: async () => { throw new Error('not json'); } });
  await assert.rejects(
    sendEmail({ accountId: 'acc', token: 't', message: ok, fetchImpl }),
    (e) => e instanceof EmailSendError && /HTTP 502/.test(e.message),
  );
});

test('an accepted request that bounced every recipient is not a success', async () => {
  const { fetchImpl } = stub(json(200, {
    success: true,
    result: { delivered: [], permanent_bounces: ['owner@example.com'], queued: [] },
  }));
  await assert.rejects(
    sendEmail({ accountId: 'acc', token: 't', message: ok, fetchImpl }),
    (e) => e.needsAction === true && /verified\s+destination address/.test(e.message),
  );
});

test('a bounce beside a delivery is reported by the result, not thrown', async () => {
  const { fetchImpl } = stub(json(200, {
    success: true,
    result: { delivered: ['owner@example.com'], permanent_bounces: ['gone@example.com'], queued: [] },
  }));
  const result = await sendEmail({ accountId: 'acc', token: 't', message: ok, fetchImpl });
  assert.deepEqual(result.permanent_bounces, ['gone@example.com']);
});

test('a missing account id or token is a setting, and spends no request', async () => {
  const { calls, fetchImpl } = stub(delivered);
  for (const args of [{ token: 't' }, { accountId: 'acc' }]) {
    await assert.rejects(sendEmail({ ...args, message: ok, fetchImpl }), (e) => e.needsAction === true);
  }
  assert.equal(calls.length, 0);
});
