"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BodyError_1 = __importDefault(require("../BodyError"));
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
const validateMoveFileBody = (body) => {
    if (!body.fileName || typeof body.fileName !== 'string') {
        throw new BodyError_1.default('Please enter a file name');
    }
    if (!body.source || body.source === 'null') {
        body.source = null;
    }
    if (body.source && typeof body.source !== 'string') {
        throw new BodyError_1.default('Source should be a string or null');
    }
};
exports.default = validateMoveFileBody;
