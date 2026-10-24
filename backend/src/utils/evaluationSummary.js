// Central scoring service for the Ambo Academic Staff Evaluation (Forms A-E).
//
// Pure functions only: no database, no HTTP. Routes load the rows, call these
// functions, and store or return the result. Every number shown on Form E,
// the dashboard, approval checks and reports must come from here.
//
// Rules taken from the official documents (documented):
//   - Weights: students 40, department head 35, peers 15, self 10 (total 100).
//   - Scale: 5, 4, 3, 2, 1, 0 or NA. Zero is a real score. NA is not zero.
//
// Rules NOT in the documents (provisional, isolated in SCORING_CONFIG below):
//   - How NA affects the average (default: NA is left out of the denominator).
//   - Every criterion carries equal weight inside its evaluator group.
//   - Several evaluators of one group (e.g. students) count equally.

export const EVALUATOR_TYPES = Object.freeze(['student', 'department_head', 'peer', 'self']);

export const OFFICIAL_WEIGHTS = Object.freeze({
  student: 40,
  department_head: 35,
  peer: 15,
  self: 10,
});

export const SCORING_CONFIG = Object.freeze({
  scaleMin: 0,
  scaleMax: 5,
  allowNa: true,
  // PROVISIONAL, needs institutional confirmation: 'exclude' | 'zero'
  naPolicy: 'exclude',
  // Evaluation statuses that may count toward a result. A status that is
  // undefined is treated as counted (used by pure callers and tests).
  countedStatuses: Object.freeze(['submitted', 'approved']),
  decimals: 3,
});

// Form E categories that have no matching heading in the official Form D text.
export const UNCONFIRMED_CATEGORIES = Object.freeze({
  self: Object.freeze(['noninstructional']),
});

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

/** Controlled rounding (half up) that ignores binary floating-point noise. */
export function roundTo(value, decimals = SCORING_CONFIG.decimals) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const cleaned = Number(value).toFixed(10);
  const shifted = Math.round(Number(`${cleaned}e${decimals}`));
  return Number(`${shifted}e-${decimals}`);
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Split `targetTotal` across `values` at `decimals` places so that the rounded
 * parts add up exactly to the rounded total (largest-remainder method).
 */
function allocateToTotal(values, targetTotal, decimals) {
  if (!values.length) return [];
  const factor = 10 ** decimals;
  const targetUnits = Math.round(Number(targetTotal.toFixed(10)) * factor);
  const raw = values.map((value) => Number(value.toFixed(10)) * factor);
  const result = raw.map((value) => Math.floor(value + 1e-9));
  let remaining = targetUnits - result.reduce((sum, value) => sum + value, 0);

  const byRemainder = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value + 1e-9) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  for (let step = 0; remaining > 0; step += 1, remaining -= 1) {
    result[byRemainder[step % byRemainder.length].index] += 1;
  }
  for (let step = byRemainder.length - 1; remaining < 0 && step >= 0; step -= 1) {
    const { index } = byRemainder[step];
    if (result[index] > 0) { result[index] -= 1; remaining += 1; }
  }
  return result.map((units) => units / factor);
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

/** Returns null when the value is a valid rating, otherwise a message. */
export function scoreValueProblem(value, options = {}) {
  const { scaleMin, scaleMax, allowNa } = { ...SCORING_CONFIG, ...options };
  if (value === 'NA') return allowNa ? null : 'NA is not allowed on this form.';
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return 'A rating must be a whole number or "NA".';
  }
  if (value < scaleMin || value > scaleMax) {
    return `A rating must be between ${scaleMin} and ${scaleMax}.`;
  }
  return null;
}

/** Convert an evaluation_scores row ({criterion_id, score, is_na}) to a response. */
export function responseFromDbRow(row) {
  const isNa = Number(row.is_na) === 1;
  let score;
  if (isNa) score = 'NA';
  else if (row.score !== null && row.score !== undefined) score = Number(row.score);
  return { criterionId: Number(row.criterion_id), score };
}

