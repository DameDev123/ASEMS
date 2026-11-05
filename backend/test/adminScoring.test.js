import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_SCORES, buildSummary, levelFor, parseScore, validateLevels,
} from '../src/utils/adminScoring.js';

const LEVELS = [
  { name: 'Low', minScore: 0 },
  { name: 'Medium', minScore: 50 },
  { name: 'High', minScore: 75 },
];

test('parseScore enforces range, decimals and blanks', () => {
  assert.equal(parseScore('62.5', MAX_SCORES.plan, 'Plan'), 62.5);
  assert.equal(parseScore('', MAX_SCORES.self, 'Self'), null);
  assert.equal(parseScore(0, MAX_SCORES.self, 'Self'), 0);
  assert.throws(() => parseScore(71, MAX_SCORES.plan, 'Plan'), RangeError);
  assert.throws(() => parseScore(-1, MAX_SCORES.team, 'Team'), RangeError);
  assert.throws(() => parseScore('abc', MAX_SCORES.team, 'Team'), RangeError);
  assert.throws(() => parseScore('4.123', MAX_SCORES.self, 'Self'), RangeError);
  assert.throws(() => parseScore('5.01', MAX_SCORES.self, 'Self'), RangeError);
});

test('levels: must start at 0, be unique and are matched by lower bound', () => {
  assert.throws(() => validateLevels([{ name: 'A', minScore: 10 }]), /start at 0/);
  assert.throws(() => validateLevels([{ name: 'A', minScore: 0 }, { name: 'B', minScore: 0 }]), /same score/);
  assert.throws(() => validateLevels([{ name: 'A', minScore: 0 }, { name: 'a', minScore: 5 }]), /unique/);
  assert.throws(() => validateLevels([]), RangeError);

  const ok = validateLevels([{ name: 'High', minScore: 75 }, { name: 'Low', minScore: 0 }]);
  assert.deepEqual(ok.map((l) => l.name), ['Low', 'High']);

  assert.equal(levelFor(0, LEVELS), 'Low');
  assert.equal(levelFor(49.99, LEVELS), 'Low');
  assert.equal(levelFor(50, LEVELS), 'Medium');
  assert.equal(levelFor(74.5, LEVELS), 'Medium');
  assert.equal(levelFor(100, LEVELS), 'High');
  assert.equal(levelFor(80, []), null);
  assert.equal(levelFor(null, LEVELS), null);
});

test('summary: consolidated plan is the average of quarter plan scores', () => {
  const s = buildSummary(
    {
      selfScore: 4, teamScore: 12, supervisorScore: 8,
      quarters: [
        { seq: 2, label: 'Q2', plan_score: '60.00', behavioral_score: '25.00' },
        { seq: 1, label: 'Q1', plan_score: '50.00', behavioral_score: '20.00' },
      ],
    },
    LEVELS,
  );
  assert.deepEqual(s.quarters.map((q) => q.label), ['Q1', 'Q2']);
  assert.equal(s.quarters[0].total, 70);
  assert.equal(s.quarters[0].level, 'Medium');
  assert.equal(s.quarters[1].total, 85);
  assert.equal(s.quarters[1].level, 'High');
  assert.equal(s.consolidated.plan, 55);
  assert.equal(s.consolidated.behavioral, 24);
  assert.equal(s.consolidated.total, 79);
  assert.equal(s.consolidated.level, 'High');
  assert.equal(s.complete, true);
  assert.deepEqual(s.missing, []);
});

test('summary: missing parts give null totals and list what is missing', () => {
  const s = buildSummary({ selfScore: 3, teamScore: null, supervisorScore: null, quarters: [] }, LEVELS);
  assert.equal(s.consolidated.plan, null);
  assert.equal(s.consolidated.behavioral, null);
  assert.equal(s.consolidated.total, null);
  assert.equal(s.consolidated.level, null);
  assert.equal(s.complete, false);
  assert.equal(s.missing.length, 3);
});

test('summary: maximum scores total exactly 100 and no levels means no level name', () => {
  const s = buildSummary(
    { selfScore: 5, teamScore: 15, supervisorScore: 10, quarters: [{ seq: 1, label: 'Q1', plan_score: 70, behavioral_score: 30 }] },
    [],
  );
  assert.equal(s.consolidated.total, 100);
  assert.equal(s.consolidated.level, null);
  assert.equal(s.quarters[0].total, 100);
});