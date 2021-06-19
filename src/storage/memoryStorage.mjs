import logger from "heroku-logger";

class MemoryStorage {
  constructor() {
    this.memoryStorage = {};
  }

  storeKey(key, data) {
    this.memoryStorage[key] = JSON.stringify(data);
    logger.debug("Set memory key value", { module: "memoryStorage", key });
  }

  async getKey(key) {
    let data = null;

    if (key in this.memoryStorage) {
      data = JSON.parse(this.memoryStorage[key]);
      logger.debug("Got memory key value", { module: "memoryStorage", key });
    }

    return data;
  }
}

export default MemoryStorage;
