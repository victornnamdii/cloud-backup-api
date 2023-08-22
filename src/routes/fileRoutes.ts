import { Router } from 'express'
import { requireAuth, requireFolderAuth } from '../middlewares/authMiddleware'
import { uploadToS3 } from '../middlewares/uploadMiddleware'
import FileController from '../controllers/fileController'

const fileRouter: Router = Router()

/* eslint-disable @typescript-eslint/no-misused-promises */
fileRouter.post('/files', requireAuth, uploadToS3, FileController.addFile)
fileRouter.post('/folders', requireAuth)
fileRouter.put('/folders/:name', requireFolderAuth, uploadToS3)

export default fileRouter
