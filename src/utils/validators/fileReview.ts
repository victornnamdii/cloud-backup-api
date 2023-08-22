import RequestBodyError from '../BodyError'

interface ReviewParams {
  safe: boolean | undefined
}

/* eslint-disable @typescript-eslint/strict-boolean-expressions */
const validateFileReviewBody = (body: ReviewParams): void => {
  if (body.safe === undefined) {
    throw new RequestBodyError('Please specify if file is safe')
  }
  if (typeof body.safe !== 'boolean') {
    throw new RequestBodyError('Invalid value for safe')
  }
}

export default validateFileReviewBody
