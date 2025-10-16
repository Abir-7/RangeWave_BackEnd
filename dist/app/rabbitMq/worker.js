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
exports.startConsumers = void 0;
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const logger_1 = __importDefault(require("../utils/logger"));
const sendEmail_1 = require("../utils/sendEmail");
const consumer_1 = require("./consumer");
// Call the consumeQueue function to start consuming messages
const startConsumers = () => {
    // Start consuming from the emailQueue
    (0, consumer_1.consumeQueue)("emailQueue", (job) => __awaiter(void 0, void 0, void 0, function* () {
        const { to, subject, body } = job;
        try {
            // Log the job data for debugging purposes
            logger_1.default.info(`Processing job: ${to}, ${subject}`);
            yield (0, sendEmail_1.sendEmail)(to, subject, body); // Call your email function
        }
        catch (error) {
            logger_1.default.error("Error processing the job:", error);
        }
    }));
};
exports.startConsumers = startConsumers;
// Initialize consumers when the app starts
