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
exports.NoSuchKey = exports.getObject = exports.createReadStream = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
Object.defineProperty(exports, "NoSuchKey", { enumerable: true, get: function () { return client_s3_1.NoSuchKey; } });
const s3_readstream_1 = require("s3-readstream");
const uploadMiddleware_1 = require("../middlewares/uploadMiddleware");
const BodyError_1 = __importDefault(require("./BodyError"));
const createReadStream = (key) => __awaiter(void 0, void 0, void 0, function* () {
    const bucketParams = {
        Bucket: process.env.S3_BUCKET,
        Key: key
    };
    const headObjectCommand = new client_s3_1.HeadObjectCommand(bucketParams);
    const headObject = yield uploadMiddleware_1.s3client.send(headObjectCommand);
    const contentType = headObject.ContentType;
    if (contentType.startsWith('audio') ||
        !contentType.startsWith('video')) {
        throw new BodyError_1.default('File requested is neither a video nor audio');
    }
    const options = {
        s3: uploadMiddleware_1.s3client,
        command: new client_s3_1.GetObjectCommand(bucketParams),
        maxLength: headObject.ContentLength
        // byteRange: 1024 * 1024 // 1 MiB (optional - defaults to 64kb)
    };
    return new s3_readstream_1.S3ReadStream(options);
});
exports.createReadStream = createReadStream;
const getObject = (key) => __awaiter(void 0, void 0, void 0, function* () {
});
exports.getObject = getObject;
