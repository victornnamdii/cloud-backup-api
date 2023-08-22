"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BodyError_1 = __importDefault(require("../BodyError"));
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
const validateFileReviewBody = (body) => {
    if (body.safe === undefined) {
        throw new BodyError_1.default('Please specify if file is safe');
    }
    if (typeof body.safe !== 'boolean') {
        throw new BodyError_1.default('Invalid value for safe');
    }
};
exports.default = validateFileReviewBody;
