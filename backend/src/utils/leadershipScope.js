// Pure rule: may this dean evaluate this department head?
//
// A dean (or vice dean) evaluates department heads of their own college / school / institute only.
// A person's college comes from their employee record: employees.department_id ->
// departments.faculty_id. Both lists below hold the faculty ids found for one person (normally one).
//
// No database and no HTTP here, so the rule is unit-tested on its own; leadershipService runs the
// queries and throws the HTTP error this returns.
//
// The Academic Affairs VP -> dean pair has no rule here: the supplied schema has no campus or
// institution table that links a VP to deans, so there is nothing real to compare.

export function checkSameCollege({ evaluatorFacultyIds = [], evaluateeFacultyIds = [] } = {}) {
  if (!evaluatorFacultyIds.length) {
    return {
      ok: false,
      code: 'UNLINKED_PARTICIPANT',
      message: 'The dean is not linked to a department, so their college cannot be verified.',
    };
  }
  if (!evaluateeFacultyIds.length) {
    return {
      ok: false,
      code: 'UNLINKED_PARTICIPANT',
      message: 'The department head is not linked to a department, so their college cannot be verified.',
    };
  }
  const evaluatorColleges = new Set(evaluatorFacultyIds.map(Number));
  if (!evaluateeFacultyIds.some((id) => evaluatorColleges.has(Number(id)))) {
    return {
      ok: false,
      code: 'OUT_OF_SCOPE',
      message: 'A dean can only evaluate department heads of their own college.',
    };
  }
  return { ok: true };
}