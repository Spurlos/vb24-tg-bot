import "./src/config.cjs";
import logger from "heroku-logger";
import getHistory from "./src/vb24.mjs";
import sendMessage from "./src/tg.mjs";
import scheduleTask from "./src/scheduler.mjs";
import { getKey, storeKey } from "./src/memoryStorage.mjs";
import formatHistoryMessage from "./src/messaging.mjs";

const historyKey = "historyIds";

async function sendHistoryUpdates() {
  const [history, storedHistoryIds] = await Promise.all([
    getHistory(),
    getKey(historyKey),
  ]);

  if (Array.isArray(storedHistoryIds) && storedHistoryIds.length) {
    const newItems = history.filter(({ id }) => !storedHistoryIds.includes(id));
    if (newItems.length) {
      logger.info("New transaction IDs", {
        newTransactionIds: newItems.map(({ id }) => id),
      });
      newItems.forEach((item) => {
        logger.info("Sending message for transaction", {
          transactionId: item.id,
        });
        sendMessage(process.env.TG_CHAT_ID, formatHistoryMessage(item));
      });
    }
  }

  storeKey(
    historyKey,
    history.map(({ id }) => id)
  );
}

logger.info("Starting bot");
scheduleTask(sendHistoryUpdates, process.env.POLLING_TIME_SEC);
