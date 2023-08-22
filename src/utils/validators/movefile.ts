import RequestBodyError from '../BodyError'

interface FileParams {
  fileName: string
  source: string | undefined | null
}

/* eslint-disable @typescript-eslint/strict-boolean-expressions */
const validateMoveFileBody = (body: FileParams): void => {
  if (!body.fileName || typeof body.fileName !== 'string') {
    throw new RequestBodyError('Please enter a file name')
  }
  if (!body.source || body.source === 'null') {
    body.source = null
  }
  if (body.source && typeof body.source !== 'string') {
    throw new RequestBodyError('Source should be a string or null')
  }
}

export default validateMoveFileBody
