import RequestBodyError from '../BodyError'

interface File {
  id: string
  name: string | undefined
  user_id: string
}

const validateUpdateFileBody = (body: File): void => {
  if (body.name !== undefined && typeof body.name !== 'string') {
    throw new RequestBodyError('Please enter a valid name')
  }
}

export default validateUpdateFileBody
