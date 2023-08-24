"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
const errorHandler = (err, req, res, next) => {
    if (err !== undefined || err !== null) {
        console.log(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.default = errorHandler;
