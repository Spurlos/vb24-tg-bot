import Redis from "ioredis";
import logger from "heroku-logger";

class RedisStorage {
  constructor(serverURL) {
    this.client = new Redis(serverURL);
    logger.info("Redis client initialized", { module: "redisStorage" });
  }

  storeKey(key, data) {
    this.client.set(key, JSON.stringify(data), (error) => {
      logger.debug("Set callback execution", { module: "redisStorage" });
      if (error) {
        logger.error(error.message);
      }
    });
  }

  async getKey(key) {
    let data = null;

    try {
      const value = await this.client.get(key);

      logger.debug("Get executed", { module: "redisStorage" });
      data = JSON.parse(value);
    } catch (exception) {
      logger.warn(exception.message);
      logger.warn("Resetting corrupted key", { module: "redisStorage", key });
      this.storeKey(key, JSON.stringify({}));
    }

    return data;
  }
}

export default RedisStorage;
