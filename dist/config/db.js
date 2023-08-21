"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const knex_1 = require("knex");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const port = Number(process.env.PG_PORT);
const config = {
    client: 'pg',
    connection: {
        host: process.env.PG_HOST,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        database: process.env.PG_DATABASE,
        port
    }
};
const db = (0, knex_1.knex)(config);
exports.default = db;
