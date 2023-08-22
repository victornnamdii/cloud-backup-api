"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BodyError_1 = __importDefault(require("../BodyError"));
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
const validateNewFileBody = (body) => {
    if (!body.name || typeof body.name !== 'string') {
        throw new BodyError_1.default('Please enter a valid email');
    }
};
exports.default = validateNewFileBody;
