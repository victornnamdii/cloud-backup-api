"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = __importDefault(require("../controllers/AuthController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const authRouter = (0, express_1.Router)();
/* eslint-disable @typescript-eslint/no-misused-promises */
authRouter.post('/login', authMiddleware_1.requireNoAuth, AuthController_1.default.login);
exports.default = authRouter;
