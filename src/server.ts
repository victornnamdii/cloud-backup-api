import express, { type Request, type Response, type Express } from 'express'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import dotenv from 'dotenv'
import startMigrations from './migrations/createUsersAndFiles'
import { sessionStore, redisClient } from './config/redis'

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
