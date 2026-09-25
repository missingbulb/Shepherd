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

  // Mentioning the pattern in prose (e.g. a --summary argument describing this very
  // check) must not read as an invocation of it.
  assert.equal(guardFindings(checkoutRule, call(
    'node converge-item.mjs --summary \'ships a check blocking git checkout <ref> -- . on the branch in flight\''
  )).length, 0);
});

const nodeTestDirRule = rules.find((r) => r.id === 'node-test-directory-arg');

test('node-test-directory-arg fires on node --test given a bare directory, stays quiet on explicit files or no args', () => {
  assert.ok(nodeTestDirRule, 'node-test-directory-arg is declared in the pack');

  assert.equal(guardFindings(nodeTestDirRule,
    call('node --test .claudinite/local/packs/shepherd/test/')).length, 1);
  assert.equal(guardFindings(nodeTestDirRule,
    call('cd /home/user/Shepherd && node --test .claudinite/local/packs/shepherd/test/')).length, 1);

  assert.equal(guardFindings(nodeTestDirRule,
    call("node --test $(git ls-files '.claudinite/local/**/*.test.mjs')")).length, 0);
  assert.equal(guardFindings(nodeTestDirRule,
    call('node --test .claudinite/local/packs/shepherd/test/declared-checks.test.mjs')).length, 0);
  assert.equal(guardFindings(nodeTestDirRule, call('node --test')).length, 0);
  assert.equal(guardFindings(nodeTestDirRule, call(
    'node converge-item.mjs --summary \'guards node --test given a bare directory\''
  )).length, 0);
});

const pendingWorkflowRule = rules.find((r) => r.id === 'pending-workflow-delivery-needs-force');

test('pending-workflow-delivery-needs-force fires on a plain git mv out of pending-workflows, stays quiet with -f or cp', () => {
  assert.ok(pendingWorkflowRule, 'pending-workflow-delivery-needs-force is declared in the pack');

  assert.equal(guardFindings(pendingWorkflowRule,
    call('git mv .claudinite/pending-workflows/foo.yml .github/workflows/foo.yml')).length, 1);
  assert.equal(guardFindings(pendingWorkflowRule,
    call('git status; git mv .claudinite/pending-workflows/foo.yml .github/workflows/foo.yml')).length, 1);

  assert.equal(guardFindings(pendingWorkflowRule,
    call('git mv -f .claudinite/pending-workflows/foo.yml .github/workflows/foo.yml')).length, 0);
  assert.equal(guardFindings(pendingWorkflowRule,
    call('cp -f .claudinite/pending-workflows/foo.yml .github/workflows/foo.yml && rm .claudinite/pending-workflows/foo.yml')).length, 0);
  assert.equal(guardFindings(pendingWorkflowRule, call('git mv old-name.mjs new-name.mjs')).length, 0);
  assert.equal(guardFindings(pendingWorkflowRule, call(
    'node converge-item.mjs --summary \'blocks git mv .claudinite/pending-workflows/x.yml without -f\''
  )).length, 0);
});
