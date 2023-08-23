import isEmail from 'validator/lib/isEmail'
import RequestBodyError from '../BodyError'
interface newAdminParams {
  email: string | undefined
  firstName: string | undefined
  lastName: string | undefined
}

const validateNewAdminBody = (body: newAdminParams): void => {
  if (body.email === undefined ||
    body.email === null ||
    typeof body.email !== 'string'
  ) {
    throw new RequestBodyError('Please enter an email')
  }

  const email = body.email
  body.email = email.toLowerCase().trim()

  if (!isEmail(body.email)) {
    throw new RequestBodyError('Please enter a valid email')
  }

  if (body.firstName === undefined ||
    typeof body.firstName !== 'string' ||
    body.firstName === ''
  ) {
    throw new RequestBodyError('Please enter a first name')
  }

  if (body.lastName === undefined ||
    typeof body.lastName !== 'string' ||
    body.lastName === ''
  ) {
    throw new RequestBodyError('Please enter a last name')
  }
}

export default validateNewAdminBody
