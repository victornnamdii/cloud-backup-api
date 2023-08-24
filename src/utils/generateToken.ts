import { randomBytes } from 'crypto';

const generateKey = (): string => {
  const buffer = randomBytes(32);
  return buffer.toString('base64');
};

export default generateKey;
