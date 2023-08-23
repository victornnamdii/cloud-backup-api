import { type Request, type Response, type NextFunction } from 'express'
import db from '../config/db'
import validateMoveFileBody from '../utils/validators/movefile'
import RequestBodyError from '../utils/BodyError'

type FinalResponse = (undefined | Response<any, Record<string, any>>)

interface File {
  id: string
  name: string
  displayName: string
  folder_id: string | null
  link: string
  s3_key: string
  user_id: string
  history: Array<{ event: string, date: Date }>
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

const requireAdminAuth = (req: Request, res: Response, next: NextFunction): FinalResponse => {
  try {
    if (req.user?.is_superuser === true) {
      next()
      return
    }
    return res.status(401).json({ error: 'Unauthorized' })
  } catch (error) {
    next(error)
  }
}

const requireSuperAdminAuth = (req: Request, res: Response, next: NextFunction): FinalResponse => {
  try {
    if (req.user?.is_superadmin === true) {
      next()
      return
    }
    return res.status(401).json({ error: 'Unauthorized' })
  } catch (error) {
    next(error)
  }
}

const requireFolderAuth = async (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> => {
  try {
    if (req.user === undefined) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    validateMoveFileBody(req.body)
    let folderName: string | null = req.params.folderName
    const { fileName, source } = req.body
    if (folderName === 'null') {
      folderName = null
    }
    const Folders = db<Folder>('folders')
    let destinationFolderId: string | null = null
    if (folderName !== null) {
      const destinationFolder = await Folders.where({
        name: folderName.toLowerCase(),
        user_id: req.user.id
      }).first()
      if (destinationFolder === undefined) {
        return res.status(404).json({ error: `You do not have a folder named ${folderName}` })
      }
      destinationFolderId = destinationFolder.id
    }

    let sourceFolder: Folder | undefined
    if (source !== null && source !== undefined) {
      sourceFolder = await db<Folder>('folders').where({
        name: source.toLowerCase(),
        user_id: req.user.id
      }).first()
      if (sourceFolder === undefined) {
        return res.status(404).json({ error: `You do not have a folder named ${source}` })
      }
    }

    const Files = db<File>('files')
    const file = await Files.where({
      name: fileName.toLowerCase(),
      user_id: req.user.id,
      folder_id: sourceFolder?.id ?? null
    }).first('folder_id', 'id', 'history')
    if (file === undefined) {
      let message: string = `You do not have a file named ${fileName}`
      if (sourceFolder !== undefined) {
        message += ` in ${source} folder`
      } else {
        message += ' in root directory'
      }
      return res.status(404).json({ error: message })
    }
    if (file.folder_id === destinationFolderId) {
      let message: string = `${fileName} already exists in`
      if (destinationFolderId === null) {
        message += ' root directory'
      } else {
        message += ` ${folderName} folder`
      }
      return res.status(400).json({ error: message })
    }

    res.locals.fileId = file.id
    res.locals.fileHistory = file.history
    res.locals.source = sourceFolder?.name ?? 'root directory'
    res.locals.folderId = destinationFolderId
    next()
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return res.status(400).json({ error: error.message })
    }
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
  requireAdminAuth,
  requireSuperAdminAuth,
  requireFolderAuth,
  requireFolderQueryAuth
}
