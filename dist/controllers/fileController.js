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
const isUUID_1 = __importDefault(require("validator/lib/isUUID"));
const db_1 = __importDefault(require("../config/db"));
const BodyError_1 = __importDefault(require("../utils/BodyError"));
const newFile_1 = __importDefault(require("../utils/validators/newFile"));
const uploadMiddleware_1 = require("../middlewares/uploadMiddleware");
const fileReview_1 = __importDefault(require("../utils/validators/fileReview"));
const newFolder_1 = __importDefault(require("../utils/validators/newFolder"));
const s3_1 = require("../utils/s3");
const updateFolder_1 = __importDefault(require("../utils/validators/updateFolder"));
const updateFile_1 = __importDefault(require("../utils/validators/updateFile"));
/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
class FileController {
    static addFile(req, res, next) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            let name;
            let displayName;
            try {
                (0, newFile_1.default)(req.body);
                /* eslint-disable-next-line @typescript-eslint/strict-boolean-expressions */
                if (!req.file.location) {
                    return res.status(400).json({ error: 'Please add a file' });
                }
                const folderId = res.locals.folderId;
                if (req.body.name !== undefined) {
                    name = req.body.name.toLowerCase();
                    displayName = req.body.name;
                }
                else {
                    name = req.file.originalname.toLowerCase();
                    displayName = req.file.originalname;
                }
                const Files = (0, db_1.default)('files');
                const file = yield Files.where({
                    name,
                    folder_id: folderId !== null && folderId !== void 0 ? folderId : null,
                    user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id
                }).first();
                if (file !== undefined) {
                    if (req.file !== undefined) {
                        yield (0, uploadMiddleware_1.deleteObject)(req.file);
                    }
                    return res.status(400).json({ error: `${displayName} already exists` });
                }
                const newFile = yield Files.insert({
                    displayName,
                    name,
                    folder_id: folderId !== null && folderId !== void 0 ? folderId : null,
                    link: req.file.location,
                    s3_key: req.file.key,
                    user_id: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id,
                    mimetype: req.file.mimetype,
                    history: JSON.stringify([{ event: 'Created', date: new Date() }])
                }, ['id']);
                return res.status(201).json({
                    message: 'File succesfully uploaded',
                    id: newFile[0].id,
                    folderId: folderId !== null && folderId !== void 0 ? folderId : null
                });
            }
            catch (error) {
                if (req.file !== undefined) {
                    (0, uploadMiddleware_1.deleteObject)(req.file)
                        .then()
                        .catch(() => {
                        console.log('Bad Request');
                    });
                }
                console.log(error);
                if (error instanceof BodyError_1.default) {
                    return res.status(400).json({ error: error.message });
                }
                /* eslint-disable @typescript-eslint/strict-boolean-expressions */
                // @ts-expect-error: Unreachable code error
                if ((_c = error === null || error === void 0 ? void 0 : error.message) === null || _c === void 0 ? void 0 : _c.includes('unique')) {
                    return res.status(400).json({ error: `${displayName} already exists` });
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
                (0, newFolder_1.default)(req.body);
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
                const { folderId, fileId, fileHistory, source } = res.locals;
                let message = `${fileName} moved from ${source} to `;
                if (folderName !== 'null') {
                    message += `${folderName}`;
                }
                else {
                    message += 'root directory';
                }
                const date = new Date();
                fileHistory.push({ event: message, date });
                const Files = (0, db_1.default)('files');
                yield Files.where({
                    id: fileId
                }).update({
                    folder_id: folderId,
                    history: JSON.stringify(fileHistory),
                    updated_at: date
                });
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
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let files;
                if ((_a = req.user) === null || _a === void 0 ? void 0 : _a.is_superuser) {
                    files = yield db_1.default.where('files.user_id', (_b = req.user) === null || _b === void 0 ? void 0 : _b.id).select('files.id as file_id', 'files.displayName as file_name', 'folders.displayName as folder_name').from('files')
                        .leftJoin('folders', 'files.folder_id', 'folders.id');
                }
                else {
                    files = yield db_1.default
                        .select('files.id as file_id', 'files.displayName as file_name', 'folders.displayName as folder_name', 'files.history as file_history').from('files')
                        .leftJoin('folders', 'files.folder_id', 'folders.id');
                }
                return res.status(200).json({ files });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static getFolderFiles(req, res, next) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { folderName } = req.params;
                const subquery = yield (0, db_1.default)('folders')
                    .where({
                    user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
                    name: folderName.toLowerCase()
                }).first('id');
                if (subquery === undefined) {
                    return res.status(404).json({ error: `You do not have a folder named ${folderName}` });
                }
                const files = yield (0, db_1.default)('files')
                    .where('folder_id', '=', subquery.id)
                    .select('files.id as file_id', 'files.displayName as file_name');
                return res.status(200).json({ files });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static localGetFolderFiles(folderId) {
        return __awaiter(this, void 0, void 0, function* () {
            const files = yield (0, db_1.default)('files')
                .where('folder_id', '=', folderId)
                .select('s3_key');
            return files;
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
    static updateFolder(req, res, next) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                (0, updateFolder_1.default)(req.body);
                const { folderName } = req.params;
                const updates = { updated_at: new Date() };
                if (req.body.name !== undefined) {
                    // @ts-expect-error: Unreachable code error
                    updates.name = req.body.name.toLowerCase();
                    // @ts-expect-error: Unreachable code error
                    updates.displayName = req.body.name;
                }
                if (Object.keys(updates).length > 1) {
                    const subquery = yield (0, db_1.default)('folders')
                        .where({
                        user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
                        name: folderName.toLowerCase()
                    }).first('id');
                    if (subquery === undefined) {
                        return res.status(404).json({ error: `You do not have a folder named ${folderName}` });
                    }
                    yield (0, db_1.default)('folders')
                        .update(updates)
                        .where('id', '=', subquery.id);
                    return res.status(201).json({
                        // @ts-expect-error: Unreachable code error
                        message: `${folderName} folder successfully updated to ${updates.displayName}`
                    });
                }
                return res.status(400).json({ error: 'No field specified to update' });
            }
            catch (error) {
                if (error instanceof BodyError_1.default) {
                    return res.status(400).json({ error: error.message });
                }
                next(error);
            }
        });
    }
    static updateFile(req, res, next) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                (0, updateFile_1.default)(req.body);
                const fileId = req.params.fileId;
                if (!(0, isUUID_1.default)(fileId, 4)) {
                    return res.status(400).json({ error: 'Invalid file id' });
                }
                const date = new Date();
                const updates = { updated_at: date, history: '[]' };
                if (req.body.name !== undefined) {
                    // @ts-expect-error: Unreachable code error
                    updates.name = req.body.name.toLowerCase();
                    // @ts-expect-error: Unreachable code error
                    updates.displayName = req.body.name;
                }
                if (Object.keys(updates).length > 2) {
                    const subquery = yield (0, db_1.default)('files')
                        .where({
                        user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
                        id: fileId
                    }).first('id', 'displayName', 'history');
                    if (subquery === undefined) {
                        return res.status(404).json({ error: `You do not have a file with id ${fileId}` });
                    }
                    // @ts-expect-error: Unreachable code error
                    const message = `Name changed from ${subquery.displayName} to ${updates.displayName}`;
                    const fileHistory = subquery.history;
                    fileHistory.push({ event: message, date });
                    updates.history = JSON.stringify(fileHistory);
                    yield (0, db_1.default)('files')
                        .update(updates)
                        .where('id', '=', fileId);
                    return res.status(201).json({ message });
                }
                return res.status(400).json({ error: 'No field specified to update' });
            }
            catch (error) {
                if (error instanceof BodyError_1.default) {
                    return res.status(400).json({ error: error.message });
                }
                next(error);
            }
        });
    }
    static deleteFile(req, res, next) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fileId = req.params.fileId;
                if (!(0, isUUID_1.default)(fileId, 4)) {
                    return res.status(400).json({ error: 'Invalid file id' });
                }
                const subquery = yield (0, db_1.default)('files')
                    .where({
                    user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
                    id: fileId
                }).first('id', 'displayName', 's3_key');
                if (subquery === undefined) {
                    return res.status(404).json({ error: `You do not have a file with id ${fileId}` });
                }
                yield (0, uploadMiddleware_1.deleteObject)({ key: subquery.s3_key });
                yield (0, db_1.default)('files')
                    .del()
                    .where('id', '=', fileId);
                return res.status(201).json({
                    message: `${subquery.displayName} successfully deleted`
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static deleteFolder(req, res, next) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { folderName } = req.params;
                const subquery = yield (0, db_1.default)('folders')
                    .where({
                    user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
                    name: folderName.toLowerCase()
                }).first('id');
                if (subquery === undefined) {
                    return res.status(404).json({ error: `You do not have a folder named ${folderName}` });
                }
                const folderFiles = yield FileController.localGetFolderFiles(subquery.id);
                folderFiles.forEach((file) => {
                    (0, uploadMiddleware_1.deleteObject)({ key: file.s3_key })
                        .then(() => {
                        console.log(`Deleted ${file.s3_key}`);
                    })
                        .catch(() => {
                        console.log(`Didn't delete ${file.s3_key}`);
                    });
                });
                yield (0, db_1.default)('folders')
                    .del()
                    .where('id', '=', subquery.id);
                return res.status(201).json({
                    message: `${folderName} successfully deleted`
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static download(req, res, next) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fileId = req.params.fileId;
                if (!(0, isUUID_1.default)(fileId, 4)) {
                    return res.status(400).json({ error: 'Invalid file id' });
                }
                const Files = (0, db_1.default)('files');
                let file;
                if ((_a = req.user) === null || _a === void 0 ? void 0 : _a.is_superuser) {
                    file = yield Files.where({
                        id: fileId
                    }).first('id', 's3_key', 'mimetype');
                }
                else {
                    file = yield Files.where({
                        user_id: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id,
                        id: fileId
                    }).first('id', 's3_key', 'mimetype');
                }
                if (file === undefined) {
                    return res.status(404).json({ error: 'File not found. Please check file id in the URL.' });
                }
                const stream = yield (0, s3_1.createReadStream)(file.s3_key);
                stream.pipe(res);
            }
            catch (error) {
                if (error instanceof s3_1.NoSuchKey) {
                    return res.status(404).json({ error: 'File not found in storage' });
                }
                next(error);
            }
        });
    }
    static stream(req, res, next) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fileId = req.params.fileId;
                if (!(0, isUUID_1.default)(fileId, 4)) {
                    return res.status(400).json({ error: 'Invalid file id' });
                }
                const Files = (0, db_1.default)('files');
                let file;
                if ((_a = req.user) === null || _a === void 0 ? void 0 : _a.is_superuser) {
                    file = yield Files.where({
                        id: fileId
                    }).first('id', 's3_key', 'mimetype');
                }
                else {
                    file = yield Files.where({
                        user_id: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id,
                        id: fileId
                    }).first('id', 's3_key', 'mimetype');
                }
                if (file === undefined) {
                    return res.status(404).json({ error: 'File not found. Please check file id in the URL.' });
                }
                if (!file.mimetype.startsWith('video') && !file.mimetype.startsWith('audio')) {
                    return res.status(400).json({ error: 'File requested for is neither a video nor audio' });
                }
                res.render('stream', { file, token: (_c = req.user) === null || _c === void 0 ? void 0 : _c.token });
            }
            catch (error) {
                if (error instanceof s3_1.NoSuchKey) {
                    return res.status(404).json({ error: 'File not found in storage' });
                }
                next(error);
            }
        });
    }
    static review(req, res, next) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                (0, fileReview_1.default)(req.body);
                const date = new Date();
                const fileId = req.params.fileId;
                if (!(0, isUUID_1.default)(fileId, 4)) {
                    return res.status(400).json({ error: 'Invalid file id' });
                }
                const Files = (0, db_1.default)('files');
                const file = yield Files.where({
                    id: fileId
                }).first('s3_key', 'displayName', 'false_review_by', 'history');
                if (file === undefined) {
                    return res.status(404).json({ error: 'File not found. Please check file id in the URL.' });
                }
                const falseAdminReviews = file.false_review_by;
                const fileHistory = file.history;
                const safe = req.body.safe;
                let message;
                if (!safe && !falseAdminReviews.includes((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
                    message = `${file.displayName} marked as unsafe by an Admin`;
                    fileHistory.push({ event: message, date });
                    falseAdminReviews.push((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
                    yield (0, db_1.default)('files').where({
                        id: fileId
                    }).update({
                        updated_at: date,
                        history: JSON.stringify(fileHistory),
                        false_review_by: JSON.stringify(falseAdminReviews)
                    });
                }
                else if (!safe && falseAdminReviews.includes((_c = req.user) === null || _c === void 0 ? void 0 : _c.id)) {
                    message = `${file.displayName} already marked as unsafe by you`;
                }
                else if (safe && falseAdminReviews.includes((_d = req.user) === null || _d === void 0 ? void 0 : _d.id)) {
                    const index = falseAdminReviews.indexOf((_e = req.user) === null || _e === void 0 ? void 0 : _e.id);
                    falseAdminReviews.splice(index, 1);
                    message = `${file.displayName} marked as safe by an Admin that marked as unsafe previously`;
                    fileHistory.push({ event: message, date });
                    yield (0, db_1.default)('files').where({
                        id: fileId
                    }).update({
                        updated_at: date,
                        history: JSON.stringify(fileHistory),
                        false_review_by: JSON.stringify(falseAdminReviews)
                    });
                }
                else {
                    message = `${file.displayName} marked as safe by an Admin`;
                    fileHistory.push({ event: message, date });
                    yield (0, db_1.default)('files').where({
                        id: fileId
                    }).update({
                        updated_at: date,
                        history: JSON.stringify(fileHistory)
                    });
                }
                if (falseAdminReviews.length >= 3) {
                    yield (0, uploadMiddleware_1.deleteObject)({ key: file.s3_key });
                    yield (0, db_1.default)('files').where({
                        id: fileId
                    }).del();
                    res.status(201).json({
                        message: `${file.displayName} marked as unsafe by 3 admins and automatically deleted`
                    });
                }
                else {
                    res.status(201).json({ message });
                }
            }
            catch (error) {
                if (error instanceof BodyError_1.default) {
                    return res.status(400).json({ error: error.message });
                }
                next(error);
            }
        });
    }
}
exports.default = FileController;