export function validateWeights(weights = OFFICIAL_WEIGHTS) {
  const issues = [];
  let sum = 0;
  for (const type of EVALUATOR_TYPES) {
    const weight = weights?.[type];
    if (typeof weight !== 'number' || !Number.isFinite(weight)) {
      issues.push({ code: 'WEIGHT_MISSING', type, message: `No weight is set for ${type}.` });
      continue;
    }
    if (weight < 0 || weight > 100) {
      issues.push({ code: 'WEIGHT_RANGE', type, message: `The weight for ${type} must be between 0 and 100.` });
    }
    sum += weight;
  }
  if (!issues.length && roundTo(sum, 6) !== 100) {
    issues.push({ code: 'WEIGHT_SUM', message: `The four evaluator weights add up to ${roundTo(sum, 6)}, not 100.` });
  }
  return { valid: issues.length === 0, issues };
}

/**
 * Check one evaluator's responses against the criteria of the form version.
 * criteria: [{ id, sectionKey, sectionTitle }]  responses: [{ criterionId, score }]
 */
export function validateResponses(responses, criteria, options = {}) {
  const config = { ...SCORING_CONFIG, ...options };
  const issues = [];
  if (!Array.isArray(responses) || !Array.isArray(criteria)) {
    return { valid: false, issues: [{ code: 'MALFORMED', message: 'Responses and criteria must be arrays.' }] };
  }
  const known = new Set(criteria.map((criterion) => Number(criterion.id)));
  const seen = new Set();

  for (const response of responses) {
    const id = Number(response?.criterionId);
    if (!response || !Number.isSafeInteger(id)) {
      issues.push({ code: 'MALFORMED', message: 'Every response needs a numeric criterionId.' });
      continue;
    }
    if (!known.has(id)) {
      issues.push({ code: 'UNKNOWN_CRITERION', criterionId: id, message: `Criterion ${id} is not part of this form.` });
      continue;
    }
    if (seen.has(id)) {
      issues.push({ code: 'DUPLICATE_CRITERION', criterionId: id, message: `Criterion ${id} has more than one response.` });
      continue;
    }
    seen.add(id);
    const problem = scoreValueProblem(response.score, config);
    if (problem) issues.push({ code: 'INVALID_SCORE', criterionId: id, message: problem });
  }

  for (const criterion of criteria) {
    if (!seen.has(Number(criterion.id))) {
      issues.push({ code: 'MISSING_RESPONSE', criterionId: Number(criterion.id), message: `Criterion ${criterion.id} has no response.` });
    }
  }
  return { valid: issues.length === 0, issues };
}

/* ------------------------------------------------------------------ */
/* One evaluation                                                      */
/* ------------------------------------------------------------------ */

/**
 * Score a single submitted evaluation. Never throws; check `ok` and `issues`.
 * Returns category sums/averages and the overall average (out of scaleMax).
 */
export function scoreEvaluation(responses, criteria, options = {}) {
  const config = { ...SCORING_CONFIG, ...options };
  const validation = validateResponses(responses, criteria, config);
  if (!validation.valid) return { ok: false, issues: validation.issues, categories: [], overall: null };

  const scoreById = new Map(responses.map((response) => [Number(response.criterionId), response.score]));
  const order = [];
  const byKey = new Map();

  for (const criterion of criteria) {
    const key = criterion.sectionKey;
    if (!byKey.has(key)) {
      byKey.set(key, { key, title: criterion.sectionTitle ?? key, criteriaCount: 0, counted: 0, naCount: 0, sum: 0 });
      order.push(key);
    }
    const category = byKey.get(key);
    category.criteriaCount += 1;
    const score = scoreById.get(Number(criterion.id));
    if (score === 'NA') {
      category.naCount += 1;
      if (config.naPolicy === 'zero') category.counted += 1;
    } else {
      category.counted += 1;
      category.sum += score;
    }
  }

  const categories = order.map((key) => {
    const category = byKey.get(key);
    return { ...category, average: category.counted ? category.sum / category.counted : null };
  });
  const overall = categories.reduce(
    (total, category) => ({
      criteriaCount: total.criteriaCount + category.criteriaCount,
      counted: total.counted + category.counted,
      naCount: total.naCount + category.naCount,
      sum: total.sum + category.sum,
    }),
    { criteriaCount: 0, counted: 0, naCount: 0, sum: 0 },
  );

  if (overall.counted === 0) {
    return {
      ok: false,
      issues: [{ code: 'NO_SCORED_CRITERIA', message: 'Every criterion is NA, so there is nothing to average.' }],
      categories: [],
      overall: null,
    };
  }
  return { ok: true, issues: [], categories, overall: { ...overall, average: overall.sum / overall.counted } };
}

