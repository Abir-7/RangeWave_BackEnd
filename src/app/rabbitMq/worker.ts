import logger from "../utils/logger";
import { sendEmail } from "../utils/sendEmail";

import { consumeQueue } from "./consumer";

// Call the consumeQueue function to start consuming messages
export const startConsumers = () => {
  // Start consuming from the emailQueue
  consumeQueue("emailQueue", async (job) => {
    const { to, subject, body } = job;
    try {
      // Log the job data for debugging purposes
      logger.info(`Processing job: ${to}, ${subject}`);

      await sendEmail(to, subject, body); // Call your email function
    } catch (error) {
      logger.error("Error processing the job:", error);
    }
  });
};

// Initialize consumers when the app starts
