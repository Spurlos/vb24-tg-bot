import MemoryStorage from "./memoryStorage.mjs";
import RedisStorage from "./redisStorage.mjs";

class StorageManagerService {
  constructor() {
    if (process.env.REDIS_URL) {
      this.storage = new RedisStorage(process.env.REDIS_URL);
    } else {
      this.storage = new MemoryStorage();
    }
  }

  getStorage() {
    return this.storage;
  }
}

export default StorageManagerService;
