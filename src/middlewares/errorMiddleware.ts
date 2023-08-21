import { type ErrorRequestHandler } from 'express'

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err !== undefined || err !== null) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

export default errorHandler
