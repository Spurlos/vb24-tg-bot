import Redis from "ioredis";
import logger from "heroku-logger";

const client = new Redis(process.env.REDIS_URL);

function storeKey(key, data) {
  client.set(key, JSON.stringify(data), (error) => {
    logger.debug("Set callback execution", { module: "redisStorage" });
    if (error) {
      logger.error(error.message);
    }
  });
}

async function getKey(key) {
  let data = null;
  try {
    const value = await client.get(key);

    logger.debug("Get executed", { module: "redisStorage" });
    data = JSON.parse(value);
  } catch (exception) {
    logger.warn(exception.message);
    logger.warn("Resetting corrupted key", { module: "redisStorage", key });
    storeKey(key, JSON.stringify({}));
  }

  return data;
}

logger.info("Redis client initialized", { module: "redisStorage" });

export { storeKey, getKey };
