import { randomBytes } from 'crypto'

const generatePassword = (): string => {
  const buffer = randomBytes(8)
  return buffer.toString('base64')
}

export default generatePassword
