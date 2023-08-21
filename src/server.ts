import express, { type Request, type Response, type Express, type NextFunction } from 'express'
import dotenv from 'dotenv'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import startMigrations from './migrations/createUsersAndFiles'
import { redisClient, sessionStore } from './config/redis'
import errorHandler from './middlewares/errorMiddleware'
import userRouter from './routes/userRoutes'
import authRouter from './routes/authRoutes'
import deserializeUser from './middlewares/sessionMiddleware'

dotenv.config()

const app: Express = express()
const port = process.env.PORT ?? 6000
const secret: string = process.env.SECRET_KEY as string

// Check Redis
redisClient.connect()
  .then(() => {
    console.log('Redis client connected')
  })
  .catch(() => {
    console.log('Redis client not connected')
    process.exit(1)
  })

// middlewares
app.use(express.json())
app.use(cookieParser())
app.use(session({
  name: 'risevest-sid',
  secret,
  resave: false,
  saveUninitialized: true,
  store: sessionStore,
  cookie: {
    secure: process.env.NODE_ENV !== 'development',
    httpOnly: true,
    maxAge: 1 * 24 * 60 * 60 * 1000 // One day
  }
}))

app.disable('x-powered-by')
app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to the cloud backup API')
})

startMigrations()
  .then(() => {
    app.listen(port, () => {
      console.log(`Cloud backup server started on port ${port}`)
    })
  })
  .catch(() => {
    process.exit(1)
  })

app.use(deserializeUser)
app.use(userRouter)
app.use(authRouter)

app.use((req: Request, res: Response, next: NextFunction) => {
  try {
    return res.status(404).json({
      error: 'Page not found'
    })
  } catch (error) {
    next(error)
  }
})
app.use(errorHandler)
