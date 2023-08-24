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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFound = exports.NoSuchKey = exports.createReadStream = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
Object.defineProperty(exports, "NoSuchKey", { enumerable: true, get: function () { return client_s3_1.NoSuchKey; } });
Object.defineProperty(exports, "NotFound", { enumerable: true, get: function () { return client_s3_1.NotFound; } });
const s3_readstream_1 = require("s3-readstream");
const uploadMiddleware_1 = require("../middlewares/uploadMiddleware");
const createReadStream = (key) => __awaiter(void 0, void 0, void 0, function* () {
    const bucketParams = {
        Bucket: process.env.S3_BUCKET,
        Key: key
    };
    const headObjectCommand = new client_s3_1.HeadObjectCommand(bucketParams);
    const headObject = yield uploadMiddleware_1.s3client.send(headObjectCommand);
    const options = {
        s3: uploadMiddleware_1.s3client,
        command: new client_s3_1.GetObjectCommand(bucketParams),
        maxLength: headObject.ContentLength,
        byteRange: 10 * 1024 * 1024 // 10 MiB (optional - defaults to 64kb)
    };
    return new s3_readstream_1.S3ReadStream(options);
});
exports.createReadStream = createReadStream;
