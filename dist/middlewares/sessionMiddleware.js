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
const redis_1 = require("../config/redis");
const deserializeUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const HeaderAuthorization = req.header('Authorization');
        const QueryAuthorization = req.query.token;
        if (HeaderAuthorization !== undefined && HeaderAuthorization.startsWith('Bearer ')) {
            const encodedToken = HeaderAuthorization.split(' ')[1];
            const token = decodeURIComponent(encodedToken);
            const user = yield redis_1.redisClient.get(`auth_${token}`);
            if (user !== null) {
                const userObject = JSON.parse(user);
                userObject.token = encodedToken;
                req.user = userObject;
            }
        }
        else if (QueryAuthorization !== undefined) {
            const token = decodeURIComponent(QueryAuthorization);
            const user = yield redis_1.redisClient.get(`auth_${token}`);
            if (user !== null) {
                const userObject = JSON.parse(user);
                userObject.token = encodeURIComponent(token);
                req.user = userObject;
            }
        }
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.default = deserializeUser;
