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
exports.requireFolderAuth = exports.requireAuth = exports.requireNoAuth = void 0;
const db_1 = __importDefault(require("../config/db"));
const requireNoAuth = (req, res, next) => {
    try {
        if (req.user !== undefined) {
            return res.status(401).json({ error: 'A user is already logged' });
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requireNoAuth = requireNoAuth;
const requireAuth = (req, res, next) => {
    try {
        if (req.user === undefined) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requireAuth = requireAuth;
const requireFolderAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.user === undefined) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { name } = req.params;
        const Folders = (0, db_1.default)('folders');
        const folder = yield Folders.where({ name, user_id: req.user.id }).first();
        if (folder === undefined) {
            return res.status(400).json({ error: `You do not have a folder named ${name}` });
        }
        res.locals.folderId = folder.id;
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.requireFolderAuth = requireFolderAuth;
