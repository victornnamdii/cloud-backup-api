import { Router } from 'express'
import AuthController from '../controllers/AuthController'
import { requireAuth, requireSuperAdminAuth } from '../middlewares/authMiddleware'

const authRouter: Router = Router()

/* eslint-disable @typescript-eslint/no-misused-promises */
authRouter.post('/login', AuthController.login)
authRouter.get('/logout', requireAuth, AuthController.logout)
authRouter.delete('/session/:userId', requireSuperAdminAuth, AuthController.revokeSession)

export default authRouter
