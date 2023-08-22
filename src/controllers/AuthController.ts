import { type Request, type Response, type NextFunction } from 'express'
import bcrypt from 'bcrypt'
import validateLogInBody from '../utils/validators/login'
import RequestBodyError from '../utils/BodyError'
import db from '../config/db'
import { redisClient } from '../config/redis'

interface User {
  id: string
  email: string
  password: string
  first_name: string
  last_name: string
}

type FinalResponse = (undefined | Response<any, Record<string, any>>)

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
class AuthController {
  static async login (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      validateLogInBody(req.body)

      let auth: boolean = false
      const Users = db<User>('users')
      const { email, password } = req.body
      const user = await Users.where({ email }).first()
      if (user !== undefined) {
        auth = await bcrypt.compare(password, user.password)
        if (auth) {
          await redisClient.set(
            `auth_${user.id}`,
            JSON.stringify(user),
            1 * 24 * 60 * 60 // One day
          )
          req.session.user = { id: user.id }
          return res.status(200).json({
            message: `Welcome ${user.first_name} ${user.last_name}`
          })
        }
      }
      return res.status(401).json({ error: 'Incorrect email/password' })
    } catch (error) {
      console.log(error)
      if (error instanceof RequestBodyError) {
        return res.status(400).json({ error: error.message })
      }
      next(error)
    }
  }

  static async logout (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      await redisClient.del(`auth_${req.user?.id}`)
      res.status(200).json({ message: `Goodbye ${req.user?.first_name} ${req.user?.last_name}` })
      delete req.session.user
      return
    } catch (error) {
      next(error)
    }
  }
}

export default AuthController
