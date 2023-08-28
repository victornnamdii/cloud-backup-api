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
const nodemailer_1 = __importDefault(require("nodemailer"));
const uuid_1 = require("uuid");
const hashPassword_1 = __importDefault(require("./hashPassword"));
const db_1 = __importDefault(require("../config/db"));
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    pool: true,
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
    },
});
const sendVerificationEmail = (id, email) => __awaiter(void 0, void 0, void 0, function* () {
    const prefixUrl = process.env.HOST;
    const uniqueString = (0, uuid_1.v4)() + id;
    const mailOptions = {
        from: 'CLOUD BACKUP',
        to: email,
        subject: 'Please verify your Email',
        html: `<p>Please click the link below to verify your email.</p><p>The link <b>expires in 6 hours</b>.</p><p>Click <a href=${`${prefixUrl}/users/verify-email/${id}/${uniqueString}`}>here</a> to verify</p>`,
    };
    try {
        const hashedString = yield (0, hashPassword_1.default)(uniqueString);
        const alreadyExists = yield (0, db_1.default)('emailverifications')
            .where({ user_id: id })
            .first();
        if (alreadyExists !== undefined) {
            yield (0, db_1.default)('emailverifications')
                .where({ user_id: id })
                .del();
        }
        const now = new Date();
        now.setHours(now.getHours() + 6);
        yield (0, db_1.default)('emailverifications').insert({
            user_id: id,
            unique_string: hashedString,
            expires_at: now,
        });
        yield transporter.sendMail(mailOptions);
        console.log(`Sent User Verification mail to ${email}`);
        // console.log('Sent');
    }
    catch (err) {
        console.log(`Didn't send User Verification mail to ${email}`);
        console.log(err);
        throw err;
    }
});
exports.default = sendVerificationEmail;
