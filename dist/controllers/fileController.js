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
                //   const folderId: (string | undefined) = req.query.folder_id as (string | undefined)
                const Files = (0, db_1.default)('files');
                yield Files.insert({
                    name: (_a = req.file) === null || _a === void 0 ? void 0 : _a.originalname,
                    // folder_id: folderId,
                    link: req.file.location,
                    s3_key: req.file.key,
                    user_id: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id
                });
                return res.status(201).json({ message: 'File succesfully uploaded' });
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
                    return res.status(400).json({ error: 'File already exists' });
                }
                next(error);
            }
        });
    }
}
exports.default = FileController;
