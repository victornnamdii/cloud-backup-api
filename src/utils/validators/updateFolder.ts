import RequestBodyError from '../BodyError'

interface Folder {
  id: string
  name: string | undefined
  user_id: string
}

const validateUpdateFolderBody = (body: Folder): void => {
  if (body.name !== undefined && typeof body.name !== 'string') {
    throw new RequestBodyError('Please enter a valid name')
  }
  if (body.name === 'null') {
    throw new RequestBodyError('Name cannot be "null"')
  }
}

export default validateUpdateFolderBody
