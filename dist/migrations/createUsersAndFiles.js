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
const hashPassword_1 = __importDefault(require("../utils/hashPassword"));
const db_1 = __importDefault(require("../config/db"));
const createTables = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let exists = yield db_1.default.schema.hasTable('users');
        if (!exists) {
            yield db_1.default.schema.createTable('users', (table) => {
                table.uuid('id').primary().defaultTo(db_1.default.fn.uuid());
                table.string('email').notNullable().unique();
                table.string('password').notNullable();
                table.string('first_name').notNullable();
                table.string('last_name').notNullable();
                table.boolean('is_superuser').defaultTo(false);
                table.timestamps(false, true);
            });
            console.log('Created Users Table');
            yield (0, db_1.default)('users').insert({
                email: process.env.ADMIN_EMAIL,
                password: (0, hashPassword_1.default)(process.env.ADMIN_PASSWORD),
                first_name: process.env.ADMIN_FIRST_NAME,
                last_name: process.env.ADMIN_LAST_NAME,
                is_superuser: true
            });
            console.log('Created Admin Account');
        }
        exists = yield db_1.default.schema.hasTable('folders');
        if (!exists) {
            yield db_1.default.schema.createTable('folders', (table) => {
                table.uuid('id').primary().defaultTo(db_1.default.fn.uuid());
                table.string('name', 100).notNullable();
                table.string('displayName', 100).notNullable();
                table.uuid('user_id').notNullable().references('id').inTable('users');
                table.timestamps(false, true);
            });
            yield db_1.default.schema.alterTable('folders', (table) => {
                table.unique(['user_id', 'name'], {
                    indexName: 'user_folders',
                    useConstraint: true
                });
            });
            console.log('Created Folders Table');
        }
        exists = yield db_1.default.schema.hasTable('files');
        if (!exists) {
            yield db_1.default.schema.createTable('files', (table) => {
                table.uuid('id').primary().defaultTo(db_1.default.fn.uuid());
                table.string('name', 100).notNullable();
                table.string('displayName', 100).notNullable();
                table.uuid('folder_id').references('id').inTable('folders').nullable();
                table.string('link').notNullable();
                table.string('s3_key').notNullable();
                table.uuid('user_id').notNullable().references('id').inTable('users');
                table.timestamps(false, true);
            });
            yield db_1.default.schema.alterTable('files', (table) => {
                table.unique(['user_id', 'name', 'folder_id'], {
                    indexName: 'user_files',
                    useConstraint: true
                });
            });
            console.log('Created Files Table');
        }
        console.log('Connected to DB');
    }
    catch (error) {
        console.log('Error connecting to DB');
        console.log(error);
        throw error;
    }
});
exports.default = createTables;
