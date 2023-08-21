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
const newUser_1 = __importDefault(require("../utils/validators/newUser"));
const BodyError_1 = __importDefault(require("../utils/BodyError"));
const db_1 = __importDefault(require("../config/db"));
const hashPassword_1 = __importDefault(require("../utils/hashPassword"));
/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
class UserController {
    static create(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                (0, newUser_1.default)(req.body);
                const Users = (0, db_1.default)('users');
                const { email, password, firstName, lastName } = req.body;
                const user = yield Users.where({ email }).first();
                if (user !== undefined) {
                    res.status(400).json({ error: 'Email already taken' });
                    return;
                }
                yield Users.insert({
                    email,
                    password: yield (0, hashPassword_1.default)(password),
                    first_name: firstName,
                    last_name: lastName
                });
                res.status(201).json({
                    message: 'Sign up successful',
                    email: req.body.email
                });
            }
            catch (error) {
                console.log(error);
                if (error instanceof BodyError_1.default) {
                    res.status(400).json({ error: error.message });
                }
                else {
                    next(error);
                }
            }
        });
    }
}
exports.default = UserController;
