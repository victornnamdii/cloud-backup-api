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

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
class UserController {
  static async create (req: Request, res: Response, next: NextFunction): Promise<void> {
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
        res.status(400).json({ error: 'Email already taken' })
        return
      }

      await Users.insert({
        email,
        password: await hashPassword(password),
        first_name: firstName,
        last_name: lastName
      })
      res.status(201).json({
        message: 'Sign up successful',
        email: req.body.email
      })
    } catch (error) {
      console.log(error)
      if (error instanceof RequestBodyError) {
        res.status(400).json({ error: error.message })
      } else {
        next(error)
      }
    }
  }
}

export default UserController
