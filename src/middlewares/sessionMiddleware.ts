import { type Request, type Response, type NextFunction } from 'express'
import { redisClient } from '../config/redis'

interface User {
  id: string
  email: string
  password: string
  first_name: string
  last_name: string
  is_superuser: boolean
  token: string
}

const deserializeUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const HeaderAuthorization = req.header('Authorization')
    const QueryAuthorization = req.query.token as string | undefined
    if (HeaderAuthorization !== undefined && HeaderAuthorization.startsWith('Bearer ')) {
      const encodedToken = HeaderAuthorization.split(' ')[1]
      const token = decodeURIComponent(encodedToken)
      const user = await redisClient.get(`auth_${token}`)
      if (user !== null) {
        const userObject: User = JSON.parse(user)
        userObject.token = encodedToken
        req.user = userObject
      }
    } else if (QueryAuthorization !== undefined) {
      const token: string = decodeURIComponent(QueryAuthorization)
      const user = await redisClient.get(`auth_${token}`)
      if (user !== null) {
        const userObject: User = JSON.parse(user)
        userObject.token = QueryAuthorization
        req.user = userObject
      }
    }
    next()
  } catch (error) {
    next(error)
  }
}

export default deserializeUser
