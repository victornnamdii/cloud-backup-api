import express, { type Request, type Response, type Express, type NextFunction } from 'express';
// import dotenv from 'dotenv';
import startMigrations from './migrations/createUsersAndFiles';
import { redisClient } from './config/redis';
import errorHandler from './middlewares/errorMiddleware';
import userRouter from './routes/userRoutes';
import authRouter from './routes/authRoutes';
import deserializeUser from './middlewares/sessionMiddleware';
import fileRouter from './routes/fileRoutes';
import clearVerifications from './utils/jobs/clearExpiredVerifications';

// dotenv.config();

const app: Express = express();
const port = process.env.PORT ?? 6000;

// Check Redis
redisClient.connect()
  .then(() => {
    console.log('Redis client connected');
  })
  .catch(() => {
    console.log('Redis client not connected');
    process.exit(1);
  });

// middlewares
app.use(express.json());

// view engine
app.set('view engine', 'ejs');

app.disable('x-powered-by');
app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to the cloud backup API');
});

startMigrations()
  .then(() => {
    app.listen(port, () => {
      console.log(`Cloud backup server started on port ${port}`);
    });
  })
  .catch(() => {
    process.exit(1);
  });

/* eslint-disable @typescript-eslint/no-misused-promises */
app.use(deserializeUser);
app.use(userRouter);
app.use(authRouter);
app.use(fileRouter);

app.use((req: Request, res: Response, next: NextFunction) => {
  try {
    return res.status(404).json({
      error: 'Page not found'
    });
  } catch (error) {
    next(error);
  }
});
app.use(errorHandler);
clearVerifications.start();

export default app;
