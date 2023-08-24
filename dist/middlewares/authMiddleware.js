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
exports.requireFolderQueryAuth = exports.requireFolderAuth = exports.requireSuperAdminAuth = exports.requireAdminAuth = exports.requireAuth = exports.requireNoAuth = void 0;
const db_1 = __importDefault(require("../config/db"));
const movefile_1 = __importDefault(require("../utils/validators/movefile"));
const BodyError_1 = __importDefault(require("../utils/BodyError"));
const requireNoAuth = (req, res, next) => {
    try {
        if (req.user !== undefined) {
            return res.status(401).json({ error: 'You are already authorized' });
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
const requireAdminAuth = (req, res, next) => {
    var _a;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.is_superuser) === true) {
            next();
            return;
        }
        return res.status(404).json({ error: 'Page not found' });
    }
    catch (error) {
        next(error);
    }
};
exports.requireAdminAuth = requireAdminAuth;
const requireSuperAdminAuth = (req, res, next) => {
    var _a;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.is_superadmin) === true) {
            next();
            return;
        }
        return res.status(401).json({ error: 'Unauthorized' });
    }
    catch (error) {
        next(error);
    }
};
exports.requireSuperAdminAuth = requireSuperAdminAuth;
const requireFolderAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (req.user === undefined) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        (0, movefile_1.default)(req.body);
        let folderName = req.params.folderName;
        const { fileName, source } = req.body;
        if (folderName === 'null') {
            folderName = null;
        }
        const Folders = (0, db_1.default)('folders');
        let destinationFolderId = null;
        if (folderName !== null) {
            const destinationFolder = yield Folders.where({
                name: folderName.toLowerCase(),
                user_id: req.user.id
            }).first();
            if (destinationFolder === undefined) {
                return res.status(404).json({ error: `You do not have a folder named ${folderName}` });
            }
            destinationFolderId = destinationFolder.id;
        }
        let sourceFolder;
        if (source !== null && source !== undefined) {
            sourceFolder = yield (0, db_1.default)('folders').where({
                name: source.toLowerCase(),
                user_id: req.user.id
            }).first();
            if (sourceFolder === undefined) {
                return res.status(404).json({ error: `You do not have a folder named ${source}` });
            }
        }
        const Files = (0, db_1.default)('files');
        const file = yield Files.where({
            name: fileName.toLowerCase(),
            user_id: req.user.id,
            folder_id: (_a = sourceFolder === null || sourceFolder === void 0 ? void 0 : sourceFolder.id) !== null && _a !== void 0 ? _a : null
        }).first('folder_id', 'id', 'history');
        if (file === undefined) {
            let message = `You do not have a file named ${fileName}`;
            if (sourceFolder !== undefined) {
                message += ` in ${source} folder`;
            }
            else {
                message += ' in root directory';
            }
            return res.status(404).json({ error: message });
        }
        if (file.folder_id === destinationFolderId) {
            let message = `${fileName} already exists in`;
            if (destinationFolderId === null) {
                message += ' root directory';
            }
            else {
                message += ` ${folderName} folder`;
            }
            return res.status(400).json({ error: message });
        }
        res.locals.fileId = file.id;
        res.locals.fileHistory = file.history;
        res.locals.source = (_b = sourceFolder === null || sourceFolder === void 0 ? void 0 : sourceFolder.name) !== null && _b !== void 0 ? _b : 'root directory';
        res.locals.folderId = destinationFolderId;
        next();
    }
    catch (error) {
        if (error instanceof BodyError_1.default) {
            return res.status(400).json({ error: error.message });
        }
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
