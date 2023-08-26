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
const crypto_1 = require("crypto");
const redis_1 = require("../config/redis");
const generateKey = () => {
    const buffer = (0, crypto_1.randomBytes)(32);
    return buffer.toString('base64');
};
const generateToken = () => __awaiter(void 0, void 0, void 0, function* () {
    const auth = generateKey();
    if ((yield redis_1.redisClient.get(`auth_${auth}`)) !== null) {
        generateToken();
    }
    else {
        return auth;
    }
});
exports.default = generateToken;
