"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.S3_REGION;
const s3Bucket = process.env.S3_BUCKET;
const s3 = new client_s3_1.S3({
    credentials: {
        accessKeyId,
        secretAccessKey
    },
    region
});
exports.default = s3;
