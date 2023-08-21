"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const isEmail_1 = __importDefault(require("validator/lib/isEmail"));
const BodyError_1 = __importDefault(require("../BodyError"));
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
const validateNewUserBody = (body) => {
    if (!body.email ||
        !(0, isEmail_1.default)(body.email)) {
        throw new BodyError_1.default('Please enter a valid email');
    }
    if (!body.password || typeof body.password !== 'string') {
        throw new BodyError_1.default('Please enter a password');
    }
    if (body.password.length < 6) {
        throw new BodyError_1.default('Please enter a password of atleast six(6) characters');
    }
    if (!body.firstName || typeof body.firstName !== 'string') {
        throw new BodyError_1.default('Please enter your first name');
    }
    if (!body.lastName || typeof body.lastName !== 'string') {
        throw new BodyError_1.default('Please enter your last name');
    }
};
exports.default = validateNewUserBody;
