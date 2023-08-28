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
const cron_1 = __importDefault(require("cron"));
const db_1 = __importDefault(require("../../config/db"));
const clearVerifications = new cron_1.default.CronJob('0 * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Searching for Expired Verifications');
        const userVerifications = yield (0, db_1.default)('emailverifications')
            .where('expires_at', '<', new Date());
        console.log('Deleting Expired Verifications');
        userVerifications.forEach((userVerification) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const user = yield (0, db_1.default)('users').where({ id: userVerification.user_id }).first();
                if (user && !user.isVerified) {
                    yield (0, db_1.default)('users').where({ id: userVerification.user_id }).del();
                }
                yield (0, db_1.default)('emailverifications')
                    .where({ user_id: userVerification.user_id }).del();
            }
            catch (error) {
                console.log(error);
            }
        }));
        console.log('Deleted Expired Verifications');
    }
    catch (error) {
        console.log(error);
    }
}));
exports.default = clearVerifications;
