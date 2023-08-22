import { type Request, type Response, type NextFunction } from 'express'
import db from '../config/db'

type FinalResponse = (undefined | Response<any, Record<string, any>>)

interface File {
  id: string
  name: string
  displayName: string
  folder_id: string
  link: string
  s3_key: string
  user_id: string
}
interface Folder {
  id: string
  name: string
  displayName: string
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
    const { folderName } = req.params
    const { fileName } = req.body
    const Folders = db<Folder>('folders')
    const folder = await Folders.where({
      name: folderName.toLowerCase(),
      user_id: req.user.id
    }).first()
    if (folder === undefined) {
      return res.status(400).json({ error: `You do not have a folder named ${folderName}` })
    }

    const Files = db<File>('files')
    const file = await Files.where({
      name: fileName.toLowerCase(),
      user_id: req.user.id
    }).first('folder_id', 'id')
    if (file === undefined) {
      return res.status(400).json({ error: `You do not have a file named ${fileName}` })
    }
    if (file.folder_id === folder.id) {
      return res.status(400).json({ error: `${fileName} already exists in ${folderName} folder` })
    }
    res.locals.fileId = file.id
    res.locals.folderId = folder.id
    next()
  } catch (error) {
    next(error)
  }
}

const requireFolderQueryAuth = async (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> => {
  try {
    if (req.user === undefined) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const folderName: (string | undefined) = req.query.folderName as (string | undefined)
    if (folderName !== undefined) {
      const Folders = db<Folder>('folders')
      const folder = await Folders.where({
        name: folderName.toLowerCase(),
        user_id: req.user.id
      }).first('id')

      if (folder === undefined) {
        const newFolder = await Folders.insert({
          name: folderName.toLowerCase(),
          displayName: folderName,
          user_id: req.user.id
        },
        ['id']
        )
        res.locals.folderId = newFolder[0].id
      } else {
        res.locals.folderId = folder.id
      }
    }
    next()
  } catch (error) {
    next(error)
  }
}

export {
  requireNoAuth,
  requireAuth,
  requireFolderAuth,
  requireFolderQueryAuth
}
