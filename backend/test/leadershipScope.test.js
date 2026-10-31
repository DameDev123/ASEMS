import test from 'node:test';
import assert from 'node:assert/strict';
import { checkSameCollege } from './leadershipScope.js';

test('a dean may evaluate a department head of the same college', () => {
  assert.deepEqual(checkSameCollege({ evaluatorFacultyIds: [3], evaluateeFacultyIds: [3] }), { ok: true });
});

test('a dean may not evaluate a department head of another college', () => {
  const result = checkSameCollege({ evaluatorFacultyIds: [3], evaluateeFacultyIds: [4] });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'OUT_OF_SCOPE');
});

test('ids are compared as numbers, so "3" and 3 are the same college', () => {
  assert.equal(checkSameCollege({ evaluatorFacultyIds: ['3'], evaluateeFacultyIds: [3] }).ok, true);
});

test('a person who belongs to several colleges matches on any shared one', () => {
  assert.equal(checkSameCollege({ evaluatorFacultyIds: [3, 5], evaluateeFacultyIds: [5] }).ok, true);
  assert.equal(checkSameCollege({ evaluatorFacultyIds: [3, 5], evaluateeFacultyIds: [6] }).ok, false);
});

test('an unlinked dean or department head is refused, not guessed', () => {
  const noDean = checkSameCollege({ evaluatorFacultyIds: [], evaluateeFacultyIds: [3] });
  assert.equal(noDean.code, 'UNLINKED_PARTICIPANT');
  assert.match(noDean.message, /dean is not linked/);
  const noHead = checkSameCollege({ evaluatorFacultyIds: [3], evaluateeFacultyIds: [] });
  assert.equal(noHead.code, 'UNLINKED_PARTICIPANT');
  assert.match(noHead.message, /department head is not linked/);
  assert.equal(checkSameCollege().ok, false);
});