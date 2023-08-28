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
const bull_1 = __importDefault(require("bull"));
const emailVerification_1 = __importDefault(require("../emailVerification"));
const sendEmailQueue = new bull_1.default('User Verification', {
    redis: {
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
        port: Number(process.env.REDIS_PORT),
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'fixed',
            delay: 5000,
        },
    },
});
sendEmailQueue.on('error', (error) => {
    console.log('User Verification Queue Error');
    console.log(error);
});
sendEmailQueue.process((job, done) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, email } = job.data;
    console.log(`Sending User Verification mail to ${email}`);
    try {
        yield (0, emailVerification_1.default)(id, email);
    }
    catch (error) {
        // @ts-expect-error: Skip
        return done(error);
    }
    done();
}));
exports.default = sendEmailQueue;
