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
exports.startCron = void 0;
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const node_cron_1 = __importDefault(require("node-cron"));
const service_model_1 = require("../serviceFlow/service/service.model");
const logger_1 = __importDefault(require("../../utils/logger"));
const service_interface_1 = require("../serviceFlow/service/service.interface");
const startCron = () => {
    node_cron_1.default.schedule("0 2 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const result = yield service_model_1.Service.deleteMany({
                status: service_interface_1.Status.FINDING, // only delete services with status FINDING
                $or: [
                    { "schedule.isSchedule": false, createdAt: { $lt: today } },
                    { "schedule.isSchedule": true, "schedule.date": { $lt: today } },
                ],
            });
            logger_1.default.info(`[${new Date().toISOString()}] Deleted ${result.deletedCount} past services`);
        }
        catch (err) {
            logger_1.default.error("Error deleting past services:", err);
        }
    }));
};
exports.startCron = startCron;
