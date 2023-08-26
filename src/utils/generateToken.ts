import { randomBytes } from 'crypto';
import { redisClient } from '../config/redis';

const generateKey = (): string => {
  const buffer = randomBytes(32);
  return buffer.toString('base64');
};

const generateToken = async (): Promise<string|undefined> => {
  const auth = generateKey();
  if (await redisClient.get(`auth_${auth}`) !== null) {
    generateToken();
  } else {
    return auth;
  }
};

export default generateToken;
