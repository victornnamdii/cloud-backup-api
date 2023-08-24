import isEmail from 'validator/lib/isEmail';
import RequestBodyError from '../BodyError';
interface newUserParams {
  email: string | undefined
  password: string | undefined
  firstName: string | undefined
  lastName: string | undefined
}

const validateNewUserBody = (body: newUserParams): void => {
  if (body.email === undefined ||
    body.email === null ||
    typeof body.email !== 'string'
  ) {
    throw new RequestBodyError('Please enter your email');
  }

  const email = body.email;
  body.email = email.toLowerCase().trim();
  if (!isEmail(body.email)) {
    throw new RequestBodyError('Please enter a valid email');
  }

  if (body.password === undefined || typeof body.password !== 'string') {
    throw new RequestBodyError('Please enter a password');
  }

  if (body.password.length < 6) {
    throw new RequestBodyError('Please enter a password of atleast six(6) characters');
  }

  if (body.firstName === undefined ||
    typeof body.firstName !== 'string' ||
    body.firstName === ''
  ) {
    throw new RequestBodyError('Please enter your first name');
  }

  if (body.lastName === undefined ||
    typeof body.lastName !== 'string' ||
    body.lastName === ''
  ) {
    throw new RequestBodyError('Please enter your last name');
  }
};

export default validateNewUserBody;
