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
const db_1 = __importDefault(require("../config/db"));
const BodyError_1 = __importDefault(require("../utils/BodyError"));
const newFile_1 = __importDefault(require("../utils/validators/newFile"));
const uploadMiddleware_1 = require("../middlewares/uploadMiddleware");
/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
class FileController {
    static addFile(req, res, next) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                (0, newFile_1.default)(req.body);
                /* eslint-disable-next-line @typescript-eslint/strict-boolean-expressions */
                if (!req.file.location) {
                    return res.status(400).json({ error: 'Please add an image' });
                }
                const folderId = res.locals.folderId;
                const Files = (0, db_1.default)('files');
                const file = yield Files.where({
                    name: req.body.name.toLowerCase(),
                    folder_id: folderId,
                    user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id
                }).first();
                if (file !== undefined) {
                    if (req.file !== undefined) {
                        yield (0, uploadMiddleware_1.deleteObject)(req.file);
                    }
                    return res.status(400).json({ error: `${req.body.name} already exists` });
                }
                yield Files.insert({
                    displayName: req.body.name,
                    name: req.body.name.toLowerCase(),
                    folder_id: res.locals.folderId,
                    link: req.file.location,
                    s3_key: req.file.key,
                    user_id: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id
                });
                return res.status(201).json({
                    message: 'File succesfully uploaded',
                    link: req.file.location
                });
            }
            catch (error) {
                if (req.file !== undefined) {
                    yield (0, uploadMiddleware_1.deleteObject)(req.file);
                }
                console.log(error);
                if (error instanceof BodyError_1.default) {
                    return res.status(400).json({ error: error.message });
                }
                /* eslint-disable @typescript-eslint/strict-boolean-expressions */
                // @ts-expect-error: Unreachable code error
                if ((_c = error === null || error === void 0 ? void 0 : error.message) === null || _c === void 0 ? void 0 : _c.includes('unique')) {
                    return res.status(400).json({ error: `${req.body.name} already exists` });
                }
                next(error);
            }
        });
    }
    static addFolder(req, res, next) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const { name } = req.body;
            try {
                (0, newFile_1.default)(req.body);
                const Folders = (0, db_1.default)('folders');
                const folder = yield Folders.where({
                    name: name.toLowerCase(),
                    user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id
                }).first();
                if (folder !== undefined) {
                    return res.status(400).json({ error: `${name} folder already exists` });
                }
                yield Folders.insert({
                    name: name.toLowerCase(),
                    displayName: name,
                    user_id: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id
                });
                res.status(201).json({ message: `${name} folder succesfully created` });
            }
            catch (error) {
                console.log(error);
                if (error instanceof BodyError_1.default) {
                    return res.status(400).json({ error: error.message });
                }
                // @ts-expect-error: Unreachable code error
                if ((_c = error === null || error === void 0 ? void 0 : error.message) === null || _c === void 0 ? void 0 : _c.includes('unique')) {
                    return res.status(400).json({ error: `${name} folder already exists` });
                }
                next(error);
            }
        });
    }
    static moveFile(req, res, next) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { fileName } = req.body;
            const { folderName } = req.params;
            try {
                const { folderId, fileId } = res.locals;
                const Files = (0, db_1.default)('files');
                yield Files.where({
                    id: fileId
                }).update({
                    folder_id: folderId,
                    updated_at: new Date()
                });
                let message = `${fileName} moved to`;
                if (folderName !== 'null') {
                    message += ` ${folderName}`;
                }
                else {
                    message += ' root directory';
                }
                return res.status(201).json({ message });
            }
            catch (error) {
                // @ts-expect-error: Unreachable code error
                if ((_a = error === null || error === void 0 ? void 0 : error.message) === null || _a === void 0 ? void 0 : _a.includes('unique')) {
                    return res.status(400).json({ error: `${fileName} already exists in ${folderName} folder` });
                }
                next(error);
            }
        });
    }
    static getAllFiles(req, res, next) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const files = yield db_1.default.where('files.user_id', (_a = req.user) === null || _a === void 0 ? void 0 : _a.id).select('files.displayName as file_name', 'link as download_link', 'folders.name as folder_name').from('files')
                    .leftJoin('folders', 'files.folder_id', 'folders.id');
                return res.status(200).json({ files });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static getAllFolders(req, res, next) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const folders = yield db_1.default.where('folders.user_id', (_a = req.user) === null || _a === void 0 ? void 0 : _a.id).select(db_1.default.raw('"folders"."displayName" as folder_name, count(files.name) as file_count')).from('folders')
                    .innerJoin('files', 'files.folder_id', 'folders.id')
                    .groupBy('folder_name');
                folders.forEach((folder) => {
                    folder.file_count = Number(folder.file_count);
                });
                return res.status(200).json({ folders });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = FileController;
