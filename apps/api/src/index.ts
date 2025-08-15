import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';

import { router as authRouter } from './routes/auth';
import { router as meRouter } from './routes/me';
import { router as tenantsRouter } from './routes/tenants';
import { router as usersRouter } from './routes/users';
import { router as notificationsRouter } from './routes/notifications';
import { errorHandler } from './lib/errors';

const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' });

const app = express();

app.disable('x-powered-by');
app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(',') || true,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const authLimiter = rateLimit({ windowMs: 60_000, max: 20 });
const writeLimiter = rateLimit({ windowMs: 60_000, max: 100 });

app.use('/auth', authLimiter, authRouter);
app.use('/tenants', writeLimiter, tenantsRouter);
app.use('/users', writeLimiter, usersRouter);
app.use('/notifications', writeLimiter, notificationsRouter);
app.use('/me', meRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  logger.info({ port }, 'API listening');
});

export default app;


