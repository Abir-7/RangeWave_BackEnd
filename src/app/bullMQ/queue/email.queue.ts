import { Queue } from "bullmq";
import { redisOptions } from "..";

export const emailQueue = new Queue("email-queue", {
  connection: redisOptions,
});
