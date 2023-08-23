"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RequestError extends Error {
    /* eslint-disable-next-line @typescript-eslint/no-useless-constructor */
    constructor(message) {
        super(message);
    }
}
exports.default = RequestError;
