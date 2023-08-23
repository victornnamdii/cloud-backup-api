"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const isEmail_1 = __importDefault(require("validator/lib/isEmail"));
const BodyError_1 = __importDefault(require("../BodyError"));
const validatelogInBody = (body) => {
    if (body.email === undefined ||
        body.email === null ||
        typeof body.email !== 'string') {
        throw new BodyError_1.default('Please enter your email');
    }
    const email = body.email;
    body.email = email.toLowerCase().trim();
    if (!(0, isEmail_1.default)(body.email)) {
        throw new BodyError_1.default('Please enter a valid email');
    }
    if (body.password === undefined || typeof body.password !== 'string') {
        throw new BodyError_1.default('Please enter a password');
    }
};
exports.default = validatelogInBody;
