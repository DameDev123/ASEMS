// Number of report copies the Academic Affairs VP office must record (teacher, department, college).
const REQUIRED_COPIES = 3;

export function deriveReportStage({ status, allApproved = false, endorsed = false,
                                    forwardedToVp = false, copiesRecorded = 0 } = {}) {
  if (status === 'archived') return 'archived';
  if (forwardedToVp) return copiesRecorded >= REQUIRED_COPIES ? 'archive' : 'vp_office';
  if (status === 'reviewed') return 'college';
  if (!allApproved) return 'evaluations';
  return endorsed ? 'department_head' : 'committee';
}