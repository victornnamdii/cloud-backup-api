import { type Request, type Response, type NextFunction } from 'express'
import { redisClient } from '../config/redis'

interface User {
  id: string
  email: string
  password: string
  first_name: string
  last_name: string
}

const deserializeUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.session.user !== undefined) {
      const user = await redisClient.get(`auth_${req.session.user.id}`)
      if (user !== null) {
        const userObject: User = JSON.parse(user)
        req.user = userObject
      } else {
        delete req.session.user
      }
    }
    next()
  } catch (error) {
    next(error)
  }
}

export default deserializeUser
