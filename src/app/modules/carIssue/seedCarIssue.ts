/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { CarIssue } from "./carIssuse.model";
import logger from "../../utils/logger";
import issues from "./issue.json";

export async function seedCarIssue() {
  try {
    await CarIssue.deleteMany({});

    const data = issues.car_issues.map((issue: any) => ({ name: issue }));
    await CarIssue.insertMany(data);
    logger.info("Car issue seeded.");
  } catch (err) {
    logger.error("❌ Error seeding car issues:", err);
    process.exit(1);
  }
}
