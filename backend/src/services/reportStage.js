// Pure function: where a Form E report currently is in the confirmed approval order
//
//   Committee -> Department Head -> College -> VP's Office
//
// followed by the archive step that the VP office's third recorded copy triggers.
// No database, no HTTP. The routes enforce the order; this only names the stage.
//
//   evaluations      not every required evaluation is approved yet (no report stage has started)
//   committee        evaluations approved; waiting for the committee's endorsement
//   department_head  endorsed by the committee; waiting for the department head to finalize
//   college          finalized; waiting for the college administration to forward it to the VP office
//   vp_office        forwarded; waiting for the VP office to record the three copies
//   archive          copies recorded; waiting for the archive levels
//   archived         archived at every level

export const REPORT_STAGES = Object.freeze([
  'evaluations',
  'committee',
  'department_head',
  'college',
  'vp_office',
  'archive',
  'archived',
]);

export const REQUIRED_COPIES = 3;

/**
 * @param {object} input
 * @param {string} input.status           evaluation_summaries.status
 * @param {boolean} input.allApproved     every required evaluation is approved
 * @param {boolean} input.endorsed        the committee has endorsed this summary
 * @param {boolean} input.forwardedToVp   the college has forwarded it to the VP office
 * @param {number} [input.copiesRecorded] report copies the VP office has recorded
 */
export function deriveReportStage({
  status,
  allApproved = false,
  endorsed = false,
  forwardedToVp = false,
  copiesRecorded = 0,
} = {}) {
  if (status === 'archived') return 'archived';
  if (forwardedToVp) return copiesRecorded >= REQUIRED_COPIES ? 'archive' : 'vp_office';
  // A finalized summary is past the committee stage even if it was finalized before the
  // committee endorsement was recorded (older data keeps working).
  if (status === 'reviewed') return 'college';
  if (!allApproved) return 'evaluations';
  return endorsed ? 'department_head' : 'committee';
}