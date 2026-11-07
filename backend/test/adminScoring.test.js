import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_SCORES, MAX_TEAM_MEMBERS, averageTeamScore, buildSummary, levelFor, parseScore,
  readiness, stageOf, validateLevels,
} from './adminScoring.js';

const LEVELS = [
  { name: 'Low', minScore: 0 },
  { name: 'Mid', minScore: 60 },
  { name: 'High', minScore: 90 },
];

test('parseScore: blank is null, valid values are rounded numbers', () => {
  assert.equal(parseScore('', 70, 'Plan'), null);
  assert.equal(parseScore(null, 70, 'Plan'), null);
  assert.equal(parseScore('65.5', 70, 'Plan'), 65.5);
  assert.equal(parseScore(0, 5, 'Self'), 0);
});

test('parseScore: rejects out-of-range, non-numeric and >2 decimals', () => {
  assert.throws(() => parseScore(71, MAX_SCORES.plan, 'Plan'), RangeError);
  assert.throws(() => parseScore(-1, MAX_SCORES.self, 'Self'), RangeError);
  assert.throws(() => parseScore('abc', MAX_SCORES.team, 'Team'), RangeError);
  assert.throws(() => parseScore(1.234, MAX_SCORES.team, 'Team'), RangeError);
});

test('maximum scores add up to 100', () => {
  assert.equal(MAX_SCORES.plan + MAX_SCORES.self + MAX_SCORES.team + MAX_SCORES.supervisor, 100);
  assert.equal(MAX_SCORES.behavioral, MAX_SCORES.self + MAX_SCORES.team + MAX_SCORES.supervisor);
});

test('levelFor picks the highest band at or below the score', () => {
  assert.equal(levelFor(0, LEVELS), 'Low');
  assert.equal(levelFor(59.99, LEVELS), 'Low');
  assert.equal(levelFor(60, LEVELS), 'Mid');
  assert.equal(levelFor(100, LEVELS), 'High');
  assert.equal(levelFor(null, LEVELS), null);
  assert.equal(levelFor(80, []), null);
});

test('validateLevels: must start at 0, unique names and scores', () => {
  assert.deepEqual(validateLevels([{ name: 'B', minScore: 50 }, { name: 'A', minScore: 0 }]).map((l) => l.name), ['A', 'B']);
  assert.throws(() => validateLevels([{ name: 'A', minScore: 10 }]), RangeError);
  assert.throws(() => validateLevels([{ name: 'A', minScore: 0 }, { name: 'a', minScore: 50 }]), RangeError);
  assert.throws(() => validateLevels([{ name: 'A', minScore: 0 }, { name: 'B', minScore: 0 }]), RangeError);
  assert.throws(() => validateLevels([]), RangeError);
});

test('buildSummary: planned 70 + behavioral 30 (self 5 + team 15 + supervisor 10) = total 100', () => {
  const s = buildSummary({
    selfScore: 4, teamScore: 12, supervisorScore: 8,
    quarters: [
      { seq: 1, label: 'Q1', planScore: 60 },
      { seq: 2, label: 'Q2', planScore: 70 },
    ],
  }, LEVELS);
  assert.equal(s.consolidated.plan, 65);        // average of 60 and 70
  assert.equal(s.consolidated.behavioral, 24);  // 4 + 12 + 8
  assert.equal(s.consolidated.total, 89);
  assert.equal(s.consolidated.level, 'Mid');
  assert.equal(s.complete, true);
  assert.deepEqual(s.missing, []);
});

test('buildSummary: a perfect evaluation totals exactly 100', () => {
  const s = buildSummary({
    selfScore: 5, teamScore: 15, supervisorScore: 10,
    quarters: [{ seq: 1, planScore: 70 }, { seq: 2, planScore: 70 }],
  }, LEVELS);
  assert.equal(s.consolidated.total, 100);
  assert.equal(s.consolidated.behavioral, 30);
});

test('buildSummary: per-quarter behavioral values are ignored (behavioral is derived)', () => {
  const s = buildSummary({
    selfScore: 5, teamScore: 15, supervisorScore: 10,
    quarters: [{ seq: 1, planScore: 50, behavioralScore: 30 }],
  }, LEVELS);
  assert.equal(s.quarters[0].behavioral, null);
  assert.equal(s.quarters[0].total, null);
  assert.equal(s.consolidated.total, 80);
});

test('buildSummary: reports exactly what is missing', () => {
  const s = buildSummary({ selfScore: null, teamScore: 10, supervisorScore: null, quarters: [] }, LEVELS);
  assert.equal(s.complete, false);
  assert.equal(s.consolidated.total, null);
  assert.deepEqual(s.missing, [
    'at least one quarter with a plan score',
    'self-assessment',
    'supervisor score',
  ]);
});

test('buildSummary: quarters are sorted', () => {
  const s = buildSummary({
    selfScore: 5, teamScore: 15, supervisorScore: 10,
    quarters: [{ seq: 2, label: 'Q2', planScore: 50 }, { seq: 1, label: 'Q1', planScore: 70 }],
  }, LEVELS);
  assert.deepEqual(s.quarters.map((q) => q.seq), [1, 2]);
  assert.equal(s.consolidated.plan, 60);
  assert.equal(s.consolidated.total, 90);
  assert.equal(s.consolidated.level, 'High');
});

test('averageTeamScore: mean of the individual assessments, null when none', () => {
  assert.equal(averageTeamScore([12, 9]), 10.5);
  assert.equal(averageTeamScore(['15.00', '10.00', '10.00']), 11.67);
  assert.equal(averageTeamScore([]), null);
  assert.equal(averageTeamScore([null, '']), null);
  assert.ok(averageTeamScore([15, 15, 15]) <= MAX_SCORES.team);
  assert.equal(MAX_TEAM_MEMBERS, 15);
});

const READY = { selfSubmitted: true, teamAssigned: 2, teamSubmitted: 2, planCount: 2, supervisorScore: 8, strengths: 'a', gaps: 'b' };

test('readiness: ready only when every role has done its part', () => {
  assert.deepEqual(readiness(READY), { ready: true, missing: [] });
  assert.match(readiness({ ...READY, selfSubmitted: false }).missing[0], /self-assessment/);
  assert.match(readiness({ ...READY, teamAssigned: 0, teamSubmitted: 0 }).missing[0], /team assessor/);
  assert.match(readiness({ ...READY, teamSubmitted: 1 }).missing[0], /1 of 2/);
  assert.match(readiness({ ...READY, planCount: 0 }).missing[0], /plan score/);
  assert.match(readiness({ ...READY, supervisorScore: null }).missing[0], /supervisor score/);
  assert.match(readiness({ ...READY, strengths: null }).missing[0], /strengths/);
  assert.match(readiness({ ...READY, gaps: '' }).missing[0], /gaps/);
  assert.equal(readiness({ ...READY, supervisorScore: 0 }).ready, true);   // 0 is a valid score
});

test('stageOf: refines draft, passes other statuses through', () => {
  const base = { status: 'draft', selfSubmitted: true, teamAssigned: 2, teamSubmitted: 2 };
  assert.equal(stageOf({ ...base, teamAssigned: 0, teamSubmitted: 0 }), 'needs_team');
  assert.equal(stageOf({ ...base, teamSubmitted: 1 }), 'collecting');
  assert.equal(stageOf({ ...base, selfSubmitted: false }), 'collecting');
  assert.equal(stageOf(base), 'ready_for_supervisor');
  for (const status of ['submitted', 'agreed', 'disputed']) assert.equal(stageOf({ ...base, status }), status);
});