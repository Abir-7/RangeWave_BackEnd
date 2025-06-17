import server from "./app";
import { appConfig } from "./app/config";
import mongoose from "mongoose";

import seedAdmin from "./app/DB";
import { initWorkers, shutdownWorkers } from "./app/bullMQ/worker/initWorkers";
import logger from "./app/utils/logger";
import { initSocket } from "./app/socket/socket";

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
  await shutdownWorkers();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await shutdownWorkers();
  process.exit(0);
});

const main = async () => {
  await mongoose.connect(appConfig.database.dataBase_uri as string);
  logger.info("MongoDB connected");
  await seedAdmin();
  await initWorkers();
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
