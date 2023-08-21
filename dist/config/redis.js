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
exports.sessionStore = exports.redisClient = void 0;
const redis_1 = require("redis");
const connect_redis_1 = __importDefault(require("connect-redis"));
class RedisClient {
    constructor() {
        this.client = (0, redis_1.createClient)();
        this.clientConnected = true;
        this.client.on('error', (err) => {
            console.log(err.toString());
            this.clientConnected = false;
        });
        this.client.on('connect', () => {
            this.clientConnected = true;
        });
    }
    isAlive() {
        return this.clientConnected;
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.client.get(key);
        });
    }
    set(key, value, duration) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.set(key, value, {
                EX: duration,
                NX: true
            });
        });
    }
    del(key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.DEL(key);
        });
    }
}
const redisClient = new RedisClient();
exports.redisClient = redisClient;
const sessionStore = new connect_redis_1.default({
    client: redisClient,
    prefix: 'risevest:'
});
exports.sessionStore = sessionStore;
