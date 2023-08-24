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
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const node_html_parser_1 = require("node-html-parser");
const db_1 = __importDefault(require("../config/db"));
const server_1 = __importDefault(require("../server"));
const redis_1 = require("../config/redis");
const hashPassword_1 = __importDefault(require("../utils/hashPassword"));
const uploadMiddleware_1 = require("../middlewares/uploadMiddleware");
dotenv_1.default.config();
chai_1.default.use(chai_http_1.default);
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const binaryParser = function (res, cb) {
    res.setEncoding('binary');
    res.data = '';
    res.on('data', function (chunk) {
        res.data += chunk;
    });
    res.on('end', function () {
        cb(null, Buffer.from(res.data, 'binary'));
    });
};
(0, mocha_1.describe)('File and Folder Tests', () => {
    let id;
    let id2;
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
        const folder2 = yield (0, db_1.default)('folders')
            .insert({
            name: 'testfolder2',
            displayName: 'TestFolder2',
            user_id: id
        }, ['id']);
        yield (0, db_1.default)('files')
            .insert({
            name: 'test2',
            displayName: 'Test2',
            folder_id: null,
            link: 'https://risevest.com',
            s3_key: process.env.VALID_S3_KEY,
            user_id: id,
            mimetype: 'audio/mpeg',
            history: JSON.stringify([{ event: 'Created', date: new Date() }])
        });
        yield (0, db_1.default)('files')
            .insert({
            name: 'test',
            displayName: 'Test',
            folder_id: folder[0].id,
            link: 'https://risevest.com',
            s3_key: process.env.VALID_S3_KEY,
            user_id: id,
            mimetype: 'audio/mpeg',
            history: JSON.stringify([{ event: 'Created', date: new Date() }])
        });
        yield (0, db_1.default)('files')
            .insert({
            name: 'move',
            displayName: 'move',
            folder_id: folder2[0].id,
            link: 'https://risevest.com',
            s3_key: process.env.VALID_S3_KEY,
            user_id: id,
            mimetype: 'audio/mpeg',
            history: JSON.stringify([{ event: 'Created', date: new Date() }])
        });
        const user2 = yield (0, db_1.default)('users')
            .insert({
            email: process.env.WRONG_TESTS_MAIL,
            password: yield (0, hashPassword_1.default)('test123'),
            first_name: 'Victor',
            last_name: 'Ilodiuba'
        }, ['id']);
        id2 = user2[0].id;
        yield (0, db_1.default)('files')
            .insert({
            name: 'test',
            displayName: 'Test',
            folder_id: null,
            link: 'https://risevest.com',
            s3_key: 'nosuchkey',
            user_id: user2[0].id,
            mimetype: 'image/jpeg',
            history: JSON.stringify([{ event: 'Created', date: new Date() }])
        });
    }));
    (0, mocha_1.after)(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, db_1.default)('files')
            .where({ user_id: id })
            .del();
        yield (0, db_1.default)('files')
            .where({ user_id: id2 })
            .del();
        yield (0, db_1.default)('folders')
            .where({ user_id: id })
            .del();
        yield (0, db_1.default)('users')
            .where({ email: process.env.TESTS_MAIL })
            .del();
        yield (0, db_1.default)('users')
            .where({ email: process.env.WRONG_TESTS_MAIL })
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
        (0, mocha_1.it)('should say unauthorized, alt 2', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default)
                .get('/files?token=wrongtoken');
            (0, chai_1.expect)(res).to.have.status(401);
            /* eslint-disable @typescript-eslint/no-unused-expressions */
            (0, chai_1.expect)(res.body.files).to.not.exist;
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
        }));
    });
    (0, mocha_1.describe)('GET /files/download/:fileId', () => {
        (0, mocha_1.it)('should download file', () => __awaiter(void 0, void 0, void 0, function* () {
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
            //   console.log(files)
            res = yield chai_1.default.request(server_1.default)
                .get(`/files/download/${files[0].file_id}`)
                .set('Authorization', `Bearer ${token}`)
                .buffer()
                .parse(binaryParser);
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.headers['transfer-encoding']).to.equal('chunked');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should download file, alt', () => __awaiter(void 0, void 0, void 0, function* () {
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
            res = yield chai_1.default.request(server_1.default)
                .get(`/files/download/${files[0].file_id}`)
                .set('Authorization', `Bearer ${token}`)
                .buffer()
                .parse(binaryParser);
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.headers['transfer-encoding']).to.equal('chunked');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should download file for admin', () => __awaiter(void 0, void 0, void 0, function* () {
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
            res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default)
                .get(`/files/download/${files[0].file_id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .buffer()
                .parse(binaryParser);
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.headers['transfer-encoding']).to.equal('chunked');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
        }));
        (0, mocha_1.it)('should download file for admin, alt', () => __awaiter(void 0, void 0, void 0, function* () {
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
            res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default)
                .get(`/files/download/${files[0].file_id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .buffer()
                .parse(binaryParser);
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.headers['transfer-encoding']).to.equal('chunked');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
        }));
        (0, mocha_1.it)('should say invalid id', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default)
                .get('/files/download/invalidid')
                .set('Authorization', `Bearer ${token}`)
                .buffer()
                .parse(binaryParser);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.header['content-type']
                .startsWith('application/json')).to.equal(true);
            const jsonString = res.body.toString();
            const json = JSON.parse(jsonString);
            (0, chai_1.expect)(json).to.have.property('error', 'Invalid file id');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say unauthorized', () => __awaiter(void 0, void 0, void 0, function* () {
            const uuid = (0, uuid_1.v4)();
            const res = yield chai_1.default.request(server_1.default)
                .get(`/files/download/${uuid}`);
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
        }));
        (0, mocha_1.it)('should say unauthorized, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default)
                .get('/files/download/fileid')
                .set('Authorization', 'Bearer wrongtoken');
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
        }));
        (0, mocha_1.it)('should say unauthorized, alt 2', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default)
                .get('/files/download/file?token=wrongtoken');
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
        }));
        (0, mocha_1.it)('should say file not found', () => __awaiter(void 0, void 0, void 0, function* () {
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
            const ids = [];
            files.forEach((file) => {
                ids.push(file.file_id);
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
            //   console.log(files)
            res = yield chai_1.default.request(server_1.default)
                .get(`/files/download/${wronguuid()}`)
                .set('Authorization', `Bearer ${token}`)
                .buffer()
                .parse(binaryParser);
            (0, chai_1.expect)(res).to.have.status(404);
            (0, chai_1.expect)(res.header['content-type']
                .startsWith('application/json')).to.equal(true);
            const jsonString = res.body.toString();
            const json = JSON.parse(jsonString);
            (0, chai_1.expect)(json).to.have.property('error', 'File not found. Please check file id in the URL.');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say file not found in storage', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.WRONG_TESTS_MAIL,
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
            //   console.log(files)
            res = yield chai_1.default.request(server_1.default)
                .get(`/files/download/${files[0].file_id}`)
                .set('Authorization', `Bearer ${token}`)
                .buffer()
                .parse(binaryParser);
            (0, chai_1.expect)(res).to.have.status(404);
            (0, chai_1.expect)(res.header['content-type']
                .startsWith('application/json')).to.equal(true);
            const jsonString = res.body.toString();
            const json = JSON.parse(jsonString);
            (0, chai_1.expect)(json).to.have.property('error', 'File not found in storage');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
    });
    (0, mocha_1.describe)('GET /files/stream/:fileId', () => {
        (0, mocha_1.it)('should stream file', () => __awaiter(void 0, void 0, void 0, function* () {
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
            //   console.log(files)
            res = yield chai_1.default.request(server_1.default)
                .get(`/files/stream/${files[0].file_id}`)
                .set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(200);
            const page = (0, node_html_parser_1.parse)(res.text);
            const stream = page.querySelector('audio');
            (0, chai_1.expect)(stream === null || stream === void 0 ? void 0 : stream.rawAttrs).to.exist;
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should stream file, alt', () => __awaiter(void 0, void 0, void 0, function* () {
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
            //   console.log(files)
            res = yield chai_1.default.request(server_1.default)
                .get(`/files/stream/${files[0].file_id}?token=${token}`);
            (0, chai_1.expect)(res).to.have.status(200);
            const page = (0, node_html_parser_1.parse)(res.text);
            const stream = page.querySelector('audio');
            (0, chai_1.expect)(stream === null || stream === void 0 ? void 0 : stream.rawAttrs).to.exist;
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should stream file for admin', () => __awaiter(void 0, void 0, void 0, function* () {
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
            res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const adminToken = res.body.token;
            //   console.log(files)
            res = yield chai_1.default.request(server_1.default)
                .get(`/files/stream/${files[0].file_id}`)
                .set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(200);
            const page = (0, node_html_parser_1.parse)(res.text);
            const stream = page.querySelector('audio');
            (0, chai_1.expect)(stream === null || stream === void 0 ? void 0 : stream.rawAttrs).to.exist;
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
        }));
        (0, mocha_1.it)('should stream file for admin, alt', () => __awaiter(void 0, void 0, void 0, function* () {
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
            res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const adminToken = res.body.token;
            //   console.log(files)
            res = yield chai_1.default.request(server_1.default)
                .get(`/files/stream/${files[0].file_id}?token=${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(200);
            const page = (0, node_html_parser_1.parse)(res.text);
            const stream = page.querySelector('audio');
            (0, chai_1.expect)(stream === null || stream === void 0 ? void 0 : stream.rawAttrs).to.exist;
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
        }));
        (0, mocha_1.it)('should say invalid id', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default)
                .get('/files/stream/invalidid')
                .set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Invalid file id');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say unauthorized', () => __awaiter(void 0, void 0, void 0, function* () {
            const uuid = (0, uuid_1.v4)();
            const res = yield chai_1.default.request(server_1.default)
                .get(`/files/stream/${uuid}`);
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
        }));
        (0, mocha_1.it)('should say unauthorized, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default)
                .get('/files/stream/fileid')
                .set('Authorization', 'Bearer wrongtoken');
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
        }));
        (0, mocha_1.it)('should say unauthorized, alt 2', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default)
                .get('/files/stream/file?token=wrongtoken');
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
        }));
        (0, mocha_1.it)('should say file not found', () => __awaiter(void 0, void 0, void 0, function* () {
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
            const ids = [];
            files.forEach((file) => {
                ids.push(file.file_id);
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
            //   console.log(files)
            res = yield chai_1.default.request(server_1.default)
                .get(`/files/stream/${wronguuid()}`)
                .set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(404);
            (0, chai_1.expect)(res.body).to.have.property('error', 'File not found. Please check file id in the URL.');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say return file type error', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.WRONG_TESTS_MAIL,
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
            //   console.log(files)
            res = yield chai_1.default.request(server_1.default)
                .get(`/files/stream/${files[0].file_id}`)
                .set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.have.property('error', 'File requested for is neither a video nor audio');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
    });
    (0, mocha_1.describe)('POST /files', () => {
        (0, mocha_1.it)('should create a new file', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/files')
                .field('name', 'testfilesss')
                .attach('file', 'testfiles/t-rex-roar.mp3')
                .set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', 'File succesfully uploaded');
            (0, chai_1.expect)(res.body).to.have.property('id');
            (0, chai_1.expect)(res.body).to.have.property('folderId', null);
            const file = yield (0, db_1.default)('files')
                .where({ id: res.body.id })
                .first('s3_key');
            yield (0, uploadMiddleware_1.deleteObject)({ key: file === null || file === void 0 ? void 0 : file.s3_key });
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should create a new file with token query', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).post(`/files?token=${token}`)
                .field('name', 'testfiles2')
                .attach('file', 'testfiles/t-rex-roar.mp3');
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', 'File succesfully uploaded');
            (0, chai_1.expect)(res.body).to.have.property('id');
            (0, chai_1.expect)(res.body).to.have.property('folderId', null);
            const file = yield (0, db_1.default)('files')
                .where({ id: res.body.id })
                .first('s3_key');
            yield (0, uploadMiddleware_1.deleteObject)({ key: file === null || file === void 0 ? void 0 : file.s3_key });
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should create a new file without name field', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/files')
                .attach('file', 'testfiles/t-rex-roar.mp3')
                .set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', 'File succesfully uploaded');
            (0, chai_1.expect)(res.body).to.have.property('id');
            (0, chai_1.expect)(res.body).to.have.property('folderId', null);
            const file = yield (0, db_1.default)('files')
                .where({ id: res.body.id })
                .first('s3_key');
            yield (0, uploadMiddleware_1.deleteObject)({ key: file === null || file === void 0 ? void 0 : file.s3_key });
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should create a new file with new folder name in query', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/files?folderName=newfolder')
                .field('name', 'testfilesss')
                .attach('file', 'testfiles/t-rex-roar.mp3')
                .set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', 'File succesfully uploaded');
            (0, chai_1.expect)(res.body).to.have.property('id');
            (0, chai_1.expect)(res.body).to.have.property('folderId');
            (0, chai_1.expect)(res.body.folderId !== null).to.equal(true);
            const file = yield (0, db_1.default)('files')
                .where({ id: res.body.id })
                .first('s3_key');
            yield (0, uploadMiddleware_1.deleteObject)({ key: file === null || file === void 0 ? void 0 : file.s3_key });
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should create a new file with already existing folder name in query', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/files?folderName=testfolder')
                .field('name', 'testfilesss')
                .attach('file', 'testfiles/t-rex-roar.mp3')
                .set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', 'File succesfully uploaded');
            (0, chai_1.expect)(res.body).to.have.property('id');
            (0, chai_1.expect)(res.body).to.have.property('folderId');
            (0, chai_1.expect)(res.body.folderId !== null).to.equal(true);
            const file = yield (0, db_1.default)('files')
                .where({ id: res.body.id })
                .first('s3_key');
            yield (0, uploadMiddleware_1.deleteObject)({ key: file === null || file === void 0 ? void 0 : file.s3_key });
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should create a new file with already existing folder name and token in query', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).post(`/files?folderName=testfolder&token=${token}`)
                .field('name', 'testfilesss2')
                .attach('file', 'testfiles/t-rex-roar.mp3');
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', 'File succesfully uploaded');
            (0, chai_1.expect)(res.body).to.have.property('id');
            (0, chai_1.expect)(res.body).to.have.property('folderId');
            (0, chai_1.expect)(res.body.folderId !== null).to.equal(true);
            const file = yield (0, db_1.default)('files')
                .where({ id: res.body.id })
                .first('s3_key');
            yield (0, uploadMiddleware_1.deleteObject)({ key: file === null || file === void 0 ? void 0 : file.s3_key });
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say file aready exists', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/files')
                .field('name', 'testfilesss')
                .attach('file', 'testfiles/t-rex-roar.mp3')
                .set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.have.property('error', 'testfilesss already exists');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say file aready exists without name field', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/files')
                //   .field('name', 'testfilesss')
                .attach('file', 'testfiles/t-rex-roar.mp3')
                .set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.have.property('error', 't-rex-roar.mp3 already exists');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        if (fs_1.default.existsSync('testfiles/largefile')) {
            (0, mocha_1.it)('should say file too large', () => __awaiter(void 0, void 0, void 0, function* () {
                let res = yield chai_1.default.request(server_1.default).post('/login').send({
                    email: process.env.TESTS_MAIL,
                    password: 'test123'
                });
                (0, chai_1.expect)(res).to.have.status(200);
                const token = res.body.token;
                res = yield chai_1.default.request(server_1.default).post('/files')
                    .attach('file', 'testfiles/largefile')
                    .set('Authorization', `Bearer ${token}`);
                (0, chai_1.expect)(res).to.have.status(400);
                (0, chai_1.expect)(res.body).to.have.property('error', 'File too large');
                yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
            }));
        }
        (0, mocha_1.it)('should say unauthorized', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/files')
                .attach('file', 'testfiles/t-rex-roar.mp3');
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
        }));
    });
    (0, mocha_1.describe)('PATCH /files/file:id', () => {
        (0, mocha_1.it)('should update file name', () => __awaiter(void 0, void 0, void 0, function* () {
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
            res = yield chai_1.default.request(server_1.default)
                .patch(`/files/${files[0].file_id}`)
                .send({ name: 'newname' })
                .set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(201);
            //   expect(res.body.message.startsWith('Name changed from')).to.equal(true)
            (0, chai_1.expect)(res.body).to.have.property('message', `Name changed from ${files[0].file_name} to newname`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should not update id', () => __awaiter(void 0, void 0, void 0, function* () {
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
            res = yield chai_1.default.request(server_1.default)
                .patch(`/files/${files[0].file_id}`)
                .send({ id: 'newname' })
                .set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.have.property('error', 'No valid field specified to update');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say you do not have file with id error', () => __awaiter(void 0, void 0, void 0, function* () {
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
            const ids = [];
            files.forEach((file) => {
                ids.push(file.file_id);
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
            const fileId = wronguuid();
            res = yield chai_1.default.request(server_1.default)
                .patch(`/files/${fileId}`)
                .send({ name: 'newname', user_id: 'newid' })
                .set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(404);
            (0, chai_1.expect)(res.body).to.have.property('error', 'File not found. Please check file id in the URL.');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say invalid id', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default)
                .patch('/files/invalidid')
                .send({ name: 'newname' })
                .set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Invalid file id');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say unauthorized', () => __awaiter(void 0, void 0, void 0, function* () {
            const uuid = (0, uuid_1.v4)();
            const res = yield chai_1.default.request(server_1.default)
                .patch(`/files/${uuid}`)
                .send({ name: 'newname' });
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
        }));
    });
    (0, mocha_1.describe)('PATCH /admin/files/:fileId', () => {
        (0, mocha_1.it)('should mark file as unsafe', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/login').send({
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
            res = yield chai_1.default.request(server_1.default)
                .patch(`/admin/files/${files[0].file_id}`)
                .send({ safe: false })
                .set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', `${files[0].file_name} marked as unsafe by an Admin`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say already marked file as unsafe', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/login').send({
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
            res = yield chai_1.default.request(server_1.default)
                .patch(`/admin/files/${files[0].file_id}`)
                .send({ safe: false })
                .set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', `${files[0].file_name} marked as unsafe by an Admin`);
            res = yield chai_1.default.request(server_1.default)
                .patch(`/admin/files/${files[0].file_id}`)
                .send({ safe: false })
                .set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', `${files[0].file_name} already marked as unsafe by you`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say now marked safe', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/login').send({
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
            res = yield chai_1.default.request(server_1.default)
                .patch(`/admin/files/${files[0].file_id}`)
                .send({ safe: false })
                .set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', `${files[0].file_name} marked as unsafe by an Admin`);
            res = yield chai_1.default.request(server_1.default)
                .patch(`/admin/files/${files[0].file_id}`)
                .send({ safe: true })
                .set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', `${files[0].file_name} marked as safe by an Admin that marked as unsafe previously`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should mark safe', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/login').send({
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
            res = yield chai_1.default.request(server_1.default)
                .patch(`/admin/files/${files[0].file_id}`)
                .send({ safe: true })
                .set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', `${files[0].file_name} marked as safe by an Admin`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should delete file after 3 different unsafe reviews', () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, db_1.default)('users')
                .update({ is_superuser: true })
                .where({ id });
            yield (0, db_1.default)('users')
                .update({ is_superuser: true })
                .where({ id: id2 });
            const file = yield (0, db_1.default)('files')
                .insert({
                name: 'testreview',
                displayName: 'Test',
                folder_id: null,
                link: 'https://risevest.com',
                s3_key: 'testall',
                user_id: id,
                mimetype: 'audio/mpeg',
                history: JSON.stringify([{ event: 'Created', date: new Date() }])
            }, ['id', 'displayName']);
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token1 = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token2 = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.WRONG_TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token3 = res.body.token;
            res = yield chai_1.default.request(server_1.default)
                .patch(`/admin/files/${file[0].id}`)
                .send({ safe: false })
                .set('Authorization', `Bearer ${token1}`);
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', `${file[0].displayName} marked as unsafe by an Admin`);
            res = yield chai_1.default.request(server_1.default)
                .patch(`/admin/files/${file[0].id}`)
                .send({ safe: false })
                .set('Authorization', `Bearer ${token2}`);
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', `${file[0].displayName} marked as unsafe by an Admin`);
            res = yield chai_1.default.request(server_1.default)
                .patch(`/admin/files/${file[0].id}`)
                .send({ safe: false })
                .set('Authorization', `Bearer ${token3}`);
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', `${file[0].displayName} marked as unsafe by 3 admins and automatically deleted`);
            const deletedFile = yield (0, db_1.default)('files')
                .where({ id: file[0].id });
            (0, chai_1.expect)(deletedFile[0]).to.not.exist;
            yield (0, db_1.default)('users')
                .update({ is_superuser: false })
                .where({ id });
            yield (0, db_1.default)('users')
                .update({ is_superuser: false })
                .where({ id: id2 });
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token1)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token2)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token3)}`);
        }));
        (0, mocha_1.it)('should not delete file is not 3 unique false admin reviews', () => __awaiter(void 0, void 0, void 0, function* () {
            const file = yield (0, db_1.default)('files')
                .insert({
                name: 'testreview',
                displayName: 'Test',
                folder_id: null,
                link: 'https://risevest.com',
                s3_key: 'testall',
                user_id: id,
                mimetype: 'audio/mpeg',
                history: JSON.stringify([{ event: 'Created', date: new Date() }])
            }, ['id', 'displayName']);
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token1 = res.body.token;
            res = yield chai_1.default.request(server_1.default)
                .patch(`/admin/files/${file[0].id}`)
                .send({ safe: false })
                .set('Authorization', `Bearer ${token1}`);
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', `${file[0].displayName} marked as unsafe by an Admin`);
            res = yield chai_1.default.request(server_1.default)
                .patch(`/admin/files/${file[0].id}`)
                .send({ safe: false })
                .set('Authorization', `Bearer ${token1}`);
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', `${file[0].displayName} already marked as unsafe by you`);
            res = yield chai_1.default.request(server_1.default)
                .patch(`/admin/files/${file[0].id}`)
                .send({ safe: false })
                .set('Authorization', `Bearer ${token1}`);
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', `${file[0].displayName} already marked as unsafe by you`);
            const deletedFile = yield (0, db_1.default)('files')
                .where({ id: file[0].id });
            (0, chai_1.expect)(deletedFile[0]).to.exist;
            yield (0, db_1.default)('files')
                .where({ id: file[0].id })
                .del();
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token1)}`);
        }));
        (0, mocha_1.it)('should say invalid id', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default)
                .patch('/admin/files/invalidid')
                .send({ safe: false })
                .set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Invalid file id');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
        }));
        (0, mocha_1.it)('should say file not found', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/login').send({
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
            const ids = [];
            files.forEach((file) => {
                ids.push(file.file_id);
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
            res = yield chai_1.default.request(server_1.default)
                .patch(`/admin/files/${wronguuid()}`)
                .send({ safe: false })
                .set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(404);
            (0, chai_1.expect)(res.body).to.have.property('error', 'File not found. Please check file id in the URL.');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say please specify if file is safe', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/login').send({
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
            res = yield chai_1.default.request(server_1.default)
                .patch(`/admin/files/${files[0].file_id}`)
                .set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please specify if file is safe');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say invalid safe', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/login').send({
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
            res = yield chai_1.default.request(server_1.default)
                .patch(`/admin/files/${files[0].file_id}`)
                .send({ safe: 'true' })
                .set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Invalid value for safe');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say invalid safe, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/login').send({
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
            res = yield chai_1.default.request(server_1.default)
                .patch(`/admin/files/${files[0].file_id}`)
                .send({ safe: { safe: true } })
                .set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Invalid value for safe');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say invalid safe, alt 2', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/login').send({
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
            res = yield chai_1.default.request(server_1.default)
                .patch(`/admin/files/${files[0].file_id}`)
                .send({ safe: [true] })
                .set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Invalid value for safe');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say invalid safe, alt 3', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const adminToken = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/login').send({
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
            res = yield chai_1.default.request(server_1.default)
                .patch(`/admin/files/${files[0].file_id}`)
                .send({ safe: 1 })
                .set('Authorization', `Bearer ${adminToken}`);
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Invalid value for safe');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say page not found', () => __awaiter(void 0, void 0, void 0, function* () {
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
            res = yield chai_1.default.request(server_1.default)
                .patch(`/admin/files/${files[0].file_id}`)
                .send({ safe: 1 })
                .set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(404);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Page not found');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say page not found, alt', () => __awaiter(void 0, void 0, void 0, function* () {
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
            res = yield chai_1.default.request(server_1.default)
                .patch(`/admin/files/${files[0].file_id}`)
                .send({ safe: 1 });
            (0, chai_1.expect)(res).to.have.status(404);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Page not found');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
    });
    (0, mocha_1.describe)('DELETE /files/:fileId', () => {
        (0, mocha_1.it)('should delete file', () => __awaiter(void 0, void 0, void 0, function* () {
            const file = yield (0, db_1.default)('files')
                .insert({
                name: 'testdelete',
                displayName: 'Test',
                folder_id: null,
                link: 'https://risevest.com',
                s3_key: 'testalldelete',
                user_id: id,
                mimetype: 'audio/mpeg',
                history: JSON.stringify([{ event: 'Created', date: new Date() }])
            }, ['id', 'displayName']);
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default)
                .delete(`/files/${file[0].id}`)
                .send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            }).set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.have.property('message', `${file[0].displayName} successfully deleted`);
            const deletedFile = yield (0, db_1.default)('files')
                .where({ id: file[0].id });
            (0, chai_1.expect)(deletedFile[0]).to.not.exist;
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should delete file, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            const file = yield (0, db_1.default)('files')
                .insert({
                name: 'testdelete',
                displayName: 'Test',
                folder_id: null,
                link: 'https://risevest.com',
                s3_key: 'testalldelete',
                user_id: id,
                mimetype: 'audio/mpeg',
                history: JSON.stringify([{ event: 'Created', date: new Date() }])
            }, ['id', 'displayName']);
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default)
                .delete(`/files/${file[0].id}?token=${token}`)
                .send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.have.property('message', `${file[0].displayName} successfully deleted`);
            const deletedFile = yield (0, db_1.default)('files')
                .where({ id: file[0].id });
            (0, chai_1.expect)(deletedFile[0]).to.not.exist;
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say not found', () => __awaiter(void 0, void 0, void 0, function* () {
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
            const ids = [];
            files.forEach((file) => {
                ids.push(file.file_id);
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
            res = yield chai_1.default.request(server_1.default)
                .delete(`/files/${wronguuid()}?token=${token}`)
                .send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(404);
            (0, chai_1.expect)(res.body).to.have.property('error', 'File not found. Please check file id in the URL.');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say unauthorized', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default)
                .delete(`/files/${(0, uuid_1.v4)()}`)
                .send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
        }));
    });
    (0, mocha_1.describe)('GET /folders', () => {
        (0, mocha_1.it)('should get all folders', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default)
                .get('/folders')
                .set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body.folders).to.exist;
            const folders = res.body.folders;
            folders.forEach((folder) => {
                (0, chai_1.expect)(folder.file_count).to.exist;
                (0, chai_1.expect)(folder.file_count).to.be.a('number');
                (0, chai_1.expect)(folder.folder_name).to.exist;
                (0, chai_1.expect)(folder.folder_name).to.be.a('string');
            });
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should get all folders, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default)
                .get(`/folders?token=${token}`);
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body.folders).to.exist;
            const folders = res.body.folders;
            folders.forEach((folder) => {
                (0, chai_1.expect)(folder.file_count).to.exist;
                (0, chai_1.expect)(folder.file_count).to.be.a('number');
                (0, chai_1.expect)(folder.folder_name).to.exist;
                (0, chai_1.expect)(folder.folder_name).to.be.a('string');
            });
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say unauthorized', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default)
                .get('/folders');
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body.error).to.equal('Unauthorized');
        }));
    });
    (0, mocha_1.describe)('GET /folders/:folderName', () => {
        (0, mocha_1.it)('should get all files in folder', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default)
                .get('/folders/testfolder')
                .set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body.files).to.exist;
            const files = res.body.files;
            files.forEach((file) => {
                (0, chai_1.expect)(file.file_id).to.exist;
                (0, chai_1.expect)(file.file_id).to.be.a('string');
                (0, chai_1.expect)(file.file_name).to.exist;
                (0, chai_1.expect)(file.file_name).to.be.a('string');
                (0, chai_1.expect)(file.file_history).to.exist;
                (0, chai_1.expect)(file.file_history).to.be.an('array');
                file.file_history.forEach((event) => {
                    (0, chai_1.expect)(event.event).to.exist;
                    (0, chai_1.expect)(event.date).to.exist;
                });
            });
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should get all files in folder, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default)
                .get(`/folders/testfolder?token=${token}`);
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body.files).to.exist;
            const files = res.body.files;
            files.forEach((file) => {
                (0, chai_1.expect)(file.file_id).to.exist;
                (0, chai_1.expect)(file.file_id).to.be.a('string');
                (0, chai_1.expect)(file.file_name).to.exist;
                (0, chai_1.expect)(file.file_name).to.be.a('string');
                (0, chai_1.expect)(file.file_history).to.exist;
                (0, chai_1.expect)(file.file_history).to.be.an('array');
                file.file_history.forEach((event) => {
                    (0, chai_1.expect)(event.event).to.exist;
                    (0, chai_1.expect)(event.date).to.exist;
                });
            });
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should get all files in folder, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default)
                .get(`/folders/wrongfolderdoes?token=${token}`);
            (0, chai_1.expect)(res).to.have.status(404);
            (0, chai_1.expect)(res.body).to.have.property('error', 'You do not have a folder named wrongfolderdoes');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say unauthorized', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default)
                .get('/folders/testfolder');
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body.error).to.equal('Unauthorized');
        }));
    });
    (0, mocha_1.describe)('POST /folders', () => {
        (0, mocha_1.it)('should create a new folder', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/folders').send({
                name: 'newboys'
            }).set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', 'newboys folder succesfully created');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should create a new folder, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).post(`/folders?token=${token}`).send({
                name: 'newboys2'
            });
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', 'newboys2 folder succesfully created');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say folder already exists', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).post(`/folders?token=${token}`).send({
                name: 'testfolder'
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.have.property('error', 'testfolder folder already exists');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say name cannot be null', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).post(`/folders?token=${token}`).send({
                name: 'null'
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Name cannot be "null"');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say name error', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).post(`/folders?token=${token}`).send({});
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter a Folder name');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say name error, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).post(`/folders?token=${token}`).send({
                name: true
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter a Folder name');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say name error, alt 2', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).post(`/folders?token=${token}`).send({
                name: undefined
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter a Folder name');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say name error, alt 3', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).post(`/folders?token=${token}`).send({
                name: null
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Please enter a Folder name');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say unauthorized', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).post('/folders').send({
                name: 'tratra'
            });
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
        }));
    });
    (0, mocha_1.describe)('PUT /folders/:folderName', () => {
        (0, mocha_1.it)('should move file to folder', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).put('/folders/testfolder').send({
                fileName: 'move',
                source: 'testfolder2'
            }).set('Authorization', `Bearer ${token}`);
            console.log(res.body);
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', 'move moved from testfolder2 to testfolder');
            res = yield chai_1.default.request(server_1.default).put('/folders/testfolder2').send({
                fileName: 'move',
                source: 'testfolder'
            }).set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', 'move moved from testfolder to testfolder2');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should move file to folder, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).put(`/folders/testfolder?token=${token}`).send({
                fileName: 'move',
                source: 'testfolder2'
            });
            console.log(res.body);
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', 'move moved from testfolder2 to testfolder');
            res = yield chai_1.default.request(server_1.default).put(`/folders/testfolder2?token=${token}`).send({
                fileName: 'move',
                source: 'testfolder'
            });
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', 'move moved from testfolder to testfolder2');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say file already exists', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).put(`/folders/testfolder2?token=${token}`).send({
                fileName: 'move',
                source: 'testfolder2'
            });
            (0, chai_1.expect)(res).to.have.status(400);
            (0, chai_1.expect)(res.body).to.have.property('error', 'move already exists in testfolder2 folder');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say do not have folder', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).put(`/folders/nofolder?token=${token}`).send({
                fileName: 'test2',
                source: 'null'
            });
            (0, chai_1.expect)(res).to.have.status(404);
            (0, chai_1.expect)(res.body).to.have.property('error', 'You do not have a folder named nofolder');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say do not have folder, alt', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).put(`/folders/testfolder?token=${token}`).send({
                fileName: 'test2',
                source: 'nofolder'
            });
            (0, chai_1.expect)(res).to.have.status(404);
            (0, chai_1.expect)(res.body).to.have.property('error', 'You do not have a folder named nofolder');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say do not have file', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).put(`/folders/testfolder?token=${token}`).send({
                fileName: 'test5',
                source: 'null'
            });
            (0, chai_1.expect)(res).to.have.status(404);
            (0, chai_1.expect)(res.body).to.have.property('error', 'You do not have a file named test5 in root directory');
            yield redis_1.redisClient.del(`auth_${decodeURIComponent(token)}`);
        }));
        (0, mocha_1.it)('should say unauthorized', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default).put('/folders/testfolder').send({
                fileName: 'test5',
                source: 'null'
            });
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
        }));
    });
    (0, mocha_1.describe)('DELETE /folder/:folderName', () => {
        (0, mocha_1.it)('should delete folder', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default).post('/folders').send({
                name: 'newboys5'
            }).set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(201);
            (0, chai_1.expect)(res.body).to.have.property('message', 'newboys5 folder succesfully created');
            res = yield chai_1.default.request(server_1.default)
                .delete('/folders/newboys5')
                .set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(200);
            (0, chai_1.expect)(res.body).to.have.property('message', 'newboys5 successfully deleted');
        }));
        (0, mocha_1.it)('should say folder not found', () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield chai_1.default.request(server_1.default).post('/login').send({
                email: process.env.TESTS_MAIL,
                password: 'test123'
            });
            (0, chai_1.expect)(res).to.have.status(200);
            const token = res.body.token;
            res = yield chai_1.default.request(server_1.default)
                .delete('/folders/newboys7')
                .set('Authorization', `Bearer ${token}`);
            (0, chai_1.expect)(res).to.have.status(404);
            (0, chai_1.expect)(res.body).to.have.property('error', 'You do not have a folder named newboys7');
        }));
        (0, mocha_1.it)('should say unauthorized', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield chai_1.default.request(server_1.default)
                .delete('/folders/testfolder');
            (0, chai_1.expect)(res).to.have.status(401);
            (0, chai_1.expect)(res.body).to.have.property('error', 'Unauthorized');
        }));
    });
});
