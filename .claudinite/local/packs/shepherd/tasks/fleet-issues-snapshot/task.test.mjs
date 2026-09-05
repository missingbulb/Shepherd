import { test } from 'node:test';
import assert from 'node:assert/strict';
import task from './task.json' with { type: 'json' };
import { validateTaskDeclaration } from '../../../../../shared/packs/claudinite-tasks/task-contract.mjs';

// Validated against THIS REPO'S OWN vendored contract: discovery skips a
// declaration that fails it and records an error rather than failing the mount,
// so a broken one stops this task running with nothing red to say so.
test('fleet-issues-snapshot declares the one precondition mechanism, no legacy remnant', () => {
  assert.deepEqual(task.preconditions, ['none']);
  assert.equal(task.precondition, undefined);
  assert.equal(task.precondition_signals, undefined);
});

test('the vendored contract accepts it', () => {
  assert.deepEqual(validateTaskDeclaration(task, new Map()), []);
});
