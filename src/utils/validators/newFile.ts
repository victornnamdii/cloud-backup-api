import RequestBodyError from '../BodyError'

interface File {
  id: string
  name: string
  folder_id: string
  link: string
  s3_key: string
  user_id: string
}

/* eslint-disable @typescript-eslint/strict-boolean-expressions */
const validateNewFileBody = (body: File): void => {
  if (!body.name || typeof body.name !== 'string') {
    throw new RequestBodyError('Please enter a file name')
  }
  if (body.name === 'null') {
    throw new RequestBodyError('Name cannot be "null"')
  }
}

export default validateNewFileBody
