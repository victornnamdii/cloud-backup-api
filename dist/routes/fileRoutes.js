"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const uploadMiddleware_1 = require("../middlewares/uploadMiddleware");
const fileController_1 = __importDefault(require("../controllers/fileController"));
const fileRouter = (0, express_1.Router)();
/* eslint-disable @typescript-eslint/no-misused-promises */
fileRouter.get('/files', authMiddleware_1.requireAuth, fileController_1.default.getAllFiles);
fileRouter.get('/files/download/:fileId', authMiddleware_1.requireAuth, fileController_1.default.download);
fileRouter.get('/files/stream/:fileId', authMiddleware_1.requireAuth, fileController_1.default.stream);
fileRouter.post('/files', authMiddleware_1.requireFolderQueryAuth, uploadMiddleware_1.uploadToS3, fileController_1.default.addFile);
fileRouter.patch('/files/:fileId', authMiddleware_1.requireAuth, fileController_1.default.updateFile);
fileRouter.patch('/admin/files/:fileId', authMiddleware_1.requireAdminAuth, fileController_1.default.review);
fileRouter.delete('/files/:fileId', authMiddleware_1.requireAuth, fileController_1.default.deleteFile);
fileRouter.get('/folders', authMiddleware_1.requireAuth, fileController_1.default.getAllFolders);
fileRouter.get('/folders/:folderName', authMiddleware_1.requireAuth, fileController_1.default.getFolderFiles);
fileRouter.post('/folders', authMiddleware_1.requireAuth, fileController_1.default.addFolder);
fileRouter.put('/folders/:folderName', authMiddleware_1.requireFolderAuth, fileController_1.default.moveFile);
fileRouter.patch('/folders/:folderName', authMiddleware_1.requireAuth, fileController_1.default.updateFolder);
fileRouter.delete('/folders/:folderName', authMiddleware_1.requireAuth, fileController_1.default.deleteFolder);
exports.default = fileRouter;
