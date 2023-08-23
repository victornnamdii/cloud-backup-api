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
exports.s3client = exports.deleteObject = exports.uploadToS3 = void 0;
const multer_1 = __importDefault(require("multer"));
const multer_s3_1 = __importDefault(require("multer-s3"));
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.S3_REGION;
const s3Bucket = process.env.S3_BUCKET;
const s3client = new client_s3_1.S3Client({
    credentials: {
        accessKeyId,
        secretAccessKey
    },
    region
});
exports.s3client = s3client;
const deleteObject = (file) => __awaiter(void 0, void 0, void 0, function* () {
    const deleteCommand = new client_s3_1.DeleteObjectCommand({
        Bucket: s3Bucket,
        Key: file.key
    });
    yield s3client.send(deleteCommand);
});
exports.deleteObject = deleteObject;
const s3Storage = (0, multer_s3_1.default)({
    s3: s3client,
    bucket: s3Bucket,
    metadata: (req, file, cb) => {
        cb(null, { fieldname: file.fieldname });
    },
    key: (req, file, cb) => {
        const fileName = `risevest_cloud_${(0, uuid_1.v4)()}_${file.originalname}`;
        cb(null, fileName);
    }
});
const checkFile = (file, cb) => {
    //
    cb(null, true);
};
const multerAgent = (0, multer_1.default)({
    storage: s3Storage,
    fileFilter: (req, file, callback) => {
        checkFile(file, callback);
    },
    limits: {
        fileSize: 200 * 1024 * 1024 // 200 MB
    }
});
const upload = multerAgent.single('file');
const uploadToS3 = (req, res, next) => {
    try {
        upload(req, res, (err) => {
            /* eslint-disable @typescript-eslint/strict-boolean-expressions */
            if (err) {
                if (req.file !== undefined) {
                    deleteObject(req.file)
                        .then()
                        .catch(() => {
                        console.log('Bad Request');
                    });
                }
                if (err instanceof multer_1.default.MulterError) {
                    return res.status(400).json({ error: err.message });
                }
                else {
                    console.log(err);
                    return res.status(400).json({
                        error: 'Error uploading image'
                    });
                }
            }
            next();
        });
    }
    catch (error) {
        if (req.file !== undefined) {
            deleteObject(req.file)
                .then()
                .catch(() => {
                console.log('Bad Request');
            });
        }
        next(error);
    }
};
exports.uploadToS3 = uploadToS3;
