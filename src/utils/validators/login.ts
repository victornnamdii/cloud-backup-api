import isEmail from 'validator/lib/isEmail'
import RequestBodyError from '../BodyError'
interface loginParams {
  email: string
  password: string
}

/* eslint-disable @typescript-eslint/strict-boolean-expressions */
const validatelogInBody = (body: loginParams): void => {
  if (!body.email ||
    !isEmail(body.email)
  ) {
    throw new RequestBodyError('Please enter your email')
  }

  if (!body.password || typeof body.password !== 'string') {
    throw new RequestBodyError('Please enter your password')
  }
}

export default validatelogInBody
