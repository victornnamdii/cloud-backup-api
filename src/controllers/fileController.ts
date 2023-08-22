import { type Request, type Response, type NextFunction } from 'express'
import isUUID from 'validator/lib/isUUID'
import db from '../config/db'
import RequestBodyError from '../utils/BodyError'
import validateNewFileBody from '../utils/validators/newFile'
import { deleteObject } from '../middlewares/uploadMiddleware'
import validateFileReviewBody from '../utils/validators/fileReview'

interface File {
  id: string
  name: string
  displayName: string
  folder_id: string | null
  link: string
  s3_key: string
  user_id: string
  updated_at: Date
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
        folder_id: folderId ?? null,
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
        folder_id: folderId,
        updated_at: new Date()
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
      let files: File[]
      if (req.user?.is_superuser) {
        files = await db.where(
          'files.user_id', req.user?.id
        ).select(
          'files.id as file_id',
          'files.displayName as file_name',
          'link as download_link',
          'folders.displayName as folder_name'
        ).from('files')
          .leftJoin('folders', 'files.folder_id', 'folders.id')
      } else {
        files = await db
          .select(
            'files.id as file_id',
            'files.displayName as file_name',
            'link as download_link',
            'folders.displayName as folder_name'
          ).from('files')
          .leftJoin('folders', 'files.folder_id', 'folders.id')
      }
      return res.status(200).json({ files })
    } catch (error) {
      next(error)
    }
  }

  static async getAllFolders (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      const folders = await db.where(
        'folders.user_id', req.user?.id
      ).select(
        db.raw(
          '"folders"."displayName" as folder_name, count(files.name) as file_count'
        )
      ).from('folders')
        .innerJoin('files', 'files.folder_id', 'folders.id')
        .groupBy('folder_name')

      folders.forEach((folder) => {
        folder.file_count = Number(folder.file_count)
      })
      return res.status(200).json({ folders })
    } catch (error) {
      next(error)
    }
  }

  static async download (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      const fileId: string = req.params.fileId
      if (!isUUID(fileId, 4)) {
        return res.status(400).json({ error: 'Invalid file id' })
      }
      const Files = db<File>('files')
      const file = await Files.where({
        user_id: req.user?.id,
        id: fileId
      }).first('link')
      if (file === undefined) {
        return res.status(404).json({ error: 'File not found. Please check file id in the URL.' })
      }
      res.redirect(file.link)
    } catch (error) {
      next(error)
    }
  }

  static async review (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      validateFileReviewBody(req.body)
      const fileId: string = req.params.fileId
      if (!isUUID(fileId, 4)) {
        return res.status(400).json({ error: 'Invalid file id' })
      }

      const Files = db<File>('files')
      const file = await Files.where({
        id: fileId
      }).first('s3_key', 'displayName')
      if (file === undefined) {
        return res.status(404).json({ error: 'File not found. Please check file id in the URL.' })
      }

      const safe = req.body.safe as boolean
      if (!safe) {
        await deleteObject({ key: file.s3_key })
        await db<File>('files').where({
          id: fileId
        }).del()
      }
      res.status(201).json({ message: `${file.displayName} marked as unsafe and automatically deleted` })
    } catch (error) {
      if (error instanceof RequestBodyError) {
        return res.status(400).json({ error: error.message })
      }
      next(error)
    }
  }
}

export default FileController
