import { RedisOptions } from "ioredis";
import { appConfig } from "../config";

export const redisOptions: RedisOptions = {
  host: appConfig.redis.host,
  port: Number(appConfig.redis.port),
};
