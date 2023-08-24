import { Router } from 'express';
import UserController from '../controllers/UsersController';
import { requireSuperAdminAuth } from '../middlewares/authMiddleware';

const userRouter: Router = Router();

/* eslint-disable @typescript-eslint/no-misused-promises */
userRouter.post('/signup', UserController.create);
userRouter.post('/admin/create', requireSuperAdminAuth, UserController.createAdmin);

export default userRouter;
