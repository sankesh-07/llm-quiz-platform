import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { json, urlencoded } from 'express';
import { connectToDatabase } from './config/db';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './modules/auth/auth.routes';
import boardsRouter from './modules/boards/boards.routes';
import contestsRouter from './modules/contests/contests.routes';
import learningRouter from './modules/learning/learning.routes';
import analyticsRouter from './modules/analytics/analytics.routes';
import parentsRouter from './modules/parents/parents.routes';
import submissionsRouter from './modules/submissions/submissions.routes';
import diagnosticsRouter from './modules/diagnostics/diagnostics.routes';
import usersRouter from './modules/users/users.routes';

dotenv.config();

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(morgan('dev'));
  app.use(json());
  app.use(urlencoded({ extended: true }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'llm-quiz-backend' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/boards', boardsRouter);
  app.use('/api/contests', contestsRouter);
  app.use('/api/learning', learningRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/parents', parentsRouter);
  app.use('/api/submissions', submissionsRouter);
  app.use('/api/diagnostics', diagnosticsRouter);
  app.use('/api/users', usersRouter);

  app.use(errorHandler);

  return app;
};

export const startApp = async () => {
  await connectToDatabase();
  const app = createApp();
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
};
