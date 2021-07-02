import { Telegraf } from "telegraf";
import logger from "heroku-logger";

const bot = new Telegraf(process.env.TG_BOT_TOKEN);

async function sendMessage(id, text) {
  logger.info("Sending message to user", { module: "tg", id });

  await bot.telegram.sendMessage(id, text, {
    parse_mode: "HTML",
  });
}

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

export default sendMessage;
