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
const hashPassword_1 = __importDefault(require("../utils/hashPassword"));
dotenv_1.default.config();
chai_1.default.use(chai_http_1.default);
(0, mocha_1.describe)('File Tests', () => {
    let id;
    (0, mocha_1.before)(() => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, db_1.default)('users')
            .insert({
            email: process.env.TESTS_MAIL,
            password: yield (0, hashPassword_1.default)('test123'),
            first_name: 'Victor',
            last_name: 'Ilodiuba'
        }, ['id']);
        id = user[0].id;
        const folder = yield (0, db_1.default)('folders')
            .insert({
            name: 'testfolder',
            displayName: 'TestFolder',
            user_id: id
        }, ['id']);
        yield (0, db_1.default)('files')
            .insert({
            name: 'test',
            displayName: 'Test',
            folder_id: null,
            link: 'https://risevest.com',
            s3_key: 'rise',
            user_id: id,
            mimetype: 'image/jpeg',
            history: JSON.stringify([{ event: 'Created', date: new Date() }])
        });
        yield (0, db_1.default)('files')
            .insert({
            name: 'test',
            displayName: 'Test',
            folder_id: folder[0].id,
            link: 'https://risevest.com',
            s3_key: 'rise',
            user_id: id,
            mimetype: 'image/jpeg',
            history: JSON.stringify([{ event: 'Created', date: new Date() }])
        });
    }));
    (0, mocha_1.after)(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, db_1.default)('files')
            .where({ user_id: id })
            .del();
        yield (0, db_1.default)('folders')
            .where({ user_id: id })
            .del();
        yield (0, db_1.default)('users')
            .where({ email: process.env.TESTS_MAIL })
            .del();
    }));
    (0, mocha_1.describe)('GET /files', () => {
        (0, mocha_1.it)('should get user files', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default)
                .get('/files')
                .set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(200);
            /* eslint-disable @typescript-eslint/no-unused-expressions */
            (0, chai_1.expect)(res.body.files).to.exist;
            const files = res.body.files;
            files.forEach((file) => {
                (0, chai_1.expect)(file.file_id).to.exist;
                (0, chai_1.expect)(file.file_name).to.exist;
                (0, chai_1.expect)(typeof file.folder_name === 'string' ||
                    file.folder_name === null).to.equal(true);
                (0, chai_1.expect)(file.file_history).to.exist;
                (0, chai_1.expect)(file.file_history).to.be.an('array');
                file.file_history.forEach((event) => {
                    (0, chai_1.expect)(event.event).to.exist;
                    (0, chai_1.expect)(event.date).to.exist;
                });
            });
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should get user files, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default)
                .get(`/files?token=${token}`);
            (0, chai_1.expect)(res).to.have.status(200);
            /* eslint-disable @typescript-eslint/no-unused-expressions */
            (0, chai_1.expect)(res.body.files).to.exist;
            const files = res.body.files;
            files.forEach((file) => {
                (0, chai_1.expect)(file.file_id).to.exist;
                (0, chai_1.expect)(file.file_name).to.exist;
                (0, chai_1.expect)(typeof file.folder_name === 'string' ||
                    file.folder_name === null).to.equal(true);
                (0, chai_1.expect)(file.file_history).to.exist;
                (0, chai_1.expect)(file.file_history).to.be.an('array');
                file.file_history.forEach((event) => {
                    (0, chai_1.expect)(event.event).to.exist;
                    (0, chai_1.expect)(event.date).to.exist;
                });
            });
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should get all files for admin', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default)
                .get('/files')
                .set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(200);
            /* eslint-disable @typescript-eslint/no-unused-expressions */
            (0, chai_1.expect)(res.body.files).to.exist;
            const files = res.body.files;
            files.forEach((file) => {
                (0, chai_1.expect)(file.file_id).to.exist;
                (0, chai_1.expect)(file.file_name).to.exist;
                (0, chai_1.expect)(file.file_user_id).to.exist;
                (0, chai_1.expect)(typeof file.folder_name === 'string' ||
                    file.folder_name === null).to.equal(true);
                (0, chai_1.expect)(file.file_history).to.exist;
                (0, chai_1.expect)(file.file_history).to.be.an('array');
                file.file_history.forEach((event) => {
                    (0, chai_1.expect)(event.event).to.exist;
                    (0, chai_1.expect)(event.date).to.exist;
                });
            });
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should get user files, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default)
                .get(`/files?token=${token}`);
            (0, chai_1.expect)(res).to.have.status(200);
            /* eslint-disable @typescript-eslint/no-unused-expressions */
            (0, chai_1.expect)(res.body.files).to.exist;
            const files = res.body.files;
            files.forEach((file) => {
                (0, chai_1.expect)(file.file_id).to.exist;
                (0, chai_1.expect)(file.file_name).to.exist;
                (0, chai_1.expect)(file.file_user_id).to.exist;
                (0, chai_1.expect)(typeof file.folder_name === 'string' ||
                    file.folder_name === null).to.equal(true);
                (0, chai_1.expect)(file.file_history).to.exist;
                (0, chai_1.expect)(file.file_history).to.be.an('array');
                file.file_history.forEach((event) => {
                    (0, chai_1.expect)(event.event).to.exist;
                    (0, chai_1.expect)(event.date).to.exist;
                });
            });
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say unauthorized', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default)
                .get('/files');
            (0, chai_1.expect)(res).to.have.status(401);
            /* eslint-disable @typescript-eslint/no-unused-expressions */
            (0, chai_1.expect)(res.body.files).to.not.exist;
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
        }));
        (0, mocha_1.it)('should say unauthorized, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default)
                .get('/files')
                .set('Authorization', 'Bearer wrongtoken');
            (0, chai_1.expect)(res).to.have.status(401);
            /* eslint-disable @typescript-eslint/no-unused-expressions */
            (0, chai_1.expect)(res.body.files).to.not.exist;
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
        }));
        (0, mocha_1.it)('should say unauthorized, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default)
                .get('/files?token=wrongtoken');
            (0, chai_1.expect)(res).to.have.status(401);
            /* eslint-disable @typescript-eslint/no-unused-expressions */
            (0, chai_1.expect)(res.body.files).to.not.exist;
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
        }));
    });
});
