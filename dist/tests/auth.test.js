"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const chai_1 = __importStar(require("chai"));
const mocha_1 = require("mocha");
const dotenv_1 = __importDefault(require("dotenv"));
const chai_http_1 = __importDefault(require("chai-http"));
const uuid_1 = require("uuid");
const db_1 = __importDefault(require("../config/db"));
const server_1 = __importDefault(require("../server"));
const hashPassword_1 = __importDefault(require("../utils/hashPassword"));
const redis_1 = require("../config/redis");
dotenv_1.default.config();
chai_1.default.use(chai_http_1.default);
(0, mocha_1.describe)('Authentication Tests', () => {
    (0, mocha_1.before)(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, db_1.default)('users')
            .where({ email: process.env.TESTS_MAIL })
            .del();
        yield (0, db_1.default)('users')
            .insert({
            email: process.env.TESTS_MAIL,
            password: yield (0, hashPassword_1.default)('test123'),
            first_name: 'Victor',
            last_name: 'Ilodiuba'
        });
    }));
    (0, mocha_1.after)(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, db_1.default)('users')
            .where({ email: process.env.TESTS_MAIL })
            .del();
    }));
    (0, mocha_1.describe)('POST /login', () => {
        (0, mocha_1.it)('should log user in', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('message', 'Welcome Victor Ilodiuba');
            (0, chai_1.expect)(res.body).to.have.property('token');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(res.body.token)}`);
        }));
        (0, mocha_1.it)('should not log user in', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'wrongpassword'
            });
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Incorrect email/password');
            (0, chai_1.expect)(res.body).to.not.have.property('token');
        }));
        (0, mocha_1.it)('should not log user in, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.WRONG_TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Incorrect email/password');
            (0, chai_1.expect)(res.body).to.not.have.property('token');
        }));
        (0, mocha_1.it)('should log user in, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('message', 'Welcome Victor Ilodiuba');
            (0, chai_1.expect)(res.body).to.have.property('token');
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            }).set('Authorization', `Bearer ${res.body.token}`);
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('token');
            const token2 = res.body.token;
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token2)}`);
        }));
        (0, mocha_1.it)('should log user in, alt 2', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('message', 'Welcome Victor Ilodiuba');
            (0, chai_1.expect)(res.body).to.have.property('token');
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default)
                .post(`/login?token=${res.body.token}`).send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('token');
            const token2 = res.body.token;
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token2)}`);
        }));
        (0, mocha_1.it)('should return no email error', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/login').send({
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter your email');
            (0, chai_1.expect)(res.body).to.not.have.property('token');
        }));
        (0, mocha_1.it)('should return empty email error', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: '',
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter a valid email');
            (0, chai_1.expect)(res.body).to.not.have.property('token');
        }));
        (0, mocha_1.it)('should return no email error, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: null,
                password: 'test'
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter your email');
            (0, chai_1.expect)(res.body).to.not.have.property('token');
        }));
        (0, mocha_1.it)('should return no email error, alt 2', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: undefined,
                password: 'test'
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter your email');
            (0, chai_1.expect)(res.body).to.not.have.property('token');
        }));
        (0, mocha_1.it)('should return no email error, alt 3', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: true,
                password: 'test'
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter your email');
            (0, chai_1.expect)(res.body).to.not.have.property('token');
        }));
        (0, mocha_1.it)('should return valid email error', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: 'invalidemail',
                password: 'test'
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter a valid email');
            (0, chai_1.expect)(res.body).to.not.have.property('token');
        }));
        (0, mocha_1.it)('should return password error', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: 'invalidemail@gmail.com',
                password: undefined
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter a password');
            (0, chai_1.expect)(res.body).to.not.have.property('token');
        }));
        (0, mocha_1.it)('should return password error, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: 'invalidemail@gmail.com',
                password: null
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter a password');
            (0, chai_1.expect)(res.body).to.not.have.property('token');
        }));
        (0, mocha_1.it)('should return password error, alt 2', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: 'invalidemail@gmail.com',
                password: true
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter a password');
            (0, chai_1.expect)(res.body).to.not.have.property('token');
        }));
        (0, mocha_1.it)('should return password error, alt 3', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: 'invalidemail@gmail.com',
                password: false
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter a password');
            (0, chai_1.expect)(res.body).to.not.have.property('token');
        }));
    });
    (0, mocha_1.describe)('GET /logout', () => {
        (0, mocha_1.it)('should log user out', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('message', 'Welcome Victor Ilodiuba');
            (0, chai_1.expect)(res.body).to.have.property('token');
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).get('/logout')
                .set('Authorization', `Bearer ${res.body.token}`);
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('message', 'Goodbye Victor Ilodiuba');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should log user out, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('message', 'Welcome Victor Ilodiuba');
            (0, chai_1.expect)(res.body).to.have.property('token');
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default)
                .get(`/logout?token=${res.body.token}`);
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('message', 'Goodbye Victor Ilodiuba');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say unauthorized', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default)
                .get('/logout?token=wrongtoken');
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
        }));
        (0, mocha_1.it)('should say unauthorized, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default)
                .get('/logout')
                .set('Authorization', 'wrongtoken');
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
        }));
        (0, mocha_1.it)('should say unauthorized, alt 2', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('message', 'Welcome Victor Ilodiuba');
            (0, chai_1.expect)(res.body).to.have.property('token');
            const token = res.body.token;
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
            res = yield chai_1.default.request(server_1.default).get('/logout')
                .set('Authorization', `Bearer ${res.body.token}`);
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
        }));
        (0, mocha_1.it)('should say unauthorized, alt 3', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('message', 'Welcome Victor Ilodiuba');
            (0, chai_1.expect)(res.body).to.have.property('token');
            const token = res.body.token;
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
            res = yield chai_1.default.request(server_1.default)
                .get(`/logout?token=${res.body.token}`);
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
        }));
    });
    (0, mocha_1.describe)('DELETE /session/:userId', () => {
        (0, mocha_1.it)('should revoke user\'s session', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('message', 'Welcome Victor Ilodiuba');
            (0, chai_1.expect)(res.body).to.have.property('token');
            const userToken = res.body.token;
            const userId = res.body.id;
            res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('token');
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).delete(`/session/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('message', 'Victor Ilodiuba\'s session revoked');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(userToken)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
        }));
        (0, mocha_1.it)('should say unauthorized', () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, db_1.default)('users')
                .insert({
                email: 'lowadmin@gmail.com',
                password: yield (0, hashPassword_1.default)('test123'),
                first_name: 'Victor',
                last_name: 'Ilodiuba',
                is_superuser: true
            });
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('message', 'Welcome Victor Ilodiuba');
            (0, chai_1.expect)(res.body).to.have.property('token');
            const userToken = res.body.token;
            const userId = res.body.id;
            res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: 'lowadmin@gmail.com',
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('token');
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).delete(`/session/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(userToken)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
            yield (0, db_1.default)('users')
                .where({ email: 'lowadmin@gmail.com' })
                .del();
        }));
        (0, mocha_1.it)('should revoke user\'s session, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('message', 'Welcome Victor Ilodiuba');
            (0, chai_1.expect)(res.body).to.have.property('token');
            const userToken = res.body.token;
            const userId = res.body.id;
            res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('token');
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).delete(`/session/${userId}?token=${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('message', 'Victor Ilodiuba\'s session revoked');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(userToken)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
        }));
        (0, mocha_1.it)('should say unauthorized, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('message', 'Welcome Victor Ilodiuba');
            (0, chai_1.expect)(res.body).to.have.property('token');
            const userToken = res.body.token;
            const userId = res.body.id;
            res = yield chai_1.default.request(server_1.default).delete(`/session/${userId}`)
                .set('Authorization', `Bearer ${userToken}`);
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(userToken)}`);
        }));
        (0, mocha_1.it)('should say unauthorized, alt 2', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('message', 'Welcome Victor Ilodiuba');
            (0, chai_1.expect)(res.body).to.have.property('token');
            const userToken = res.body.token;
            const userId = res.body.id;
            res = yield chai_1.default.request(server_1.default).delete(`/session/${userId}`);
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(userToken)}`);
        }));
        (0, mocha_1.it)('should say invalid id', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('message', 'Welcome Victor Ilodiuba');
            (0, chai_1.expect)(res.body).to.have.property('token');
            const userToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('token');
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).delete('/session/invalidid')
                .set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Invalid user id');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(userToken)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
        }));
        (0, mocha_1.it)('should say no user found', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('message', 'Welcome Victor Ilodiuba');
            (0, chai_1.expect)(res.body).to.have.property('token');
            const userToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('token');
            const adminToken = res.body.token;
            const users = yield (0, db_1.default)('users')
                .select('id');
            const ids = [];
            users.forEach((user) => {
                ids.push(user.id);
            });
            const wronguuid = () => {
                const uuid = (0, uuid_1.v4)();
                if (ids.includes(uuid)) {
                    wronguuid();
                }
                else {
                    return uuid;
                }
            };
            res = yield chai_1.default.request(server_1.default).delete(`/session/${wronguuid()}`)
                .set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(404);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'No user with specified id');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(userToken)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
        }));
    });
});
