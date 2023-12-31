import { type ErrorRequestHandler } from 'express';

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err !== undefined || err !== null) {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({
        error: `There is a problem with the syntax of your JSON request body: ${err.message}`
      });
    }
    console.log(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default errorHandler;
