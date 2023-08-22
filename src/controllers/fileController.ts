import { type Request, type Response, type NextFunction } from 'express'
import db from '../config/db'
import RequestBodyError from '../utils/BodyError'
import validateNewFileBody from '../utils/validators/newFile'
import { deleteObject } from '../middlewares/uploadMiddleware'

interface File {
  id: string
  name: string
  folder_id: string
  link: string
  s3_key: string
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
      //   const folderId: (string | undefined) = req.query.folder_id as (string | undefined)
      const Files = db<File>('files')
      await Files.insert({
        name: req.file?.originalname,
        // folder_id: folderId,
        link: req.file.location,
        s3_key: req.file.key,
        user_id: req.user?.id
      })
      return res.status(201).json({ message: 'File succesfully uploaded' })
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
        return res.status(400).json({ error: 'File already exists' })
      }
      next(error)
    }
  }
}

export default FileController
