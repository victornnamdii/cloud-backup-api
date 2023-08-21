"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UsersController_1 = __importDefault(require("../controllers/UsersController"));
const userRouter = (0, express_1.Router)();
/* eslint-disable @typescript-eslint/no-misused-promises */
userRouter.post('/signup', UsersController_1.default.create);
exports.default = userRouter;
