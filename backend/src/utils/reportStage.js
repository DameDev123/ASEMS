export function deriveReportStage({ status, allApproved = false, endorsed = false,
                                    forwardedToVp = false, copiesRecorded = 0 } = {}) {
  if (status === 'archived') return 'archived';
  if (forwardedToVp) return copiesRecorded >= REQUIRED_COPIES ? 'archive' : 'vp_office';
  if (status === 'reviewed') return 'college';
  if (!allApproved) return 'evaluations';
  return endorsed ? 'department_head' : 'committee';
}