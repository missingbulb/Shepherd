import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isQueue, parkKind, labelGeneration, plainBucket, lanes, cuts } from '../../../skills/fleet-triage/classify.mjs';

// The skill's classification, pinned: which issue is queue-managed, what kind of park a
// label set is, which label generation wrote it, and the lane-duplication cut. These are
// the rules the report's counts rest on, so they are tested rather than eyeballed.

const row = (labels, title = 'x', repo = 'missingbulb/R', number = 1, updated_at = '2026-09-01T16:38:00Z') =>
  ({ repo, number, title, labels, updated_at });

test('queue membership: the title prefix, any task: label, or the retired marks', () => {
  assert.equal(isQueue(row([], '[claudinite-work] p/t')), true);
  assert.equal(isQueue(row(['task:origin:ad-hoc'])), true);
  assert.equal(isQueue(row(['needs-human'])), true);
  assert.equal(isQueue(row(['origin:schedule'])), true);
  assert.equal(isQueue(row(['quick-win'], 'Fix the thing')), false);
});

test('park kind reads both spellings and falls through to the non-park queue states', () => {
  assert.equal(parkKind(row(['task:status:needs-human-failure'])), 'failure');
  assert.equal(parkKind(row(['needs-human', 'task:needs-human-decision'])), 'decision');
  assert.equal(parkKind(row(['task:status:blocked'])), 'blocked');
  assert.equal(parkKind(row(['task:blocked'])), 'blocked');
  assert.equal(parkKind(row(['task:status:running-executor'])), 'running-executor');
  assert.equal(parkKind(row(['needs-human'])), 'bare-needs-human');
  assert.equal(parkKind(row([], '[claudinite-work] p/t')), 'no-status');
});

test('label generation: canon task:status:* wins over any retired mark beside it', () => {
  assert.equal(labelGeneration(row(['needs-human', 'task:status:needs-human-failure'])), 'canon');
  assert.equal(labelGeneration(row(['needs-human', 'task:needs-human-approval'])), 'retired');
  assert.equal(labelGeneration(row(['task:agent'])), 'retired');
  assert.equal(labelGeneration(row([], '[claudinite-work] p/t')), 'none');
});

test('plain buckets: the first matching label wins, then the two title families, then backlog', () => {
  assert.equal(plainBucket(row(['workflow-failure', 'needs-decision'])), 'workflow-failure');
  assert.equal(plainBucket(row([], '[claudinite-schedule] the schedule board')), 'schedule-board');
  assert.equal(plainBucket(row([], 'Claudinite tracker: Tidy Issues')), 'tidy-tracker');
  assert.equal(plainBucket(row([], 'Anything else')), 'unlabelled-backlog');
});

test('lanes: (repo, pack/task) groups, and only [claudinite-work] items form one', () => {
  const rows = [
    row(['task:status:needs-human-failure'], '[claudinite-work] g/extract', 'missingbulb/A', 1),
    row(['needs-human', 'task:needs-human-action'], '[claudinite-work] g/extract', 'missingbulb/A', 2),
    row(['task:status:needs-human-decision'], '[claudinite-work] g/extract', 'missingbulb/B', 3),
    row(['task:status:blocked', 'task:origin:ad-hoc'], 'Align local packs', 'missingbulb/A', 4),
  ];
  const l = lanes(rows);
  assert.equal(l.size, 2);
  assert.deepEqual(l.get('missingbulb/A\tg/extract').map((r) => r.number), [1, 2]);
  const c = cuts(rows);
  assert.equal(c.total, 4);
  assert.equal(c.queue.length, 4);
  assert.equal(c.duplicatedLanes.length, 1);
  assert.equal(c.redundant, 1);
});
