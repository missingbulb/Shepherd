import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadDeclaredChecks, guardFindings } from
  '../../../../shared/engine/checks/helpers/pattern-rules.mjs';

const packDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const rules = loadDeclaredChecks(packDir);
const rule = rules.find((r) => r.id === 'branch-from-local-main');

test('branch-from-local-main fires on a bare local-main branch, stays quiet on origin/main', () => {
  assert.ok(rule, 'branch-from-local-main is declared in the pack');

  const call = (command) => ({ name: 'Bash', input: { command } });

  assert.equal(guardFindings(rule, call('git checkout -b claude/foo main')).length, 1);
  assert.equal(guardFindings(rule, call('git branch claude/foo main')).length, 1);

  assert.equal(guardFindings(rule, call('git fetch origin main && git checkout -b claude/foo origin/main')).length, 0);
  assert.equal(guardFindings(rule, call('git checkout main')).length, 0);
  assert.equal(guardFindings(rule, call('git status')).length, 0);
});
