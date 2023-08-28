import { type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcrypt';
import validateNewUserBody from '../utils/validators/newUser';
import RequestBodyError from '../utils/BodyError';
import db from '../config/db';
import hashPassword from '../utils/hashPassword';
import generatePassword from '../utils/generatePassword';
import validateNewAdminBody from '../utils/validators/newAdmin';
import sendEmailQueue from '../utils/queues/emailQueue';

interface User {
  id: string
  email: string
  password: string
  first_name: string
  last_name: string
  is_superuser: boolean
  isVerified: boolean
}

interface emailverifications {
  user_id: string
  unique_string: string
  expires_at: Date
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
type FinalResponse = (undefined | Response<any, Record<string, any>>)

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
class UserController {
  static async create (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      validateNewUserBody(req.body);
      const Users = db<User>('users');
      const {
        email,
        password,
        firstName,
        lastName
      } = req.body;

      const user = await Users.where({ email: email.toLowerCase() }).first();
      if (user !== undefined) {
        return res.status(400).json({ error: 'Email already taken' });
      }

      const newUser = await Users.insert({
        email: email.toLowerCase(),
        password: await hashPassword(password),
        first_name: firstName,
        last_name: lastName,
        isVerified: false
      }, ['id']);
      sendEmailQueue.add({ id: newUser[0].id, email });
      return res.status(201).json({
        message: 'Sign up successful, Please check your mail inbox/junk for a verification mail.',
        email: req.body.email
      });
    } catch (error) {
      if (error instanceof RequestBodyError) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  static async createAdmin (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      validateNewAdminBody(req.body);
      const Users = db<User>('users');
      const {
        email,
        firstName,
        lastName
      } = req.body;

      const user = await Users.where({ email: email.toLowerCase() }).first();
      if (user !== undefined) {
        return res.status(400).json({ error: 'Email already taken' });
      }

      const adminPassword = generatePassword();
      await Users.insert({
        email: email.toLowerCase(),
        password: await hashPassword(adminPassword),
        first_name: firstName,
        last_name: lastName,
        is_superuser: true,
        isVerified: true
      });
      return res.status(201).json({
        message: 'Admin successfully created',
        email: req.body.email,
        password: adminPassword
      });
    } catch (error) {
      if (error instanceof RequestBodyError) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    const { userId, uniqueString } = req.params;

    try {
      const verification = await db<emailverifications>('emailverifications')
        .where({
          user_id: userId,
        }).first();
      if (verification !== undefined) {
        const user = await db<User>('users').where({ id: userId }).first();
        if (user && user.isVerified) {
          await db<emailverifications>('emailverifications')
            .where({
              user_id: userId,
            }).del();
          res.status(400).json({
            error: 'User is already verified',
          });
          return;
        }
        if (verification.expires_at < new Date()) {
          await db<User>('users').where({ id: userId }).del();
          await db<emailverifications>('emailverifications')
            .where({
              user_id: userId,
            }).del();
          res.status(400).json({
            error: 'Verification link has expired, Please sign up again.',
          });
          return;
        }
        const isVerified = await bcrypt.compare(uniqueString, verification.unique_string);
        if (isVerified) {
          await db<User>('users').where({ id: userId }).update({ isVerified: true });
          await db<emailverifications>('emailverifications')
            .where({
              user_id: userId,
            }).del();
          res.status(200).json({
            message: 'You have been successfully verified'
          });
          return;
        }
      }
      res.status(400).json({
        error: 'Verification link is invalid',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
