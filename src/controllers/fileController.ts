import { type Request, type Response, type NextFunction } from 'express'
import isUUID from 'validator/lib/isUUID'
import db from '../config/db'
import RequestBodyError from '../utils/BodyError'
import validateNewFileBody from '../utils/validators/newFile'
import { deleteObject } from '../middlewares/uploadMiddleware'
import validateFileReviewBody from '../utils/validators/fileReview'
import validateNewFolderBody from '../utils/validators/newFolder'
import { createReadStream, NoSuchKey } from '../utils/s3'
import validateUpdateFolderBody from '../utils/validators/updateFolder'
import validateUpdateFileBody from '../utils/validators/updateFile'

interface File {
  id: string
  name: string
  displayName: string
  folder_id: string | null
  link: string
  s3_key: string
  user_id: string
  updated_at: Date
  mimetype: string
}

interface Folder {
  id: string
  name: string
  displayName: string
  user_id: string
  updated_at: Date
}

type FinalResponse = (undefined | Response<any, Record<string, any>>)

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
class FileController {
  static async addFile (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    let name: string
    let displayName: string | undefined
    try {
      validateNewFileBody(req.body)
      /* eslint-disable-next-line @typescript-eslint/strict-boolean-expressions */
      if (!req.file.location) {
        return res.status(400).json({ error: 'Please add an image' })
      }

      const folderId: string | null = res.locals.folderId
      if (req.body.name !== undefined) {
        name = req.body.name.toLowerCase()
        displayName = req.body.name
      } else {
        name = req.file.originalname.toLowerCase()
        displayName = req.file.originalname
      }
      const Files = db<File>('files')
      const file = await Files.where({
        name,
        folder_id: folderId ?? null,
        user_id: req.user?.id
      }).first()
      if (file !== undefined) {
        if (req.file !== undefined) {
          await deleteObject(req.file)
        }
        return res.status(400).json({ error: `${displayName} already exists` })
      }

      const newFile = await Files.insert({
        displayName,
        name,
        folder_id: folderId ?? null,
        link: req.file.location,
        s3_key: req.file.key,
        user_id: req.user?.id,
        mimetype: req.file.mimetype
      }, ['id'])
      return res.status(201).json({
        message: 'File succesfully uploaded',
        id: newFile[0].id,
        folderId: folderId ?? null
      })
    } catch (error) {
      if (req.file !== undefined) {
        deleteObject(req.file)
          .then()
          .catch(() => {
            console.log('Bad Request')
          })
      }
      console.log(error)
      if (error instanceof RequestBodyError) {
        return res.status(400).json({ error: error.message })
      }
      /* eslint-disable @typescript-eslint/strict-boolean-expressions */
      // @ts-expect-error: Unreachable code error
      if (error?.message?.includes('unique')) {
        return res.status(400).json({ error: `${displayName} already exists` })
      }
      next(error)
    }
  }

