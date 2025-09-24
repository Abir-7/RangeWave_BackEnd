/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import mongoose from "mongoose";
import carData from "./car-model.json";
import { Car } from "./carModel.interface.model";
import logger from "../../utils/logger";

export const seedCars = async () => {
  try {
    logger.info("🌱 Starting car seed...");

    await mongoose.connect("mongodb://127.0.0.1:27017/yourdbname");

    const cars = Object.values(carData).map((model) => ({ model }));

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

      await Car.bulkWrite(operations, { ordered: false });
      logger.info(`Processed ${i + chunk.length}/${cars.length}`);
    }

    logger.info("✅ Car data seeded successfully!");
    await mongoose.connection.close();
  } catch (error) {
    logger.error("❌ Error seeding car data:", error);
    await mongoose.connection.close();
  }
};
