import "./src/config.cjs";
import logger from "heroku-logger";
import getHistory from "./src/vb24.mjs";
import sendMessage from "./src/tg.mjs";
import scheduleTask from "./src/scheduler.mjs";
import StorageManagerService from "./src/storage/storageManagerService.js";
import formatHistoryMessage from "./src/messaging.mjs";

const historyKey = "historyIds";

const storage = new StorageManagerService().getStorage();

async function sendHistoryUpdates() {
  const [history, storedHistoryIds] = await Promise.all([
    getHistory(),
    storage.getKey(historyKey),
  ]);

  if (Array.isArray(storedHistoryIds) && storedHistoryIds.length) {
    const newItems = history.filter(({ id }) => !storedHistoryIds.includes(id));

    if (newItems.length) {
      // History is sorted by date DESC order in source
      newItems.reverse();
      logger.info("New transaction ID(s)", {
        newTransactionIds: newItems.map(({ id }) => id),
      });
      const newItemsLength = newItems.length;
      for (let i = 0; i < newItemsLength; i += 1) {
        const item = newItems[i];
        logger.info("Sending message for transaction", {
          transactionId: item.id,
        });
        // eslint-disable-next-line no-await-in-loop
        await sendMessage(process.env.TG_CHAT_ID, formatHistoryMessage(item));
      }
    }
  }

  storage.storeKey(
    historyKey,
    history.map(({ id }) => id)
  );
}

logger.info("Starting bot");
scheduleTask(sendHistoryUpdates, process.env.POLLING_TIME_SEC);