/* ------------------------------------------------------------------ */
/* One evaluator group (students, department head, peers, self)        */
/* ------------------------------------------------------------------ */

/**
 * Combine the scored evaluations of one evaluator group.
 * Every evaluator counts equally. Category contributions add up exactly to
 * the group contribution, which never exceeds `weight`.
 */
export function aggregateGroup(type, evaluations, weight, options = {}) {
  const config = { ...SCORING_CONFIG, ...options };
  const issues = [];
  const usable = [];
  const seenIds = new Set();

  for (const evaluation of evaluations) {
    if (!evaluation || !evaluation.ok) {
      issues.push({ code: 'INVALID_EVALUATION', type, evaluationId: evaluation?.id ?? null, message: 'An evaluation could not be scored and was left out.' });
      continue;
    }
    if (evaluation.id !== undefined && evaluation.id !== null) {
      if (seenIds.has(evaluation.id)) {
        issues.push({ code: 'DUPLICATE_EVALUATION', type, evaluationId: evaluation.id, message: 'The same evaluation was supplied twice.' });
        continue;
      }
      seenIds.add(evaluation.id);
    }
    usable.push(evaluation);
  }

  if (!usable.length) {
    return {
      type, weight, status: 'missing', evaluatorCount: 0, approvedCount: 0,
      average: null, contribution: null, maxContribution: weight, categories: [], issues,
    };
  }

  const { scaleMax, decimals } = config;
  const fraction = (evaluation) => evaluation.overall.sum / (scaleMax * evaluation.overall.counted);

  const average = roundTo(mean(usable.map((evaluation) => evaluation.overall.average)), decimals);
  const contribution = roundTo(weight * mean(usable.map(fraction)), decimals);

  const keys = [];
  const meta = new Map();
  usable.forEach((evaluation) => evaluation.categories.forEach((category) => {
    if (!meta.has(category.key)) {
      meta.set(category.key, { title: category.title, criteriaCount: category.criteriaCount });
      keys.push(category.key);
    }
  }));

  const rawContributions = keys.map((key) => weight * mean(usable.map((evaluation) => {
    const category = evaluation.categories.find((item) => item.key === key);
    return category ? category.sum / (scaleMax * evaluation.overall.counted) : 0;
  })));
  const allocated = allocateToTotal(rawContributions, contribution, decimals);

  const categories = keys.map((key, index) => {
    const averages = usable
      .map((evaluation) => evaluation.categories.find((item) => item.key === key))
      .filter((category) => category && category.average !== null)
      .map((category) => category.average);
    return {
      key,
      title: meta.get(key).title,
      criteriaCount: meta.get(key).criteriaCount,
      average: averages.length ? roundTo(mean(averages), decimals) : null,
      contribution: allocated[index],
    };
  });

  return {
    type, weight, status: 'available',
    evaluatorCount: usable.length,
    approvedCount: usable.filter((evaluation) => evaluation.status === 'approved').length,
    average, contribution, maxContribution: weight, categories, issues,
  };
}

