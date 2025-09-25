/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import nodeCron from "node-cron";
import { Service } from "../serviceFlow/service/service.model";
import logger from "../../utils/logger";
import { Status } from "../serviceFlow/service/service.interface";

export const startCron = () => {
  nodeCron.schedule("0 2 * * *", async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await Service.deleteMany({
        status: Status.FINDING, // only delete services with status FINDING
        $or: [
          { "schedule.isSchedule": false, createdAt: { $lt: today } },
          { "schedule.isSchedule": true, "schedule.date": { $lt: today } },
        ],
      });
      logger.info(
        `[${new Date().toISOString()}] Deleted ${
          result.deletedCount
        } past services`
      );
    } catch (err) {
      logger.error("Error deleting past services:", err);
    }
  });
};
