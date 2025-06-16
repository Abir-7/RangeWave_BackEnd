/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import logger from "../../utils/logger";
import { emailWorker } from "./email.worker";

export const workers = [emailWorker];

export const initWorkers = async () => {
  logger.info("All workers initialized");
};

export const shutdownWorkers = async () => {
  for (const worker of workers) {
    try {
      await worker.close();
      logger.info(`Closed worker: ${worker.name}`);
    } catch (err) {
      logger.error(`Failed to close worker: ${worker.name}`, err);
    }
  }
};
