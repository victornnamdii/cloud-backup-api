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
fileRouter.post('/files', authMiddleware_1.requireAuth, uploadMiddleware_1.uploadToS3, fileController_1.default.addFile);
fileRouter.post('/folders', authMiddleware_1.requireAuth);
fileRouter.put('/folders/:name', authMiddleware_1.requireFolderAuth, uploadMiddleware_1.uploadToS3);
exports.default = fileRouter;
