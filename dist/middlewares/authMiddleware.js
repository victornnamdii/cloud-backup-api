"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireFolderQueryAuth = exports.requireFolderAuth = exports.requireAuth = exports.requireNoAuth = void 0;
const db_1 = __importDefault(require("../config/db"));
const requireNoAuth = (req, res, next) => {
    try {
        if (req.user !== undefined) {
            return res.status(401).json({ error: 'A user is already logged' });
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requireNoAuth = requireNoAuth;
const requireAuth = (req, res, next) => {
    try {
        if (req.user === undefined) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requireAuth = requireAuth;
const requireFolderAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.user === undefined) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { folderName } = req.params;
        const { fileName } = req.body;
        const Folders = (0, db_1.default)('folders');
        const folder = yield Folders.where({
            name: folderName.toLowerCase(),
            user_id: req.user.id
        }).first();
        if (folder === undefined) {
            return res.status(400).json({ error: `You do not have a folder named ${folderName}` });
        }
        const Files = (0, db_1.default)('files');
        const file = yield Files.where({
            name: fileName.toLowerCase(),
            user_id: req.user.id
        }).first('folder_id', 'id');
        if (file === undefined) {
            return res.status(400).json({ error: `You do not have a file named ${fileName}` });
        }
        if (file.folder_id === folder.id) {
            return res.status(400).json({ error: `${fileName} already exists in ${folderName} folder` });
        }
        res.locals.fileId = file.id;
        res.locals.folderId = folder.id;
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.requireFolderAuth = requireFolderAuth;
const requireFolderQueryAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.user === undefined) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const folderName = req.query.folderName;
        if (folderName !== undefined) {
            const Folders = (0, db_1.default)('folders');
            const folder = yield Folders.where({
                name: folderName.toLowerCase(),
                user_id: req.user.id
            }).first('id');
            if (folder === undefined) {
                const newFolder = yield Folders.insert({
                    name: folderName.toLowerCase(),
                    displayName: folderName,
                    user_id: req.user.id
                }, ['id']);
                res.locals.folderId = newFolder[0].id;
            }
            else {
                res.locals.folderId = folder.id;
            }
        }
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.requireFolderQueryAuth = requireFolderQueryAuth;
