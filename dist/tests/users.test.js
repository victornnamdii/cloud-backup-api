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
const db_1 = __importDefault(require("../config/db"));
const server_1 = __importDefault(require("../server"));
const redis_1 = require("../config/redis");
dotenv_1.default.config();
chai_1.default.use(chai_http_1.default);
(0, mocha_1.describe)('User Tests', () => {
    (0, mocha_1.before)(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, db_1.default)('users')
            .where({ email: process.env.TESTS_MAIL })
            .del();
    }));
    (0, mocha_1.after)(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, db_1.default)('users')
            .where({ email: process.env.TESTS_MAIL })
            .del();
    }));
    (0, mocha_1.describe)('POST /signup', () => {
        (0, mocha_1.after)(() => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, db_1.default)('users')
                .where({ email: process.env.TESTS_MAIL })
                .del();
        }));
        (0, mocha_1.it)('should create a new user', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/signup').send({
                email: process.env.TESTS_MAIL,
                password: 'test123',
                firstName: 'Victor',
                lastName: 'Ilodiuba'
            });
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('message', 'Sign up successful');
            (0, chai_1.expect)(res.body).to.have.property('email', process.env.TESTS_MAIL);
        }));
        (0, mocha_1.it)('should say email already taken', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/signup').send({
                email: process.env.TESTS_MAIL,
                password: 'test123',
                firstName: 'Victor',
                lastName: 'Ilodiuba'
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Email already taken');
        }));
        (0, mocha_1.it)('should return email error', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/signup').send({
                email: undefined,
                password: 'test123',
                firstName: 'Victor',
                lastName: 'Ilodiuba'
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter your email');
        }));
        (0, mocha_1.it)('should return email error, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/signup').send({
                email: null,
                password: 'test123',
                firstName: 'Victor',
                lastName: 'Ilodiuba'
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter your email');
        }));
        (0, mocha_1.it)('should return email error, alt 2', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/signup').send({
                email: true,
                password: 'test123',
                firstName: 'Victor',
                lastName: 'Ilodiuba'
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter your email');
        }));
        (0, mocha_1.it)('should return email error, alt 3', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/signup').send({
                email: 'invalidemail',
                password: 'test123',
                firstName: 'Victor',
                lastName: 'Ilodiuba'
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter a valid email');
        }));
        (0, mocha_1.it)('should return email error, alt 4', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/signup').send({
                email: '',
                password: 'test123',
                firstName: 'Victor',
                lastName: 'Ilodiuba'
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter a valid email');
        }));
        (0, mocha_1.it)('should return password error', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/signup').send({
                email: process.env.TESTS_MAIL,
                firstName: 'Victor',
                lastName: 'Ilodiuba'
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter a password');
        }));
        (0, mocha_1.it)('should return password error, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/signup').send({
                email: process.env.TESTS_MAIL,
                password: undefined,
                firstName: 'Victor',
                lastName: 'Ilodiuba'
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter a password');
        }));
        (0, mocha_1.it)('should return password error, alt 2', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/signup').send({
                email: process.env.TESTS_MAIL,
                password: true,
                firstName: 'Victor',
                lastName: 'Ilodiuba'
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter a password');
        }));
        (0, mocha_1.it)('should return password error, alt 3', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/signup').send({
                email: process.env.TESTS_MAIL,
                password: 'short',
                firstName: 'Victor',
                lastName: 'Ilodiuba'
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter a password of atleast six(6) characters');
        }));
        (0, mocha_1.it)('should return first name error', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/signup').send({
                email: process.env.TESTS_MAIL,
                password: 'notshort',
                firstName: undefined,
                lastName: 'Ilodiuba'
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter your first name');
        }));
        (0, mocha_1.it)('should return first name error, alt ', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/signup').send({
                email: process.env.TESTS_MAIL,
                password: 'notshort',
                firstName: true,
                lastName: 'Ilodiuba'
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter your first name');
        }));
        (0, mocha_1.it)('should return first name error, alt 2', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/signup').send({
                email: process.env.TESTS_MAIL,
                password: 'notshort',
                lastName: 'Ilodiuba'
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter your first name');
        }));
        (0, mocha_1.it)('should return first name error, alt 3', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/signup').send({
                email: process.env.TESTS_MAIL,
                password: 'notshort',
                firstName: '',
                lastName: 'Ilodiuba'
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter your first name');
        }));
        (0, mocha_1.it)('should return last name error', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/signup').send({
                email: process.env.TESTS_MAIL,
                password: 'notshort',
                firstName: 'true',
                lastName: undefined
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter your last name');
        }));
        (0, mocha_1.it)('should return last name error, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/signup').send({
                email: process.env.TESTS_MAIL,
                password: 'notshort',
                firstName: 'true',
                lastName: true
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter your last name');
        }));
        (0, mocha_1.it)('should return last name error, alt 2', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/signup').send({
                email: process.env.TESTS_MAIL,
                password: 'notshort',
                firstName: 'true',
                lastName: ''
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter your last name');
        }));
        (0, mocha_1.it)('should return last name error, alt 3', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/signup').send({
                email: process.env.TESTS_MAIL,
                password: 'notshort',
                firstName: 'true'
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter your last name');
        }));
    });
    (0, mocha_1.describe)('POST /admin/create', () => {
        (0, mocha_1.after)(() => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, db_1.default)('users')
                .where({ email: process.env.TESTS_MAIL })
                .del();
        }));
        (0, mocha_1.it)('should create a new admin', () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, db_1.default)('users')
                .where({ email: process.env.TESTS_MAIL })
                .del();
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res.body).to.have.property('token');
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/admin/create').send({
                email: process.env.TESTS_MAIL,
                firstName: 'Victor',
                lastName: 'Ilodiuba'
            }).set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('message', 'Admin successfully created');
            (0, chai_1.expect)(res.body).to.have.property('email', process.env.TESTS_MAIL);
            (0, chai_1.expect)(res.body).to.have.property('password');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
            yield (0, db_1.default)('users')
                .where({ email: process.env.TESTS_MAIL })
                .del();
        }));
        (0, mocha_1.it)('should create a new admin, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, db_1.default)('users')
                .where({ email: process.env.TESTS_MAIL })
                .del();
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res.body).to.have.property('token');
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post(`/admin/create?token=${adminToken}`).send({
                email: process.env.TESTS_MAIL,
                firstName: 'Victor',
                lastName: 'Ilodiuba'
            });
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('message', 'Admin successfully created');
            (0, chai_1.expect)(res.body).to.have.property('email', process.env.TESTS_MAIL);
            (0, chai_1.expect)(res.body).to.have.property('password');
            const adminPassword = res.body.password;
            res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: adminPassword
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say email already taken', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res.body).to.have.property('token');
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/admin/create').send({
                email: process.env.TESTS_MAIL,
                firstName: 'Victor',
                lastName: 'Ilodiuba'
            }).set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Email already taken');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
        }));
        (0, mocha_1.it)('should say unauthorized', () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, db_1.default)('users')
                .where({ email: process.env.TESTS_MAIL })
                .del();
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res.body).to.have.property('token');
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/admin/create').send({
                email: process.env.TESTS_MAIL,
                firstName: 'Victor',
                lastName: 'Ilodiuba'
            }).set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(201);
            const adminPassword = res.body.password;
            res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: adminPassword
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/admin/create').send({
                email: process.env.TESTS_MAIL,
                firstName: 'Victor',
                lastName: 'Ilodiuba'
            }).set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say unauthorized, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, db_1.default)('users')
                .where({ email: process.env.TESTS_MAIL })
                .del();
            let res = yield chai_1.default.request(server_1.default).post('/signup').send({
                email: process.env.TESTS_MAIL,
                password: 'test123',
                firstName: 'Victor',
                lastName: 'Ilodiuba'
            });
            (0, chai_1.expect)(res).to.have.status(201);
            res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/admin/create').send({
                email: process.env.TESTS_MAIL,
                firstName: 'Victor',
                lastName: 'Ilodiuba'
            }).set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say unauthorized, alt 2', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/admin/create').send({
                email: process.env.TESTS_MAIL,
                firstName: 'Victor',
                lastName: 'Ilodiuba'
            });
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
        }));
        (0, mocha_1.it)('should return email error', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res.body).to.have.property('token');
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/admin/create').send({
                email: undefined,
                firstName: 'Victor',
                lastName: 'Ilodiuba'
            }).set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter an email');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
        }));
        (0, mocha_1.it)('should return email error, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res.body).to.have.property('token');
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/admin/create').send({
                email: true,
                firstName: 'Victor',
                lastName: 'Ilodiuba'
            }).set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter an email');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
        }));
        (0, mocha_1.it)('should return email error, alt 2', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res.body).to.have.property('token');
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/admin/create').send({
                firstName: 'Victor',
                lastName: 'Ilodiuba'
            }).set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter an email');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
        }));
        (0, mocha_1.it)('should return email error, alt 3', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res.body).to.have.property('token');
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/admin/create').send({
                email: '',
                firstName: 'Victor',
                lastName: 'Ilodiuba'
            }).set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter a valid email');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
        }));
        (0, mocha_1.it)('should return email error, alt 4', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res.body).to.have.property('token');
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/admin/create').send({
                email: 'invalidemail',
                firstName: 'Victor',
                lastName: 'Ilodiuba'
            }).set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter a valid email');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
        }));
        (0, mocha_1.it)('should return first name error', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res.body).to.have.property('token');
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/admin/create').send({
                email: process.env.TESTS_MAIL,
                firstName: undefined,
                lastName: 'Ilodiuba'
            }).set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter a first name');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
        }));
        (0, mocha_1.it)('should return first name error, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res.body).to.have.property('token');
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/admin/create').send({
                email: process.env.TESTS_MAIL,
                firstName: true,
                lastName: 'Ilodiuba'
            }).set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter a first name');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
        }));
        (0, mocha_1.it)('should return first name error, alt 2', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res.body).to.have.property('token');
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/admin/create').send({
                email: process.env.TESTS_MAIL,
                firstName: '',
                lastName: 'Ilodiuba'
            }).set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter a first name');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
        }));
        (0, mocha_1.it)('should return last name error', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res.body).to.have.property('token');
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/admin/create').send({
                email: process.env.TESTS_MAIL,
                firstName: 'Victor',
                lastName: undefined
            }).set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter a last name');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
        }));
        (0, mocha_1.it)('should return last name error, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res.body).to.have.property('token');
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/admin/create').send({
                email: process.env.TESTS_MAIL,
                firstName: 'Victor',
                lastName: true
            }).set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter a last name');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
        }));
        (0, mocha_1.it)('should return last name error, alt 2', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res.body).to.have.property('token');
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/admin/create').send({
                email: process.env.TESTS_MAIL,
                firstName: 'Victor',
                lastName: ''
            }).set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.be.an('object');
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter a last name');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
        }));
    });
});
