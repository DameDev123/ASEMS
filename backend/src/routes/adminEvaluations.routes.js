import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/authorize.js';
import {
  assignEvaluations, createPeriod, getEvaluation, getLevels, listAll, listMine, listPeriods,
  respondToEvaluation, saveSelfScore, saveSupervisorPart, setLevels, submitEvaluation,
  updatePeriodStatus,
} from '../services/adminEvaluation.service.js';

// Administrative staff evaluation. Independent of the academic evaluation routes.
// Per-evaluation access (employee / supervisor / admin) is enforced in the service layer.
const router = Router();
router.use(authenticate);
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

const send = (handler, status = 200) => async (req, res, next) => {
  try {
    res.status(status).json({ success: true, data: await handler(req) });
  } catch (error) {
    next(error);
  }
};

// Fixed paths first, then /:id routes.
router.get('/periods', send(() => listPeriods()));
router.post('/periods', authorize('admin'), send((req) => createPeriod(req.body, req.user, req.ip), 201));
router.patch('/periods/:id', authorize('admin'), send((req) => updatePeriodStatus(req.params.id, req.body, req.user, req.ip)));

router.get('/levels', send(() => getLevels()));
router.put('/levels', authorize('admin'), send((req) => setLevels(req.body, req.user, req.ip)));

router.post('/assignments', authorize('admin'), send((req) => assignEvaluations(req.body, req.user, req.ip), 201));
router.get('/all', authorize('admin'), send((req) => listAll(req.query)));
router.get('/mine', send((req) => listMine(req.user)));

router.get('/:id', send((req) => getEvaluation(req.params.id, req.user)));
router.put('/:id/supervisor', send((req) => saveSupervisorPart(req.params.id, req.body, req.user, req.ip)));
router.put('/:id/self', send((req) => saveSelfScore(req.params.id, req.body, req.user, req.ip)));
router.post('/:id/submit', send((req) => submitEvaluation(req.params.id, req.user, req.ip)));
router.post('/:id/response', send((req) => respondToEvaluation(req.params.id, req.body, req.user, req.ip)));

export default router;