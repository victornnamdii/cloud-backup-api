"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_session_1 = __importDefault(require("express-session"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const createUsersAndFiles_1 = __importDefault(require("./migrations/createUsersAndFiles"));
const redis_1 = require("./config/redis");
const errorMiddleware_1 = __importDefault(require("./middlewares/errorMiddleware"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const sessionMiddleware_1 = __importDefault(require("./middlewares/sessionMiddleware"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 6000;
const secret = process.env.SECRET_KEY;
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
app.use((0, cookie_parser_1.default)());
app.use((0, express_session_1.default)({
    name: 'risevest-sid',
    secret,
    resave: false,
    saveUninitialized: true,
    store: redis_1.sessionStore,
    cookie: {
        secure: process.env.NODE_ENV !== 'development',
        httpOnly: true,
        maxAge: 1 * 24 * 60 * 60 * 1000 // One day
    }
}));
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
/* eslint-disable @typescript-eslint/no-misused-promises */
app.use(sessionMiddleware_1.default);
app.use(userRoutes_1.default);
app.use(authRoutes_1.default);
app.use((req, res, next) => {
    try {
        return res.status(404).json({
            error: 'Page not found'
        });
    }
    catch (error) {
        next(error);
    }
});
app.use(errorMiddleware_1.default);
