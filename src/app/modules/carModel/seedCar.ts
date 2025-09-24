/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import mongoose from "mongoose";
import carData from "./car-model.json";
import { Car } from "./carModel.interface.model";
import logger from "../../utils/logger";

export const seedCars = async () => {
  try {
    logger.info("🌱 Starting car seed...");

    // Clear existing (optional, remove if not needed)
    await Car.deleteMany({});

    const cars = Object.values(carData).map((model) => ({ model }));
    console.log(cars);
    // Batch insert in chunks of 5000 (good for 50k)
    const batchSize = 5000;
    for (let i = 0; i < cars.length; i += batchSize) {
      const chunk = cars.slice(i, i + batchSize);
      await Car.insertMany(chunk, { ordered: false });
      logger.info(`Inserted ${i + chunk.length}/${cars.length}`);
    }

    logger.info("✅ Car data seeded successfully!");
    await mongoose.connection.close();
  } catch (error) {
    logger.error("❌ Error seeding car data:", error);
    await mongoose.connection.close();
  }
};

// Run directly
