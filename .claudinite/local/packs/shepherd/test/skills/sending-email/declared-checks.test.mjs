import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const checks = JSON.parse(readFileSync(new URL('../../../skills/sending-email/declared-checks.json', import.meta.url), 'utf8'));
const rule = checks.find((c) => c.id === 'email-service-hardcoded-address');
const pattern = (s) => {
  const m = /^\/(.*)\/([a-z]*)$/s.exec(s);
  return new RegExp(m[1], m[2]);
};
const fires = (line) => rule.matchLines.some((l) => pattern(l.match).test(line));

test('email-service-hardcoded-address fires on a literal address in a task file, stays quiet on a repo-variable read', () => {
  assert.ok(rule, 'email-service-hardcoded-address is declared in the skill');
  assert.ok(pattern(rule.scanFiles).test('.claudinite/local/packs/shepherd/tasks/example-task/worker.mjs'));
  assert.equal(fires("const message = { from: sender, to: 'owner@example.com', subject, html, text };"), true);
  assert.equal(fires('const message = { from: sender, to: process.env.DIGEST_RECIPIENT, subject, html, text };'), false);
});
