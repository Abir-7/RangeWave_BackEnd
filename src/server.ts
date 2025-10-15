import server from "./app";
import { appConfig } from "./app/config";
import mongoose from "mongoose";

import seedAdmin from "./app/DB";

import logger from "./app/utils/logger";
import { initSocket } from "./app/socket/socket";
import { startConsumers } from "./app/rabbitMq/worker";
import { seedCars } from "./app/modules/carModel/seedCar";
import { seedCarIssue } from "./app/modules/carIssue/seedCarIssue";
//import { startCron } from "./app/modules/cronJobs/cronJobs";

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled promise rejection:", err);

  process.exit(1);
});

// Handle shutdown gracefully
process.on("SIGINT", async () => {
  process.exit(0);
});

process.on("SIGTERM", async () => {
  process.exit(0);
});

const main = async () => {
  await mongoose.connect(appConfig.database.dataBase_uri as string);

  //startCron();

  logger.info("MongoDB connected");
  await seedAdmin();
  startConsumers();
  await seedCars();
  await seedCarIssue();
  await initSocket(server);
  server.listen(
    Number(appConfig.server.port),
    appConfig.server.ip as string,
    () => {
      logger.info(
        `Example app listening on port ${appConfig.server.port} & ip:${
          appConfig.server.ip as string
        }`
      );
    }
  );
};
main().catch((err) => logger.error("Error connecting to MongoDB:", err));
