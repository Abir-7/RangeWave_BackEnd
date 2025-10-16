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
exports.seedCars = void 0;
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const car_model_json_1 = __importDefault(require("./car-model.json"));
const carModel_interface_model_1 = require("./carModel.interface.model");
const logger_1 = __importDefault(require("../../utils/logger"));
const seedCars = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger_1.default.info("🌱 Starting car seed...");
        const cars = Object.values(car_model_json_1.default).map((model) => ({ model }));
        const batchSize = 5000;
        for (let i = 0; i < cars.length; i += batchSize) {
            const chunk = cars.slice(i, i + batchSize);
            // create bulk operations
            const operations = chunk.map((car) => ({
                updateOne: {
                    filter: { model: car.model },
                    update: { $set: car },
                    upsert: true, // insert if not exists
                },
            }));
            yield carModel_interface_model_1.Car.bulkWrite(operations, { ordered: false });
            logger_1.default.info(`Processed ${i + chunk.length}/${cars.length}`);
        }
        logger_1.default.info("✅ Car data seeded successfully!");
    }
    catch (error) {
        logger_1.default.error("❌ Error seeding car data:", error);
    }
});
exports.seedCars = seedCars;
