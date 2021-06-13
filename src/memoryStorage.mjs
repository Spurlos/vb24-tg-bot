import logger from "heroku-logger";

const memoryStorage = {};

function storeKey(key, data) {
  memoryStorage[key] = JSON.stringify(data);
  logger.debug("Set memory key value", { module: "memoryStorage", key });
}

async function getKey(key) {
  let data = null;
  if (key in memoryStorage) {
    data = JSON.parse(memoryStorage[key]);
    logger.debug("Got memory key value", { module: "memoryStorage", key });
  }
  return data;
}

export { storeKey, getKey };
