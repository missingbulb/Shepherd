import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadDeclaredChecks, guardFindings } from
  '../../../../shared/engine/checks/helpers/pattern-rules.mjs';

const packDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const rules = loadDeclaredChecks(packDir);
const rule = rules.find((r) => r.id === 'branch-from-local-main');
const call = (command) => ({ name: 'Bash', input: { command } });

test('branch-from-local-main fires on a bare local-main branch, stays quiet on origin/main', () => {
  assert.ok(rule, 'branch-from-local-main is declared in the pack');

  assert.equal(guardFindings(rule, call('git checkout -b claude/foo main')).length, 1);
  assert.equal(guardFindings(rule, call('git branch claude/foo main')).length, 1);

  assert.equal(guardFindings(rule, call('git fetch origin main && git checkout -b claude/foo origin/main')).length, 0);
  assert.equal(guardFindings(rule, call('git checkout main')).length, 0);
  assert.equal(guardFindings(rule, call('git status')).length, 0);
});

const checkoutRule = rules.find((r) => r.id === 'checkout-ref-whole-tree');

test("checkout-ref-whole-tree fires on pulling another ref's whole tree onto the branch in flight, stays quiet on restoring one's own tree or a single path", () => {
  assert.ok(checkoutRule, 'checkout-ref-whole-tree is declared in the pack');

  assert.equal(guardFindings(checkoutRule, call('git checkout origin/main -- .')).length, 1);
  assert.equal(guardFindings(checkoutRule, call('git stash -u; git checkout origin/main -- .; git status --short')).length, 1);

  assert.equal(guardFindings(checkoutRule, call('git checkout -- .')).length, 0);
  assert.equal(guardFindings(checkoutRule, call('git checkout HEAD -- .')).length, 0);
  assert.equal(guardFindings(checkoutRule, call('git checkout origin/main -- path/to/file.js')).length, 0);
  assert.equal(guardFindings(checkoutRule, call('git checkout -b claude/foo origin/main')).length, 0);
  assert.equal(guardFindings(checkoutRule, call('git worktree add /tmp/base origin/main')).length, 0);
});
