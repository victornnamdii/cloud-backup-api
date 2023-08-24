import multer, { type FileFilterCallback } from 'multer'
import { type Response, type Request, type NextFunction } from 'express'
import multerS3 from 'multer-s3'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { v4 } from 'uuid'
import RequestError from '../utils/BodyError'

const accessKeyId: string = process.env.AWS_ACCESS_KEY_ID as string
const secretAccessKey: string = process.env.AWS_SECRET_ACCESS_KEY as string
const region: string = process.env.S3_REGION as string
const s3Bucket: string = process.env.S3_BUCKET as string

const s3client: S3Client = new S3Client({
  credentials: {
    accessKeyId,
    secretAccessKey
  },
  region
})

const deleteObject = async (file: { key: string }): Promise<void> => {
  const deleteCommand = new DeleteObjectCommand({
    Bucket: s3Bucket,
    Key: file.key
  })
  await s3client.send(deleteCommand)
}

const s3Storage = multerS3({
  s3: s3client,
  bucket: s3Bucket,
  metadata: (req, file, cb) => {
    cb(null, { fieldname: file.fieldname })
  },
  key: (req, file, cb) => {
    const fileName = `risevest_cloud_${v4()}_${file.originalname}`
    cb(null, fileName)
  }
})

const checkFile = (req: Request, file: Express.MulterS3.File, cb: FileFilterCallback): void => {
  //
  const max = 200 * 1024 * 1024
  if (Number(req.headers['content-length']) > max || file.size > max) {
    cb(new RequestError('File too large'))
  } else {
    cb(null, true)
  }
}

const multerAgent = multer({
  storage: s3Storage,
  fileFilter: (req: Request, file: Express.MulterS3.File, callback: FileFilterCallback) => {
    checkFile(req, file, callback)
  },
  limits: {
    fileSize: 200 * 1024 * 1024 // 200 MB
  }
})

const upload = multerAgent.single('file')

const uploadToS3 = (req: Request, res: Response, next: NextFunction): void => {
  try {
    upload(req, res, (err) => {
      /* eslint-disable @typescript-eslint/strict-boolean-expressions */
      if (err) {
        if (req.file !== undefined) {
          deleteObject(req.file)
            .then()
            .catch(() => {
              console.log('Bad Request')
            })
        }
        if (err instanceof multer.MulterError ||
          err instanceof RequestError
        ) {
          return res.status(400).json({ error: err.message })
        } else {
          console.log(err)
          return res.status(400).json({
            error: 'Error uploading image'
          })
        }
      }

      next()
    })
  } catch (error) {
    if (req.file !== undefined) {
      deleteObject(req.file)
        .then()
        .catch(() => {
          console.log('Bad Request')
        })
    }
    next(error)
  }
}

export { uploadToS3, deleteObject, s3client }