/* ------------------------------------------------------------------ */
/* Form E                                                              */
/* ------------------------------------------------------------------ */

/**
 * Build the Form E result for one instructor and cycle.
 *
 * groupsInput = {
 *   student:         { evaluations: [{ id, status, ...scoreEvaluation() }], assignedCount: 12 },
 *   department_head: { ... }, peer: { ... }, self: { ... }
 * }
 * `assignedCount` is optional; when given, a group with fewer counted
 * evaluations than assigned evaluators is reported as pending.
 *
 * A missing group is never turned into 0: its contribution is null and
 * `total` stays null until all four groups are present.
 */
export function computeFormE(groupsInput = {}, options = {}) {
  const config = { ...SCORING_CONFIG, ...options };
  const weights = options.weights ?? OFFICIAL_WEIGHTS;
  const weightCheck = validateWeights(weights);
  if (!weightCheck.valid) {
    return {
      valid: false, weights, maxTotal: 100, groups: {}, total: null, partialTotal: null,
      complete: false, state: 'incomplete', eligibleForFinalApproval: false,
      missingGroups: [], pendingGroups: [], excluded: [], issues: weightCheck.issues, notices: [],
    };
  }

  const issues = [];
  const excluded = [];
  const groups = {};

  for (const type of EVALUATOR_TYPES) {
    const input = groupsInput[type] ?? { evaluations: [] };
    const counted = [];
    for (const evaluation of input.evaluations ?? []) {
      const status = evaluation?.status;
      if (status !== undefined && !config.countedStatuses.includes(status)) {
        excluded.push({ type, evaluationId: evaluation.id ?? null, status, reason: 'STATUS_NOT_COUNTED' });
        continue;
      }
      counted.push(evaluation);
    }
    const group = aggregateGroup(type, counted, weights[type], config);
    group.assignedCount = Number.isInteger(input.assignedCount) ? input.assignedCount : null;
    groups[type] = group;
    issues.push(...group.issues);
  }

  const missingGroups = EVALUATOR_TYPES.filter((type) => groups[type].status === 'missing');
  const pendingGroups = EVALUATOR_TYPES
    .filter((type) => groups[type].assignedCount !== null && groups[type].evaluatorCount < groups[type].assignedCount)
    .map((type) => ({ type, assigned: groups[type].assignedCount, submitted: groups[type].evaluatorCount }));

  const available = EVALUATOR_TYPES.filter((type) => groups[type].status === 'available');
  const partialTotal = roundTo(available.reduce((sum, type) => sum + groups[type].contribution, 0), config.decimals);
  const complete = missingGroups.length === 0 && pendingGroups.length === 0 && issues.length === 0;
  const total = complete ? partialTotal : null;
  const allApproved = complete && EVALUATOR_TYPES.every((type) => groups[type].approvedCount === groups[type].evaluatorCount);

  const notices = [{
    code: 'UNCONFIRMED_NA_POLICY',
    message: `NA handling is provisional: NA is ${config.naPolicy === 'zero' ? 'counted as 0' : 'left out of the average'} until the institution confirms the rule.`,
  }];
  for (const [type, keys] of Object.entries(UNCONFIRMED_CATEGORIES)) {
    const present = groups[type]?.categories.filter((category) => keys.includes(category.key)) ?? [];
    if (present.length) {
      notices.push({
        code: 'UNCONFIRMED_CATEGORY_MAPPING',
        type,
        message: `"${present[0].title}" is listed on Form E but has no matching heading in the official Form D text. Its criteria mapping is unconfirmed (it does not change the total).`,
      });
    }
  }

  return {
    valid: true, weights, maxTotal: 100, groups, total, partialTotal, complete,
    state: allApproved ? 'approved' : complete ? 'complete' : 'incomplete',
    eligibleForFinalApproval: complete,
    missingGroups, pendingGroups, excluded, issues, notices,
  };
}