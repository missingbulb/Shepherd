import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import rule from '../../worldRules/anchored-bash-guards.mjs';

const run = (specs) => {
  const text = JSON.stringify(specs);
  return rule.run({ files: ['p/declared-checks.json'], read: () => text });
};
const bash = (match) => ({ id: 'x', scope: 'action', guardToolCalls: [{ tool: 'Bash', inputField: 'command', match }] });

test('fires on an unanchored Bash match, stays quiet on an anchored one and on other tools', () => {
  assert.equal(run([bash('/git\\s+branch\\s+main\\b/')]).length, 1);
  assert.equal(run([bash('/(?:^|[;&|\\n])\\s*git\\s+branch\\s+main\\b/')]).length, 0);
  assert.equal(run([{ id: 'y', scope: 'action', guardToolCalls: [{ tool: 'Write', match: '/foo/' }] }]).length, 0);
});

test("this pack's own declared checks satisfy it", () => {
  const file = join(dirname(fileURLToPath(import.meta.url)), '../../declared-checks.json');
  const text = readFileSync(file, 'utf8');
  assert.deepEqual(rule.run({ files: [file], read: () => text }), []);
});
