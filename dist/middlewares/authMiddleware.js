"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireNoAuth = void 0;
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
