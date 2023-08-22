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
                const user = yield Users.where({ email }).first();
                if (user !== undefined) {
                    auth = yield bcrypt_1.default.compare(password, user.password);
                    if (auth) {
                        const token = (0, generateToken_1.default)();
                        yield redis_1.redisClient.set(`auth_${token}`, JSON.stringify(user), 1 * 24 * 60 * 60 // One day
                        );
                        return res.status(200).json({
                            message: `Welcome ${user.first_name} ${user.last_name}`,
                            token
                        });
                    }
                }
                return res.status(401).json({ error: 'Incorrect email/password' });
            }
            catch (error) {
                console.log(error);
                if (error instanceof BodyError_1.default) {
                    return res.status(400).json({ error: error.message });
                }
                next(error);
            }
        });
    }
    static logout(req, res, next) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const Authorization = req.header('Authorization');
                const token = Authorization.split(' ')[1];
                yield redis_1.redisClient.del(`auth_${token}`);
                const firstName = (_a = req.user) === null || _a === void 0 ? void 0 : _a.first_name;
                const lastName = (_b = req.user) === null || _b === void 0 ? void 0 : _b.last_name;
                return res.status(200).json({ message: `Goodbye ${firstName} ${lastName}` });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = AuthController;
