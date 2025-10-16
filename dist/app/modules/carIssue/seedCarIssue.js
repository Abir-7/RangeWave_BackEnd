"use strict";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
exports.seedCarIssue = seedCarIssue;
const carIssuse_model_1 = require("./carIssuse.model");
const logger_1 = __importDefault(require("../../utils/logger"));
const issue_json_1 = __importDefault(require("./issue.json"));
function seedCarIssue() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield carIssuse_model_1.CarIssue.deleteMany({});
            const data = issue_json_1.default.car_issues.map((issue) => ({ name: issue }));
            yield carIssuse_model_1.CarIssue.insertMany(data);
            logger_1.default.info("Car issue seeded.");
        }
        catch (err) {
            logger_1.default.error("❌ Error seeding car issues:", err);
            process.exit(1);
        }
    });
}
