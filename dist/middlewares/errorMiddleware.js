"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorHandler = (err, req, res, next) => {
    if (err) {
        res.status(500).json({
            status: 'FAILED',
            error: 'Internal Server Error',
        });
    }
};
exports.default = errorHandler;
