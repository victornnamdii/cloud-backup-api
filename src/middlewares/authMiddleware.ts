import { type Request, type Response, type NextFunction } from 'express'
import db from '../config/db'

type FinalResponse = (undefined | Response<any, Record<string, any>>)
interface Folder {
  id: string
  name: string
  user_id: string
}

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

const requireAuth = (req: Request, res: Response, next: NextFunction): FinalResponse => {
  try {
    if (req.user === undefined) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    next()
  } catch (error) {
    next(error)
  }
}

const requireFolderAuth = async (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> => {
  try {
    if (req.user === undefined) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const { name } = req.params
    const Folders = db<Folder>('folders')
    const folder = await Folders.where({ name, user_id: req.user.id }).first()
    if (folder === undefined) {
      return res.status(400).json({ error: `You do not have a folder named ${name}` })
    }
    res.locals.folderId = folder.id
    next()
  } catch (error) {
    next(error)
  }
}

export { requireNoAuth, requireAuth, requireFolderAuth }
