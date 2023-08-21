"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const createUsersAndFiles_1 = __importDefault(require("./migrations/createUsersAndFiles"));
const redis_1 = require("./config/redis");
const errorMiddleware_1 = __importDefault(require("./middlewares/errorMiddleware"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 6000;
// Check Redis
redis_1.redisClient.connect()
    .then(() => {
    console.log('Redis client connected');
})
    .catch(() => {
    console.log('Redis client not connected');
    process.exit(1);
});
// middlewares
app.use(express_1.default.json());
app.disable('x-powered-by');
app.get('/', (req, res) => {
    res.send('Welcome to the cloud backup API');
});
(0, createUsersAndFiles_1.default)()
    .then(() => {
    app.listen(port, () => {
        console.log(`Cloud backup server started on port ${port}`);
    });
})
    .catch(() => {
    process.exit(1);
});
app.use((req, res, next) => {
    try {
        res.status(404).json({
            error: "Page not found"
        });
    }
    catch (error) {
        next(error);
    }
});
app.use(errorMiddleware_1.default);
