import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/authorize.js';

import {
  assignEvaluations,
  createPeriod,
  getEvaluation,
  getLevels,
  listAll,
  listAssignable,
  listMine,
  listPeriods,
  periodReport,
  respondToEvaluation,
  saveSelfScore,
  saveSupervisorPart,
  saveTeamAssessment,
  setLevels,
  setTeamMembers,
  submitEvaluation,
  submitSelfAssessment,
  submitTeamAssessment,
  updatePeriodStatus,
} from '../services/adminEvaluation.service.js';

const router = Router();

// Administrator roles allowed to manage Administrative staffs.
// "admin" is retained for existing accounts until they are migrated.
const ADMIN_EVALUATION_ADMINS = [
  'admin',
  'super_admin',
  'administrative_admin',
];

router.use(authenticate);

// Prevent browsers and intermediaries from caching private evaluation data.
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

const send = (handler, status = 200) => async (req, res, next) => {
  try {
    const data = await handler(req);
    res.status(status).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------
// Evaluation periods
// --------------------------------------------------

router.get('/periods', send(() => listPeriods()));

router.post(
  '/periods',
  authorize(...ADMIN_EVALUATION_ADMINS),
  send(
    (req) => createPeriod(req.body, req.user, req.ip),
    201,
  ),
);

router.patch(
  '/periods/:id',
  authorize(...ADMIN_EVALUATION_ADMINS),
  send(
    (req) => updatePeriodStatus(
      req.params.id,
      req.body,
      req.user,
      req.ip,
    ),
  ),
);

// --------------------------------------------------
// Performance levels
// --------------------------------------------------

router.get('/levels', send(() => getLevels()));

router.put(
  '/levels',
  authorize(...ADMIN_EVALUATION_ADMINS),
  send(
    (req) => setLevels(req.body, req.user, req.ip),
  ),
);

// --------------------------------------------------
// Assignments and administrative reports
// --------------------------------------------------

router.post(
  '/assignments',
  authorize(...ADMIN_EVALUATION_ADMINS),
  send(
    (req) => assignEvaluations(req.body, req.user, req.ip),
    201,
  ),
);

router.get(
  '/candidates',
  authorize(...ADMIN_EVALUATION_ADMINS),
  send(() => listAssignable()),
);

router.get(
  '/reports/summary',
  authorize(...ADMIN_EVALUATION_ADMINS),
  send((req) => periodReport(req.query)),
);

router.get(
  '/all',
  authorize(...ADMIN_EVALUATION_ADMINS),
  send((req) => listAll(req.query)),
);

// --------------------------------------------------
// Employee and supervisor workspace
// --------------------------------------------------

router.get(
  '/mine',
  send((req) => listMine(req.user)),
);

// Fixed paths are registered before /:id routes.
router.get(
  '/:id',
  send((req) => getEvaluation(req.params.id, req.user)),
);

router.put(
  '/:id/supervisor',
  send((req) => saveSupervisorPart(
    req.params.id,
    req.body,
    req.user,
    req.ip,
  )),
);

router.put(
  '/:id/self',
  send((req) => saveSelfScore(
    req.params.id,
    req.body,
    req.user,
    req.ip,
  )),
);

router.post(
  '/:id/self/submit',
  send((req) => submitSelfAssessment(req.params.id, req.body, req.user, req.ip)),
);

// Administrators assign the team assessors; each assessor then fills only their own form.
router.put(
  '/:id/team',
  authorize(...ADMIN_EVALUATION_ADMINS),
  send((req) => setTeamMembers(req.params.id, req.body, req.user, req.ip)),
);

router.put(
  '/:id/team-assessment',
  send((req) => saveTeamAssessment(req.params.id, req.body, req.user, req.ip)),
);

router.post(
  '/:id/team-assessment/submit',
  send((req) => submitTeamAssessment(req.params.id, req.body, req.user, req.ip)),
);

router.post(
  '/:id/submit',
  send((req) => submitEvaluation(
    req.params.id,
    req.user,
    req.ip,
  )),
);

router.post(
  '/:id/response',
  send((req) => respondToEvaluation(
    req.params.id,
    req.body,
    req.user,
    req.ip,
  )),
);

export default router;