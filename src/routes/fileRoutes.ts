import { Router } from 'express'
import { requireAdminAuth, requireAuth, requireFolderAuth, requireFolderQueryAuth } from '../middlewares/authMiddleware'
import { uploadToS3 } from '../middlewares/uploadMiddleware'
import FileController from '../controllers/fileController'

const fileRouter: Router = Router()

/* eslint-disable @typescript-eslint/no-misused-promises */
fileRouter.get('/files', requireAuth, FileController.getAllFiles)
fileRouter.get('/files/download/:fileId', requireAuth, FileController.download)
fileRouter.post('/files', requireFolderQueryAuth, uploadToS3, FileController.addFile)
fileRouter.patch('/files/:fileId', requireAdminAuth, FileController.review)
fileRouter.get('/files/stream/:fileId', FileController.stream)
fileRouter.get('/folders', requireAuth, FileController.getAllFolders)
fileRouter.post('/folders', requireAuth, FileController.addFolder)
fileRouter.put('/folders/:folderName', requireFolderAuth, FileController.moveFile)

export default fileRouter
