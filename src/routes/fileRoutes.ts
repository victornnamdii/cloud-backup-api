import { Router } from 'express'
import { requireAuth, requireFolderAuth, requireFolderQueryAuth } from '../middlewares/authMiddleware'
import { uploadToS3 } from '../middlewares/uploadMiddleware'
import FileController from '../controllers/fileController'

const fileRouter: Router = Router()

/* eslint-disable @typescript-eslint/no-misused-promises */
fileRouter.get('/files', requireAuth, FileController.getAllFiles)
fileRouter.post('/files', requireFolderQueryAuth, uploadToS3, FileController.addFile)
fileRouter.get('/folders', requireAuth, FileController.getAllFolders)
fileRouter.post('/folders', requireAuth, FileController.addFolder)
fileRouter.put('/folders/:folderName', requireFolderAuth, FileController.moveFile)

export default fileRouter
