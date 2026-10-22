import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import { notFoundHandler } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import formsRoutes from './routes/forms.routes.js';
import assignmentsRoutes from './routes/assignments.routes.js';
import evaluationsRoutes from './routes/evaluations.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import workflowRoutes from './routes/workflow.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import usersRoutes from './routes/users.routes.js';
import cyclesRoutes from './routes/cycles.routes.js';
import tasksRoutes from './routes/tasks.routes.js';
import resultsRoutes from './routes/results.routes.js';
const app = express();

app.disable('x-powered-by');
app.use(helmet());

app.use(cors({
  origin: env.FRONTEND_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
}));

app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'ASEMS API',
      docs: 'See docs/api-documentation.md',
    },
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/evaluations', evaluationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/cycles', cyclesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/results', resultsRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;