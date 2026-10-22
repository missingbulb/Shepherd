import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blockedBy } from './cn-hook.mjs';

const call = (command) => command;
const guardFindings = (id, command) => (blockedBy(command).includes(id) ? [id] : []);

test('branch-from-local-main fires on a bare local-main branch, stays quiet on origin/main', () => {
  assert.equal(guardFindings('branch-from-local-main', call('git checkout -b claude/foo main')).length, 1);
  assert.equal(guardFindings('branch-from-local-main', call('git branch claude/foo main')).length, 1);

  assert.equal(guardFindings('branch-from-local-main', call('git fetch origin main && git checkout -b claude/foo origin/main')).length, 0);
  assert.equal(guardFindings('branch-from-local-main', call('git checkout main')).length, 0);
  assert.equal(guardFindings('branch-from-local-main', call('git status')).length, 0);
  assert.equal(guardFindings('branch-from-local-main', call('git fetch origin main; git checkout -b claude/foo main')).length, 1);
  // Mentioning the pattern in an argument (e.g. a --summary string) must not read as an invocation.
  assert.equal(guardFindings('branch-from-local-main', call('cn work converge --summary "never git checkout -b x main"')).length, 0);
});

const checkoutRule = 'checkout-ref-whole-tree';

test("checkout-ref-whole-tree fires on pulling another ref's whole tree onto the branch in flight, stays quiet on restoring one's own tree or a single path", () => {
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

const nodeTestDirRule = 'node-test-directory-arg';

test('node-test-directory-arg fires on node --test given a bare directory, stays quiet on explicit files or no args', () => {
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

const pendingWorkflowRule = 'pending-workflow-delivery-needs-force';

test('pending-workflow-delivery-needs-force fires on a plain git mv out of pending-workflows, stays quiet with -f or cp', () => {
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
