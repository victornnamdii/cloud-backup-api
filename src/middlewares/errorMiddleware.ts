import {ErrorRequestHandler} from 'express'

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err) {
    res.status(500).json({
      status: 'FAILED',
      error: 'Internal Server Error',
    });
  }
};

export default errorHandler;
