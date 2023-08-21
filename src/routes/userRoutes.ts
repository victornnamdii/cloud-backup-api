import { Router } from 'express'
import UserController from '../controllers/UsersController'

const userRouter: Router = Router()

/* eslint-disable @typescript-eslint/no-misused-promises */
userRouter.post('/signup', UserController.create)

export default userRouter
