import logger from "heroku-logger";
import dedent from "dedent-js";

function formatOperationMessage(item) {
  let title;
  let body;
  const {
    description,
    operationType,
    totalAmount,
    transAmount,
    service,
    fees,
    location,
  } = item;

  switch (operationType) {
    case "transfer":
      title = description;
      body = `${totalAmount.value} <b>${totalAmount.currency}</b>`;
      break;

    case "payment":
      {
        let feeAmount = "";
        if (fees.totalFee) {
          feeAmount = ` (including ${fees.totalFee.value} <b>${fees.totalFee.currency}</b> fee)`;
        }
        title = service.name;
        body = dedent`
              ${totalAmount.value} <b>${totalAmount.currency}</b>${feeAmount}
              <i>Customer ID</i>: ${service.shortFields.CUSTOM_IDT}
            `;
      }
      break;

    case "fee":
      title = location.merchant;
      body = dedent`
            ${totalAmount.value} <b>${totalAmount.currency}</b>          
            ${description}
          `;
      break;

    case "interests":
      title = description;
      body = `${transAmount.value} <b>${transAmount.currency}</b>`;
      break;

    default:
      logger.warn("Unknown operation type", { id: item.id, operationType });
  }
  body += `\n<i>Type</i>: ${operationType}`;

  return { title, body };
}

function formatRegularMessage(item) {
  let accountCurrencyAmount = "";
  const { merchantCategory, totalAmount, transAmount, location } = item;

  if (transAmount.currency !== totalAmount.currency) {
    accountCurrencyAmount = ` (${totalAmount.value} <b>${totalAmount.currency}</b>)`;
  }

  const title = location.merchant;
  let body = `${transAmount.value} <b>${transAmount.currency}</b>${accountCurrencyAmount}`;

  if (location.country && location.city) {
    body += `\n<i>Location</i>: ${location.country} ${location.city}`;
  }

  if (merchantCategory) {
    body += `\n<i>Category</i>: #${merchantCategory}`;
  }

  return { title, body };
}

function convertTZ(date, timezoneString) {
  return new Date(date).toLocaleString("en-GB", { timeZone: timezoneString });
}

function formatHistoryMessage(item) {
  let message = "";

  try {
    const { body, title } = item.operationType
      ? formatOperationMessage(item)
      : formatRegularMessage(item);

    if (title && body) {
      message = dedent`
        <b>${title}</b>
        
        ${body}
        
        at ${convertTZ(item.operationTime, process.env.TIMEZEONE)}
      `;
    }
  } catch (exception) {
    logger.warn(exception.message, { item });
    message = dedent`
      Error: Could not process transaction message
  
      <i>${item.id}</i>
    `;
  }

  return message;
}

export default formatHistoryMessage;
