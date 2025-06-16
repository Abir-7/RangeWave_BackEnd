// app/utils/queue/emailWorker.ts
import { Worker } from "bullmq";
import { sendEmail } from "../../utils/sendEmail";
import { redisOptions } from "..";
import logger from "../../utils/logger";

export const emailWorker = new Worker(
  "email-queue",
  async (job) => {
    const { email, subject, text } = job.data;
    await sendEmail(email, subject, text);
  },
  {
    connection: redisOptions,
  }
);

emailWorker.on("completed", (job) => {
  logger.info(`✅ Email sent to ${job.data.email}`);
});

emailWorker.on("failed", (job, err) => {
  logger.error(`❌ Failed to send email to ${job?.data?.email}`, err);
});
