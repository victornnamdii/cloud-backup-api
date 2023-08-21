import { Router } from 'express'
import AuthController from '../controllers/AuthController'
import { requireNoAuth } from '../middlewares/authMiddleware'

const authRouter: Router = Router()

/* eslint-disable @typescript-eslint/no-misused-promises */
authRouter.post('/login', requireNoAuth, AuthController.login)

export default authRouter
