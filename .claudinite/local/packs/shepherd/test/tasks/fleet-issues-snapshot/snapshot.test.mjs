import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inScope, shapeIssue, renderSnapshot, withoutStamp } from '../../../tasks/fleet-issues-snapshot/snapshot.mjs';

// The pure half of the snapshot: who is in the roster, what one issue row carries, and
// that two renders of the same fleet differ only in their stamp. The I/O half is one
// enumeration plus one paged issues read per repo over fleet-api primitives.

const exclude = new Set(['missingbulb/empty']);

test('scope: archived repos, forks and excluded repos are out; everything else is in', () => {
  assert.equal(inScope({ full_name: 'missingbulb/A' }, { exclude }), true);
  assert.equal(inScope({ full_name: 'missingbulb/A', archived: true }, { exclude }), false);
  assert.equal(inScope({ full_name: 'missingbulb/A', fork: true }, { exclude }), false);
  // exclude is matched case-insensitively — the config lowercases, the API does not
  assert.equal(inScope({ full_name: 'missingbulb/Empty' }, { exclude }), false);
});

test('a pull request is not an issue, even though the issues endpoint lists it', () => {
  assert.equal(shapeIssue({ number: 1, title: 't', labels: [], pull_request: { url: 'x' } }), null);
});

test('an issue row carries exactly the fields triage reads, labels as plain names', () => {
  const row = shapeIssue({
    number: 7, title: 'T', labels: [{ name: 'quick-win' }, { name: 'task:status:blocked' }],
    created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-02T00:00:00Z', comments: 3, body: 'dropped', user: { login: 'x' },
  });
  assert.deepEqual(row, {
    number: 7, title: 'T', labels: ['quick-win', 'task:status:blocked'],
    created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-02T00:00:00Z', comments: 3,
  });
});

test('the render is deterministic: repos by name, issues by number descending, stamp the only moving line', () => {
  const repos = [
    { repo: 'missingbulb/Z', issues: [{ number: 1, title: 'a', labels: [], created_at: '', updated_at: '', comments: 0 }, { number: 3, title: 'b', labels: [], created_at: '', updated_at: '', comments: 0 }] },
    { repo: 'missingbulb/A', issues: [] },
  ];
  const one = renderSnapshot({ generated: '2026-09-02T10:00:00Z', owner: 'missingbulb', repos, skipped: [{ repo: 'missingbulb/S', why: 'archived' }] });
  const two = renderSnapshot({ generated: '2026-09-03T10:00:00Z', owner: 'missingbulb', repos: [...repos].reverse(), skipped: [{ repo: 'missingbulb/S', why: 'archived' }] });
  assert.notEqual(one, two);
  assert.equal(withoutStamp(one), withoutStamp(two));
  const parsed = JSON.parse(one);
  assert.deepEqual(parsed.repos.map((r) => r.repo), ['missingbulb/A', 'missingbulb/Z']);
  assert.deepEqual(parsed.repos[1].issues.map((i) => i.number), [3, 1]);
  assert.equal(parsed.repos[1].openIssues, 2);
  assert.equal(parsed.total, 2);
  assert.ok(one.endsWith('\n'));
});
