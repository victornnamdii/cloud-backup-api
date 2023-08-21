import { type Request, type Response, type NextFunction } from 'express'
import validateNewUserBody from '../utils/validators/newUser'
import RequestBodyError from '../utils/BodyError'
import db from '../config/db'
import hashPassword from '../utils/hashPassword'

interface User {
  id: string
  email: string
  password: string
  first_name: string
  last_name: string
}

type FinalResponse = (undefined | Response<any, Record<string, any>>)

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
class UserController {
  static async create (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      validateNewUserBody(req.body)
      const Users = db<User>('users')
      const {
        email,
        password,
        firstName,
        lastName
      } = req.body

      const user = await Users.where({ email }).first()
      if (user !== undefined) {
        return res.status(400).json({ error: 'Email already taken' })
      }

      await Users.insert({
        email,
        password: await hashPassword(password),
        first_name: firstName,
        last_name: lastName
      })
      return res.status(201).json({
        message: 'Sign up successful',
        email: req.body.email
      })
    } catch (error) {
      console.log(error)
      if (error instanceof RequestBodyError) {
        return res.status(400).json({ error: error.message })
      }
      next(error)
    }
  }
}

export default UserController
