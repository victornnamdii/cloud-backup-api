import RequestBodyError from '../BodyError'

interface FileParams {
  fileName: string | undefined
  source: string | undefined | null
}

const validateMoveFileBody = (body: FileParams): void => {
  if (body.fileName === undefined || typeof body.fileName !== 'string') {
    throw new RequestBodyError('Please enter a file name')
  }
  if (typeof body.source !== 'undefined' && typeof body.source !== 'string') {
    throw new RequestBodyError('Source should be a string or undefined')
  }
  if (body.source === undefined || body.source === 'null') {
    body.source = null
  }
}

export default validateMoveFileBody
