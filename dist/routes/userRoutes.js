"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UsersController_1 = __importDefault(require("../controllers/UsersController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const userRouter = (0, express_1.Router)();
/* eslint-disable @typescript-eslint/no-misused-promises */
userRouter.post('/signup', UsersController_1.default.create);
userRouter.post('/admin/create', authMiddleware_1.requireSuperAdminAuth, UsersController_1.default.createAdmin);
userRouter.get('/users/verify-email/:userId/:uniqueString', UsersController_1.default.verifyEmail);
exports.default = userRouter;
