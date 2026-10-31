import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveReportStage, REPORT_STAGES } from './reportStage.js';

test('no report stage starts until every evaluation is approved', () => {
  assert.equal(deriveReportStage({ status: 'incomplete' }), 'evaluations');
  assert.equal(deriveReportStage({ status: 'complete', allApproved: false }), 'evaluations');
  // An endorsement cannot move a report forward while evaluations are unapproved.
  assert.equal(deriveReportStage({ status: 'complete', allApproved: false, endorsed: true }), 'evaluations');
});

test('approved evaluations wait for the committee, then the department head', () => {
  assert.equal(deriveReportStage({ status: 'complete', allApproved: true }), 'committee');
  assert.equal(deriveReportStage({ status: 'complete', allApproved: true, endorsed: true }), 'department_head');
});

test('finalizing hands the report to the college', () => {
  assert.equal(deriveReportStage({ status: 'reviewed', allApproved: true, endorsed: true }), 'college');
});

test('a summary finalized before endorsements were recorded is still past the committee stage', () => {
  assert.equal(deriveReportStage({ status: 'reviewed', allApproved: true, endorsed: false }), 'college');
});

test('forwarding hands the report to the VP office until all three copies are recorded', () => {
  const base = { status: 'reviewed', allApproved: true, endorsed: true, forwardedToVp: true };
  assert.equal(deriveReportStage(base), 'vp_office');
  assert.equal(deriveReportStage({ ...base, copiesRecorded: 2 }), 'vp_office');
  assert.equal(deriveReportStage({ ...base, copiesRecorded: 3 }), 'archive');
});

test('an archived summary is archived', () => {
  assert.equal(deriveReportStage({ status: 'archived', forwardedToVp: true, copiesRecorded: 3 }), 'archived');
});

test('every derived stage is a known stage', () => {
  for (const status of ['incomplete', 'complete', 'reviewed', 'archived']) {
    for (const allApproved of [false, true]) {
      for (const endorsed of [false, true]) {
        for (const forwardedToVp of [false, true]) {
          for (const copiesRecorded of [0, 3]) {
            assert.ok(REPORT_STAGES.includes(deriveReportStage({ status, allApproved, endorsed, forwardedToVp, copiesRecorded })));
          }
        }
      }
    }
  }
});