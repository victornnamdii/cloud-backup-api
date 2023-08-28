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
const newUser_1 = __importDefault(require("../utils/validators/newUser"));
const BodyError_1 = __importDefault(require("../utils/BodyError"));
const db_1 = __importDefault(require("../config/db"));
const hashPassword_1 = __importDefault(require("../utils/hashPassword"));
const generatePassword_1 = __importDefault(require("../utils/generatePassword"));
const newAdmin_1 = __importDefault(require("../utils/validators/newAdmin"));
const emailQueue_1 = __importDefault(require("../utils/queues/emailQueue"));
/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
class UserController {
    static create(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                (0, newUser_1.default)(req.body);
                const Users = (0, db_1.default)('users');
                const { email, password, firstName, lastName } = req.body;
                const user = yield Users.where({ email: email.toLowerCase() }).first();
                if (user !== undefined) {
                    return res.status(400).json({ error: 'Email already taken' });
                }
                const newUser = yield Users.insert({
                    email: email.toLowerCase(),
                    password: yield (0, hashPassword_1.default)(password),
                    first_name: firstName,
                    last_name: lastName,
                    isVerified: false
                }, ['id']);
                emailQueue_1.default.add({ id: newUser[0].id, email });
                return res.status(201).json({
                    message: 'Sign up successful, Please check your mail inbox/junk for a verification mail.',
                    email: req.body.email
                });
            }
            catch (error) {
                if (error instanceof BodyError_1.default) {
                    return res.status(400).json({ error: error.message });
                }
                next(error);
            }
        });
    }
    static createAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                (0, newAdmin_1.default)(req.body);
                const Users = (0, db_1.default)('users');
                const { email, firstName, lastName } = req.body;
                const user = yield Users.where({ email: email.toLowerCase() }).first();
                if (user !== undefined) {
                    return res.status(400).json({ error: 'Email already taken' });
                }
                const adminPassword = (0, generatePassword_1.default)();
                yield Users.insert({
                    email: email.toLowerCase(),
                    password: yield (0, hashPassword_1.default)(adminPassword),
                    first_name: firstName,
                    last_name: lastName,
                    is_superuser: true,
                    isVerified: true
                });
                return res.status(201).json({
                    message: 'Admin successfully created',
                    email: req.body.email,
                    password: adminPassword
                });
            }
            catch (error) {
                if (error instanceof BodyError_1.default) {
                    return res.status(400).json({ error: error.message });
                }
                next(error);
            }
        });
    }
    static verifyEmail(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId, uniqueString } = req.params;
            try {
                const verification = yield (0, db_1.default)('emailverifications')
                    .where({
                    user_id: userId,
                }).first();
                if (verification !== undefined) {
                    const user = yield (0, db_1.default)('users').where({ id: userId }).first();
                    if (user && user.isVerified) {
                        yield (0, db_1.default)('emailverifications')
                            .where({
                            user_id: userId,
                        }).del();
                        res.status(400).json({
                            error: 'User is already verified',
                        });
                        return;
                    }
                    if (verification.expires_at < new Date()) {
                        yield (0, db_1.default)('users').where({ id: userId }).del();
                        yield (0, db_1.default)('emailverifications')
                            .where({
                            user_id: userId,
                        }).del();
                        res.status(400).json({
                            error: 'Verification link has expired, Please sign up again.',
                        });
                        return;
                    }
                    const isVerified = yield bcrypt_1.default.compare(uniqueString, verification.unique_string);
                    if (isVerified) {
                        yield (0, db_1.default)('users').where({ id: userId }).update({ isVerified: true });
                        yield (0, db_1.default)('emailverifications')
                            .where({
                            user_id: userId,
                        }).del();
                        res.status(200).json({
                            message: 'You have been successfully verified'
                        });
                        return;
                    }
                }
                res.status(400).json({
                    error: 'Verification link is invalid',
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = UserController;
