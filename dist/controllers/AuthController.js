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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const isUUID_1 = __importDefault(require("validator/lib/isUUID"));
const login_1 = __importDefault(require("../utils/validators/login"));
const BodyError_1 = __importDefault(require("../utils/BodyError"));
const db_1 = __importDefault(require("../config/db"));
const redis_1 = require("../config/redis");
const generateToken_1 = __importDefault(require("../utils/generateToken"));
/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
class AuthController {
    static login(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                (0, login_1.default)(req.body);
                let auth = false;
                const Users = (0, db_1.default)('users');
                const { email, password } = req.body;
                const user = yield Users.where({ email: email.toLowerCase() }).first();
                if (user !== undefined) {
                    auth = yield bcrypt_1.default.compare(password, user.password);
                    if (auth && user.isVerified) {
                        const token = yield (0, generateToken_1.default)();
                        yield (0, db_1.default)('users').where({
                            email
                        }).update({
                            updated_at: new Date(),
                            token
                        });
                        if (user.token !== null) {
                            yield redis_1.redisClient.del(`auth_${user.token}`);
                        }
                        yield redis_1.redisClient.set(`auth_${token}`, JSON.stringify(user), 1 * 24 * 60 * 60 // One day
                        );
                        return res.status(200).json({
                            message: `Welcome ${user.first_name} ${user.last_name}`,
                            id: user.id,
                            token: encodeURIComponent(token)
                        });
                    }
                    else if (auth && !user.isVerified) {
                        return res.status(401).json({ error: 'Please verify your email' });
                    }
                }
                return res.status(401).json({ error: 'Incorrect email/password' });
            }
            catch (error) {
                if (error instanceof BodyError_1.default) {
                    return res.status(400).json({ error: error.message });
                }
                console.log(error);
                next(error);
            }
        });
    }
    static logout(req, res, next) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = decodeURIComponent((_a = req.user) === null || _a === void 0 ? void 0 : _a.token);
                yield redis_1.redisClient.del(`auth_${token}`);
                const firstName = (_b = req.user) === null || _b === void 0 ? void 0 : _b.first_name;
                const lastName = (_c = req.user) === null || _c === void 0 ? void 0 : _c.last_name;
                return res.status(200).json({ message: `Goodbye ${firstName} ${lastName}` });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static revokeSession(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.params.userId;
                if (!(0, isUUID_1.default)(userId, 4)) {
                    return res.status(400).json({ error: 'Invalid user id' });
                }
                const user = yield (0, db_1.default)('users').where({ id: userId }).first();
                if (user !== undefined) {
                    if (user.token !== null) {
                        yield redis_1.redisClient.del(`auth_${user.token}`);
                    }
                    return res.status(200).json({
                        message: `${user.first_name} ${user.last_name}'s session revoked`
                    });
                }
                return res.status(404).json({ error: 'No user with specified id' });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = AuthController;
