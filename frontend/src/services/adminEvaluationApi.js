import { apiRequest } from './api.js';

const root = '/admin-evaluations';

/**
 * The backend response format is:
 * {
 *   success: true,
 *   data: ...
 * }
 *
 * Return the data property to keep the page components simple.
 */
const data = (promise) =>
  promise.then((response) => response?.data ?? {});

export const adminEvaluationApi = {
  // ============================================
  // EVALUATION PERIODS
  // ============================================

  periods: () =>
    data(apiRequest(`${root}/periods`)),

  createPeriod: (body) =>
    data(
      apiRequest(`${root}/periods`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    ),

  setPeriodStatus: (id, status) =>
    data(
      apiRequest(`${root}/periods/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    ),

  // ============================================
  // PERFORMANCE LEVELS
  // ============================================

  levels: () =>
    data(apiRequest(`${root}/levels`)),

  saveLevels: (levels) =>
    data(
      apiRequest(`${root}/levels`, {
        method: 'PUT',
        body: JSON.stringify({ levels }),
      }),
    ),

  // ============================================
  // EMPLOYEE ASSIGNMENTS
  // ============================================

  assign: (periodId, assignments) =>
    data(
      apiRequest(`${root}/assignments`, {
        method: 'POST',
        body: JSON.stringify({
          periodId,
          assignments,
        }),
      }),
    ),

  // Administrative employees and supervisors available for assignment.
  candidates: () =>
    data(apiRequest(`${root}/candidates`)),

  // ============================================
  // ADMINISTRATOR EVALUATION LIST
  // ============================================

  all: (periodId) => {
    const query = periodId
      ? `?periodId=${encodeURIComponent(periodId)}`
      : '';

    return data(
      apiRequest(`${root}/all${query}`),
    );
  },

  // ============================================
  // EMPLOYEE / SUPERVISOR EVALUATIONS
  // ============================================

  mine: () =>
    data(apiRequest(`${root}/mine`)),

  get: (id) =>
    data(apiRequest(`${root}/${id}`)),

  // ============================================
  // EMPLOYEE SELF-ASSESSMENT
  // ============================================

  saveSelf: (id, selfScore) =>
    data(
      apiRequest(`${root}/${id}/self`, {
        method: 'PUT',
        body: JSON.stringify({ selfScore }),
      }),
    ),

  // The employee submits the self-assessment once; it is then locked.
  submitSelf: (id, selfScore) =>
    data(
      apiRequest(`${root}/${id}/self/submit`, {
        method: 'POST',
        body: JSON.stringify({ selfScore }),
      }),
    ),

  // ============================================
  // TEAM ASSESSMENT (each team member fills only their own)
  // ============================================

  // Administrator: replace the list of team assessors.
  setTeam: (id, evaluatorUserIds) =>
    data(
      apiRequest(`${root}/${id}/team`, {
        method: 'PUT',
        body: JSON.stringify({ evaluatorUserIds }),
      }),
    ),

  saveTeamAssessment: (id, body) =>
    data(
      apiRequest(`${root}/${id}/team-assessment`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    ),

  submitTeamAssessment: (id, body) =>
    data(
      apiRequest(`${root}/${id}/team-assessment/submit`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    ),

  // ============================================
  // REPORTS (administrator)
  // ============================================

  report: (periodId) =>
    data(
      apiRequest(`${root}/reports/summary?periodId=${encodeURIComponent(periodId)}`),
    ),

  // ============================================
  // SUPERVISOR EVALUATION
  // ============================================

  saveSupervisor: (id, body) =>
    data(
      apiRequest(`${root}/${id}/supervisor`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    ),

  // ============================================
  // SUBMIT EVALUATION
  // ============================================

  submit: (id) =>
    data(
      apiRequest(`${root}/${id}/submit`, {
        method: 'POST',
      }),
    ),

  // ============================================
  // EMPLOYEE AGREEMENT / DISAGREEMENT
  // ============================================

  respond: (id, body) =>
    data(
      apiRequest(`${root}/${id}/response`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    ),
};