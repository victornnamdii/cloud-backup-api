import { type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcrypt';
import isUUID from 'validator/lib/isUUID';
import validateLogInBody from '../utils/validators/login';
import RequestBodyError from '../utils/BodyError';
import db from '../config/db';
import { redisClient } from '../config/redis';
import generateKey from '../utils/generateToken';

interface User {
  id: string
  email: string
  password: string
  first_name: string
  last_name: string
  updated_at: Date
  token: string
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
type FinalResponse = (undefined | Response<any, Record<string, any>>)

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
class AuthController {
  static async login (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      validateLogInBody(req.body);

      let auth: boolean = false;
      const Users = db<User>('users');
      const { email, password } = req.body;
      const user = await Users.where({ email }).first();
      if (user !== undefined) {
        auth = await bcrypt.compare(password, user.password);
        if (auth) {
          const token = generateKey();
          await db<User>('users').where({
            email
          }).update({
            updated_at: new Date(),
            token
          });
          if (user.token !== null) {
            await redisClient.del(`auth_${user.token}`);
          }
          await redisClient.set(
            `auth_${token}`,
            JSON.stringify(user),
            1 * 24 * 60 * 60 // One day
          );
          return res.status(200).json({
            message: `Welcome ${user.first_name} ${user.last_name}`,
            id: user.id,
            token: encodeURIComponent(token)
          });
        }
      }
      return res.status(401).json({ error: 'Incorrect email/password' });
    } catch (error) {
      if (error instanceof RequestBodyError) {
        return res.status(400).json({ error: error.message });
      }
      console.log(error);
      next(error);
    }
  }

  static async logout (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      const token = decodeURIComponent(req.user?.token as string);
      await redisClient.del(`auth_${token}`);
      const firstName = req.user?.first_name;
      const lastName = req.user?.last_name;
      return res.status(200).json({ message: `Goodbye ${firstName} ${lastName}` });
    } catch (error) {
      next(error);
    }
  }

  static async revokeSession (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      const userId = req.params.userId;
      if (!isUUID(userId, 4)) {
        return res.status(400).json({ error: 'Invalid user id' });
      }
      const user = await db<User>('users').where({ id: userId }).first();
      if (user !== undefined) {
        if (user.token !== null) {
          await redisClient.del(`auth_${user.token}`);
        }
        return res.status(200).json({
          message: `${user.first_name} ${user.last_name}'s session revoked`
        });
      }
      return res.status(404).json({ error: 'No user with specified id' });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
