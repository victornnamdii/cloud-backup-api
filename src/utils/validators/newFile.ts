import RequestBodyError from '../BodyError'

interface File {
  id: string
  name: string | undefined
  folder_id: string
  link: string
  s3_key: string
  user_id: string
}

const validateNewFileBody = (body: File): void => {
  if (body.name !== undefined && typeof body.name !== 'string') {
    throw new RequestBodyError('Name should be a string or undefined')
  }
}

export default validateNewFileBody
