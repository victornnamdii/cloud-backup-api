import RequestBodyError from '../BodyError'

interface Folder {
  id: string
  name: string | undefined
  folder_id: string
  link: string
  s3_key: string
  user_id: string
}

const validateNewFolderBody = (body: Folder): void => {
  if (body.name === undefined || typeof body.name !== 'string') {
    throw new RequestBodyError('Please enter a Folder name')
  }
  if (body.name === 'null') {
    throw new RequestBodyError('Name cannot be "null"')
  }
}

export default validateNewFolderBody
