import { type Request, type Response, type NextFunction } from 'express'

type FinalResponse = (undefined | Response<any, Record<string, any>>)

const requireNoAuth = (req: Request, res: Response, next: NextFunction): FinalResponse => {
  try {
    if (req.user !== undefined) {
      return res.status(401).json({ error: 'A user is already logged' })
    }
    next()
  } catch (error) {
    next(error)
  }
}

export { requireNoAuth }
