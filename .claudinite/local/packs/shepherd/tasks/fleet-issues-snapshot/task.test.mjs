import { test } from 'node:test';
import assert from 'node:assert/strict';
import task from './task.json' with { type: 'json' };
import { validateTaskDeclaration } from '../../../../../shared/packs/claudinite-tasks/public/task-declaration.mjs';

// Validated against THIS REPO'S OWN vendored contract: discovery skips a
// declaration that fails it and records an error rather than failing the mount,
// so a broken one stops this task running with nothing red to say so.
test('the vendored contract accepts it', () => {
  assert.deepEqual(validateTaskDeclaration(task, new Map()), []);
});

test('delivers on the branch and pull request the executor resolved', async () => {
  const { deliveryTarget } = await import('./worker.mjs');
  const { generatedTarget } = await import('../../../../../shared/packs/claudinite-tasks/public/delivery.mjs');
  const target = deliveryTarget({ CLAUDINITE_TARGET_BRANCH: 'claudinite/shepherd/fleet-issues-snapshot/2026-09-29-abc123', CLAUDINITE_TARGET_PR: '' });
  assert.deepEqual(generatedTarget({ pulls: [], ...target }),
    { branch: 'claudinite/shepherd/fleet-issues-snapshot/2026-09-29-abc123', pr: null, reused: false });
  assert.deepEqual(deliveryTarget({ CLAUDINITE_TARGET_BRANCH: 'b', CLAUDINITE_TARGET_PR: '42' }), { branch: 'b', pr: 42 });
});
