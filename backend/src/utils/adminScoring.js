// Pure scoring rules for the administrative six-month performance evaluation form.
// No database or HTTP code here, so the rules are easy to test and to change in one place.

export const MAX_SCORES = Object.freeze({ plan: 70, behavioral: 30, self: 5, team: 15, supervisor: 10 });
export const MAX_QUARTERS = 4;

export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const isBlank = (v) => v === null || v === undefined || v === '';
const toNumberOrNull = (v) => (isBlank(v) ? null : Number(v));

// Returns null for blank input, otherwise a number 0..max with at most 2 decimals. Throws RangeError.
export function parseScore(value, max, label) {
  if (isBlank(value)) return null;
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(n) || n < 0 || n > max) {
    throw new RangeError(`${label} must be a number from 0 to ${max}.`);
  }
  if (Math.abs(n * 100 - Math.round(n * 100)) > 1e-6) {
    throw new RangeError(`${label} may have at most 2 decimal places.`);
  }
  return round2(n);
}

// levels: [{ name, minScore }]. Returns the normalized list sorted by minScore. Throws RangeError.
export function validateLevels(levels) {
  if (!Array.isArray(levels) || levels.length === 0 || levels.length > 10) {
    throw new RangeError('Provide between 1 and 10 performance levels.');
  }
  const cleaned = levels.map((level) => ({
    name: String(level?.name ?? '').trim(),
    minScore: Number(level?.minScore),
  }));
  for (const level of cleaned) {
    if (!level.name || level.name.length > 80) {
      throw new RangeError('Every level needs a name of at most 80 characters.');
    }
    if (!Number.isFinite(level.minScore) || level.minScore < 0 || level.minScore > 100) {
      throw new RangeError(`Minimum score for "${level.name}" must be between 0 and 100.`);
    }
    level.minScore = round2(level.minScore);
  }
  cleaned.sort((a, b) => a.minScore - b.minScore);
  if (cleaned[0].minScore !== 0) {
    throw new RangeError('The lowest level must start at 0 so every score has a level.');
  }
  for (let i = 1; i < cleaned.length; i += 1) {
    if (cleaned[i].minScore === cleaned[i - 1].minScore) {
      throw new RangeError('Two levels cannot start at the same score.');
    }
  }
  const names = new Set(cleaned.map((l) => l.name.toLowerCase()));
  if (names.size !== cleaned.length) throw new RangeError('Level names must be unique.');
  return cleaned;
}

// The level is the band with the highest minScore that is <= score. No levels configured -> null.
export function levelFor(score, levels) {
  if (score === null || score === undefined || !Array.isArray(levels) || levels.length === 0) return null;
  const sorted = [...levels].sort((a, b) => a.minScore - b.minScore);
  let found = null;
  for (const level of sorted) {
    if (Number(score) >= level.minScore) found = level.name;
  }
  return found;
}

// quarters: [{ seq, label, plan_score|planScore, behavioral_score|behavioralScore }]
export function normalizeQuarter(q) {
  return {
    seq: Number(q.seq),
    label: String(q.label ?? ''),
    plan: toNumberOrNull(q.plan_score ?? q.planScore),
    behavioral: toNumberOrNull(q.behavioral_score ?? q.behavioralScore),
  };
}

export function buildSummary({ selfScore, teamScore, supervisorScore, quarters = [] }, levels = []) {
  const rows = quarters
    .map(normalizeQuarter)
    .sort((a, b) => a.seq - b.seq)
    .map((q) => {
      const total = q.plan !== null && q.behavioral !== null ? round2(q.plan + q.behavioral) : null;
      return { ...q, total, level: levelFor(total, levels) };
    });

  // Consolidated "performance against the plan" = average of the quarter plan scores entered.
  const planScores = rows.map((r) => r.plan).filter((v) => v !== null);
  const plan = planScores.length ? round2(planScores.reduce((a, b) => a + b, 0) / planScores.length) : null;

  const self = toNumberOrNull(selfScore);
  const team = toNumberOrNull(teamScore);
  const supervisor = toNumberOrNull(supervisorScore);

  const behavioral = [self, team, supervisor].every((v) => v !== null)
    ? round2(self + team + supervisor)
    : null;
  const total = plan !== null && behavioral !== null ? round2(plan + behavioral) : null;

  const missing = [];
  if (plan === null) missing.push('at least one quarter with a plan score');
  if (self === null) missing.push('self-assessment');
  if (team === null) missing.push('team score');
  if (supervisor === null) missing.push('supervisor score');

  return {
    quarters: rows,
    consolidated: { plan, self, team, supervisor, behavioral, total, level: levelFor(total, levels) },
    complete: missing.length === 0,
    missing,
  };
}