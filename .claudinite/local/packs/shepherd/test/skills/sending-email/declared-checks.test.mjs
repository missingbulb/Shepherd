import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadDeclaredChecks } from
  '../../../../../../shared/engine/checks/helpers/pattern-rules.mjs';

const skillDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'skills', 'sending-email');
const rules = loadDeclaredChecks(skillDir);
const rule = rules.find((r) => r.id === 'email-service-hardcoded-address');

const ctxFor = (path, text) => ({
  files: [path],
  tracked: [path],
  allFiles: [path],
  read: (p) => (p === path ? text : null),
});

test('email-service-hardcoded-address fires on a literal address in a task file, stays quiet on a repo-variable read', () => {
  assert.ok(rule, 'email-service-hardcoded-address is declared in the skill');

  const dirty = ctxFor(
    '.claudinite/local/packs/shepherd/tasks/example-task/worker.mjs',
    "const message = { from: sender, to: 'owner@example.com', subject, html, text };\n",
  );
  assert.equal(rule.run(dirty).length, 1);

  const clean = ctxFor(
    '.claudinite/local/packs/shepherd/tasks/example-task/worker.mjs',
    "const message = { from: sender, to: process.env.DIGEST_RECIPIENT, subject, html, text };\n",
  );
  assert.equal(rule.run(clean).length, 0);
});