  static async addFolder (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    const { name } = req.body
    try {
      validateNewFolderBody(req.body)

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
          'folders.displayName as folder_name'
        ).from('files')
          .leftJoin('folders', 'files.folder_id', 'folders.id')
      } else {
        files = await db
          .select(
            'files.id as file_id',
            'files.displayName as file_name',
            'folders.displayName as folder_name'
          ).from('files')
          .leftJoin('folders', 'files.folder_id', 'folders.id')
      }
      return res.status(200).json({ files })
    } catch (error) {
      next(error)
    }
  }

  static async getFolderFiles (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      const { folderName } = req.params
      const subquery = await db<Folder>('folders')
        .where({
          user_id: req.user?.id,
          name: folderName.toLowerCase()
        }).first('id')
      if (subquery === undefined) {
        return res.status(404).json({ error: `You do not have a folder named ${folderName}` })
      }
      const files = await db<File>('files')
        .where('folder_id', '=', subquery.id)
        .select(
          'files.id as file_id',
          'files.displayName as file_name'
        )
      return res.status(200).json({ files })
    } catch (error) {
      next(error)
    }
  }

  static async localGetFolderFiles (folderId: string): Promise<{ s3_key: string }[]> {
    const files = await db<File>('files')
      .where('folder_id', '=', folderId)
      .select('s3_key')
    return files
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

  static async updateFolder (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      validateUpdateFolderBody(req.body)
      const { folderName } = req.params
      const updates = { updated_at: new Date() }
      if (req.body.name !== undefined) {
        // @ts-expect-error: Unreachable code error
        updates.name = req.body.name.toLowerCase()
        // @ts-expect-error: Unreachable code error
        updates.displayName = req.body.name
      }
      if (Object.keys(updates).length > 1) {
        const subquery = await db<Folder>('folders')
          .where({
            user_id: req.user?.id,
            name: folderName.toLowerCase()
          }).first('id')
        if (subquery === undefined) {
          return res.status(404).json({ error: `You do not have a folder named ${folderName}` })
        }
        await db<Folder>('folders')
          .update(updates)
          .where('id', '=', subquery.id)
        return res.status(201).json({
          // @ts-expect-error: Unreachable code error
          message: `${folderName} folder successfully updated to ${updates.displayName}`
        })
      }
      return res.status(400).json({ error: 'No field specified to update' })
    } catch (error) {
      if (error instanceof RequestBodyError) {
        return res.status(400).json({ error: error.message })
      }
      next(error)
    }
  }

  static async updateFile (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      validateUpdateFileBody(req.body)
      const fileId: string = req.params.fileId
      if (!isUUID(fileId, 4)) {
        return res.status(400).json({ error: 'Invalid file id' })
      }
      const updates = { updated_at: new Date() }
      if (req.body.name !== undefined) {
        // @ts-expect-error: Unreachable code error
        updates.name = req.body.name.toLowerCase()
        // @ts-expect-error: Unreachable code error
        updates.displayName = req.body.name
      }
      if (Object.keys(updates).length > 1) {
        const subquery = await db<File>('files')
          .where({
            user_id: req.user?.id,
            id: fileId
          }).first('id')
        if (subquery === undefined) {
          return res.status(404).json({ error: `You do not have a file with id ${fileId}` })
        }
        await db<File>('files')
          .update(updates)
          .where('id', '=', fileId)
        return res.status(201).json({
          // @ts-expect-error: Unreachable code error
          message: `${updates.displayName} successfully updated`
        })
      }
      return res.status(400).json({ error: 'No field specified to update' })
    } catch (error) {
      if (error instanceof RequestBodyError) {
        return res.status(400).json({ error: error.message })
      }
      next(error)
    }
  }

  static async deleteFile (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      const fileId: string = req.params.fileId
      if (!isUUID(fileId, 4)) {
        return res.status(400).json({ error: 'Invalid file id' })
      }
      const subquery = await db<File>('files')
        .where({
          user_id: req.user?.id,
          id: fileId
        }).first('id', 'displayName', 's3_key')
      if (subquery === undefined) {
        return res.status(404).json({ error: `You do not have a file with id ${fileId}` })
      }
      await deleteObject({ key: subquery.s3_key })

      await db<File>('files')
        .del()
        .where('id', '=', fileId)

      return res.status(201).json({
        message: `${subquery.displayName} successfully deleted`
      })
    } catch (error) {
      next(error)
    }
  }

  static async deleteFolder (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      const { folderName } = req.params
      const subquery = await db<Folder>('folders')
        .where({
          user_id: req.user?.id,
          name: folderName.toLowerCase()
        }).first('id')
      if (subquery === undefined) {
        return res.status(404).json({ error: `You do not have a folder named ${folderName}` })
      }

      const folderFiles = await FileController.localGetFolderFiles(subquery.id)
      folderFiles.forEach((file) => {
        deleteObject({ key: file.s3_key })
          .then(() => {
            console.log(`Deleted ${file.s3_key}`)
          })
          .catch(() => {
            console.log(`Didn't delete ${file.s3_key}`)
          })
      })

      await db<Folder>('folders')
        .del()
        .where('id', '=', subquery.id)


      return res.status(201).json({
        message: `${folderName} successfully deleted`
      })
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
      let file: File | undefined

      if (req.user?.is_superuser) {
        file = await Files.where({
          id: fileId
        }).first('id', 's3_key', 'mimetype')
      } else {
        file = await Files.where({
          user_id: req.user?.id,
          id: fileId
        }).first('id', 's3_key', 'mimetype')
      }

      if (file === undefined) {
        return res.status(404).json({ error: 'File not found. Please check file id in the URL.' })
      }
      const stream = await createReadStream(file.s3_key)
      stream.pipe(res)
    } catch (error) {
      if (error instanceof NoSuchKey) {
        return res.status(404).json({ error: 'File not found in storage' })
      }
      next(error)
    }
  }

  static async stream (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      const fileId: string = req.params.fileId
      if (!isUUID(fileId, 4)) {
        return res.status(400).json({ error: 'Invalid file id' })
      }

      const Files = db<File>('files')
      let file: File | undefined

      if (req.user?.is_superuser) {
        file = await Files.where({
          id: fileId
        }).first('id', 's3_key', 'mimetype')
      } else {
        file = await Files.where({
          user_id: req.user?.id,
          id: fileId
        }).first('id', 's3_key', 'mimetype')
      }

      if (file === undefined) {
        return res.status(404).json({ error: 'File not found. Please check file id in the URL.' })
      }
      if (!file.mimetype.startsWith('video') && !file.mimetype.startsWith('audio')) {
        return res.status(400).json({ error: 'File requested for is neither a video nor audio' })
      }
      res.render('stream', { file, token: req.user?.token })
    } catch (error) {
      if (error instanceof NoSuchKey) {
        return res.status(404).json({ error: 'File not found in storage' })
      }
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
        await db<File>('files').where({
          id: fileId
        }).del()
        await deleteObject({ key: file.s3_key })
        res.status(201).json({ message: `${file.displayName} marked as unsafe and automatically deleted` })
      } else {
        res.status(201).json({ message: `${file.displayName} marked as safe` })
      }
    } catch (error) {
      if (error instanceof RequestBodyError) {
        return res.status(400).json({ error: error.message })
      }
      next(error)
    }
  }
}

export default FileController
