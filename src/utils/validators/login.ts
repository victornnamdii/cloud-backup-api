import isEmail from 'validator/lib/isEmail'
import RequestBodyError from '../BodyError'
interface loginParams {
  email: string | undefined
  password: string | undefined
}

const validatelogInBody = (body: loginParams): void => {
  if (body.email === undefined) {
    throw new RequestBodyError('Please enter your email')
  }
  if (!isEmail(body.email)) {
    throw new RequestBodyError('Please enter a valid email')
  }

  if (body.password === undefined || typeof body.password !== 'string') {
    throw new RequestBodyError('Please enter your password')
  }
}

export default validatelogInBody
