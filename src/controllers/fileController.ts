import { type Request, type Response, type NextFunction } from 'express'
import db from '../config/db'
import RequestBodyError from '../utils/BodyError'
import validateNewFileBody from '../utils/validators/newFile'
import { deleteObject } from '../middlewares/uploadMiddleware'

interface File {
  id: string
  name: string
  displayName: string
  folder_id: string | null
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

type FinalResponse = (undefined | Response<any, Record<string, any>>)

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
class FileController {
  static async addFile (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      validateNewFileBody(req.body)
      /* eslint-disable-next-line @typescript-eslint/strict-boolean-expressions */
      if (!req.file.location) {
        return res.status(400).json({ error: 'Please add an image' })
      }

      const folderId: string | null = res.locals.folderId
      const Files = db<File>('files')
      const file = await Files.where({
        name: req.body.name.toLowerCase(),
        folder_id: folderId,
        user_id: req.user?.id
      }).first()
      if (file !== undefined) {
        if (req.file !== undefined) {
          await deleteObject(req.file)
        }
        return res.status(400).json({ error: `${req.body.name} already exists` })
      }

      await Files.insert({
        displayName: req.body.name,
        name: req.body.name.toLowerCase(),
        folder_id: res.locals.folderId,
        link: req.file.location,
        s3_key: req.file.key,
        user_id: req.user?.id
      })
      return res.status(201).json({
        message: 'File succesfully uploaded',
        link: req.file.location
      })
    } catch (error) {
      if (req.file !== undefined) {
        await deleteObject(req.file)
      }
      console.log(error)
      if (error instanceof RequestBodyError) {
        return res.status(400).json({ error: error.message })
      }
      /* eslint-disable @typescript-eslint/strict-boolean-expressions */
      // @ts-expect-error: Unreachable code error
      if (error?.message?.includes('unique')) {
        return res.status(400).json({ error: `${req.body.name} already exists` })
      }
      next(error)
    }
  }

  static async addFolder (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    const { name } = req.body
    try {
      validateNewFileBody(req.body)

      const Folders = db<Folder>('folders')
      const folder = await Folders.where({
        name: name.toLowerCase(),
        user_id: req.user?.id
      }).first()
      if (folder !== undefined) {
        return res.status(400).json({ error: `${name} folder already exists` })
      }
      await Folders.insert({
        name: name.toLowerCase(),
        displayName: name,
        user_id: req.user?.id
      })
      res.status(201).json({ message: `${name} folder succesfully created` })
    } catch (error) {
      console.log(error)
      if (error instanceof RequestBodyError) {
        return res.status(400).json({ error: error.message })
      }
      // @ts-expect-error: Unreachable code error
      if (error?.message?.includes('unique')) {
        return res.status(400).json({ error: `${name} folder already exists` })
      }
      next(error)
    }
  }

  static async moveFile (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    const { fileName } = req.body
    const { folderName } = req.params
    try {
      const { folderId, fileId } = res.locals

      const Files = db<File>('files')
      await Files.where({
        id: fileId
      }).update({
        folder_id: folderId
      })
      let message: string = `${fileName} moved to`
      if (folderName !== 'null') {
        message += ` ${folderName}`
      } else {
        message += ' root directory'
      }
      return res.status(201).json({ message })
    } catch (error) {
      // @ts-expect-error: Unreachable code error
      if (error?.message?.includes('unique')) {
        return res.status(400).json({ error: `${fileName} already exists in ${folderName} folder` })
      }
      next(error)
    }
  }

  static async getAllFiles (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      const files = await db.where(
        'files.user_id', req.user?.id
      ).select(
        'files.displayName as file_name',
        'link as download_link',
        'folders.name as folder_name'
      ).from('files')
        .leftJoin('folders', 'files.folder_id', 'folders.id')
      return res.status(200).json({ files })
    } catch (error) {
      next(error)
    }
  }
}

export default FileController
