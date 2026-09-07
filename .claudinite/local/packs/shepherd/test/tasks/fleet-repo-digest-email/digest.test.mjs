import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  REPOS_PER_DIGEST, dayNumber, chooseRepos, digestFor, subjectFor, htmlBody, textBody,
  isMaintenance,
} from '../../../tasks/fleet-repo-digest-email/digest.mjs';

// The digest's pure half: the rotation's promises (three different repos, whole-fleet
// coverage, stable within a night) and that a hostile issue title cannot escape the
// HTML. The I/O half is one file read and one sendEmail call, covered in send.test.mjs
// for the client's own contract; nothing here reaches the network.

const roster = (n) => Array.from({ length: n }, (_, i) => `missingbulb/r${String(i).padStart(2, '0')}`);

test('the day number is the UTC date, so every hour of one night picks the same three', () => {
  const early = dayNumber(new Date('2026-09-07T03:59:00Z'));
  const late = dayNumber(new Date('2026-09-07T23:01:00Z'));
  assert.equal(early, late);
  assert.equal(dayNumber(new Date('2026-09-08T00:00:00Z')), early + 1);
});

test('three different repos, and the same three for the same day', () => {
  const names = roster(17);
  const today = chooseRepos(names, 20_338);
  assert.equal(today.length, REPOS_PER_DIGEST);
  assert.equal(new Set(today).size, REPOS_PER_DIGEST);
  assert.deepEqual(chooseRepos([...names].reverse(), 20_338), today, 'the roster is sorted, not taken as given');
});

test('every repo comes round before any repeats', () => {
  for (const n of [4, 5, 9, 17, 18, 100]) {
    const names = roster(n);
    const seen = new Set();
    for (let day = 0; day < Math.ceil(n / REPOS_PER_DIGEST); day += 1) {
      for (const name of chooseRepos(names, day)) seen.add(name);
    }
    assert.equal(seen.size, n, `a fleet of ${n} was not covered in ceil(n/3) days`);
  }
});

test('a fleet of three or fewer sends all of it, without repeating a repo in one mail', () => {
  assert.deepEqual(chooseRepos(roster(2), 7), ['missingbulb/r00', 'missingbulb/r01']);
  assert.deepEqual(chooseRepos([], 7), []);
});

test('a negative day number still lands inside the roster', () => {
  // Date.UTC is signed, so a clock set before 1970 must not index off the front.
  const picked = chooseRepos(roster(17), -5);
  assert.equal(picked.length, REPOS_PER_DIGEST);
  for (const name of picked) assert.ok(name, 'an out-of-range index produced an undefined repo');
});

const snapshot = {
  generated: '2026-09-07T04:00:00Z',
  repos: [
    { repo: 'missingbulb/A', openIssues: 2, issues: [{ number: 9, title: 'nine' }, { number: 8, title: 'eight' }] },
    { repo: 'missingbulb/B', openIssues: 0, issues: [] },
    { repo: 'missingbulb/C', openIssues: 9, issues: Array.from({ length: 9 }, (_, i) => ({ number: i, title: `t${i}` })) },
  ],
};

test('an entry carries the repo, its link, its own open count and at most five titles', () => {
  const entries = digestFor(snapshot, 0);
  assert.deepEqual(entries.map((e) => e.repo), ['missingbulb/A', 'missingbulb/B', 'missingbulb/C']);
  assert.equal(entries[0].url, 'https://github.com/missingbulb/A');
  assert.equal(entries[2].openIssues, 9);
  assert.equal(entries[2].top.length, 5, 'the digest is a nudge, not the backlog');
});

test('a queue item is recognized as maintenance, and an ordinary issue is not', () => {
  assert.equal(isMaintenance({ title: '[claudinite-work] shepherd/fleet-issues-snapshot' }), true);
  assert.equal(isMaintenance({ title: '[claudinite-task] shepherd/fleet-issues-snapshot 2026-09-07' }), true);
  assert.equal(isMaintenance({ title: 'Mail me three fleet repos every morning' }), false);
  assert.equal(isMaintenance({ title: 'A claudinite-work item, described' }), false);
  assert.equal(isMaintenance({}), false);
});

test('the queue\'s own items are counted, never shown as one of the five', () => {
  const busy = {
    generated: '',
    repos: [{
      repo: 'missingbulb/A',
      openIssues: 7,
      issues: [
        ...Array.from({ length: 5 }, (_, i) => ({ number: 100 + i, title: `[claudinite-work] p/t${i}` })),
        { number: 2, title: 'a real one' },
        { number: 1, title: 'another real one' },
      ],
    }],
  };
  const [entry] = digestFor(busy, 0);
  assert.deepEqual(entry.top.map((i) => i.title), ['a real one', 'another real one']);
  assert.equal(entry.maintenance, 5);
  assert.equal(entry.openIssues, 7, 'the repo\'s own total is untouched by the split');
  const text = textBody([entry], { generated: '' });
  assert.ok(text.includes('7 open issues, 5 of them the queue\'s own'));
  assert.ok(!text.includes('[claudinite-work]'), 'a queue item reached the mail as a title');
});

test('a repo whose only open issues are the queue\'s says so, rather than reading as empty', () => {
  const [entry] = digestFor({
    generated: '',
    repos: [{ repo: 'missingbulb/A', openIssues: 1, issues: [{ number: 1, title: '[claudinite-work] p/t' }] }],
  }, 0);
  assert.equal(entry.top.length, 0);
  assert.match(textBody([entry], { generated: '' }), /Nothing open but the queue's own items\./);
});

test('a repo with no issue rows reads as zero, and a snapshot with no repos yields nothing', () => {
  assert.equal(digestFor(snapshot, 0)[1].openIssues, 0);
  const noCount = digestFor({ generated: '', repos: [{ repo: 'missingbulb/A' }] }, 0);
  assert.equal(noCount[0].openIssues, 0, 'an entry with no issues at all is a real zero');
  assert.deepEqual(digestFor({ generated: '', repos: [] }, 0), []);
});

test('a title carrying HTML is escaped, not rendered', () => {
  const hostile = {
    generated: '2026-09-07T04:00:00Z',
    repos: [{ repo: 'missingbulb/A', openIssues: 1, issues: [{ number: 1, title: '<script>alert("x")</script> & <b>' }] }],
  };
  const html = htmlBody(digestFor(hostile, 0), { generated: hostile.generated });
  assert.ok(!html.includes('<script>'), 'an issue title reached the mail as markup');
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('&amp;'));
});

test('the text alternative carries the same repos and links as the HTML', () => {
  const entries = digestFor(snapshot, 0);
  const text = textBody(entries, { generated: snapshot.generated });
  for (const e of entries) {
    assert.ok(text.includes(e.repo));
    assert.ok(text.includes(e.url));
  }
  assert.ok(text.includes('No open issues.'), 'a repo with nothing open still appears');
});

test('the subject names the date and the three repos', () => {
  const subject = subjectFor(digestFor(snapshot, 0), new Date('2026-09-07T04:00:00Z'));
  assert.equal(subject, 'Fleet digest 2026-09-07: A, B, C');
});
