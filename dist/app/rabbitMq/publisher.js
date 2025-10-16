"use strict";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
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
exports.publishJob = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const rabbitMq_1 = require("./rabbitMq");
const publishJob = (queueName, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const channel = yield (0, rabbitMq_1.getChannel)();
    yield channel.assertQueue(queueName, { durable: true });
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(payload)), {
        persistent: true,
    });
    logger_1.default.info(`Job published to ${queueName}`);
});
exports.publishJob = publishJob;
