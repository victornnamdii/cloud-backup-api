"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const isEmail_1 = __importDefault(require("validator/lib/isEmail"));
const BodyError_1 = __importDefault(require("../BodyError"));
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
const validatelogInBody = (body) => {
    if (!body.email ||
        !(0, isEmail_1.default)(body.email)) {
        throw new BodyError_1.default('Please enter your email');
    }
    if (!body.password || typeof body.password !== 'string') {
        throw new BodyError_1.default('Please enter your password');
    }
};
exports.default = validatelogInBody;
