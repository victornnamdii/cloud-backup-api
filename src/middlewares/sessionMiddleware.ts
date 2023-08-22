import { type Request, type Response, type NextFunction } from 'express'
import { redisClient } from '../config/redis'

interface User {
  id: string
  email: string
  password: string
  first_name: string
  last_name: string
  is_superuser: boolean
}

const deserializeUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Authorization = req.header('Authorization')
    if (Authorization !== undefined && Authorization.startsWith('Bearer ')) {
      const token = Authorization.split(' ')[1]
      const user = await redisClient.get(`auth_${token}`)
      if (user !== null) {
        const userObject: User = JSON.parse(user)
        req.user = userObject
      }
    }
    next()
  } catch (error) {
    next(error)
  }
}

export default deserializeUser
