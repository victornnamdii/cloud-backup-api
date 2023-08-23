"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const generatePassword = () => {
    const buffer = (0, crypto_1.randomBytes)(8);
    return buffer.toString('base64');
};
exports.default = generatePassword;
