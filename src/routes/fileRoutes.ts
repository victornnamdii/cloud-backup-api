import { Router } from 'express'
import { requireAdminAuth, requireAuth, requireFolderAuth, requireFolderQueryAuth } from '../middlewares/authMiddleware'
import { uploadToS3 } from '../middlewares/uploadMiddleware'
import FileController from '../controllers/fileController'

const fileRouter: Router = Router()

/* eslint-disable @typescript-eslint/no-misused-promises */
fileRouter.get('/files', requireAuth, FileController.getAllFiles)
fileRouter.get('/files/download/:fileId', requireAuth, FileController.download)
fileRouter.get('/files/stream/:fileId', requireAuth, FileController.stream)
fileRouter.post('/files', requireFolderQueryAuth, uploadToS3, FileController.addFile)
fileRouter.patch('/files/:fileId', requireAuth, FileController.updateFile)
fileRouter.patch('/admin/files/:fileId', requireAdminAuth, FileController.review)
fileRouter.delete('/files/:fileId', requireAuth, FileController.deleteFile)
fileRouter.get('/folders', requireAuth, FileController.getAllFolders)
fileRouter.get('/folders/:folderName', requireAuth, FileController.getFolderFiles)
fileRouter.post('/folders', requireAuth, FileController.addFolder)
fileRouter.put('/folders/:folderName', requireFolderAuth, FileController.moveFile)
fileRouter.patch('/folders/:folderName', requireAuth, FileController.updateFolder)
fileRouter.delete('/folders/:folderName', requireAuth, FileController.deleteFolder)

export default fileRouter
