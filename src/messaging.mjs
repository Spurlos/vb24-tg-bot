import logger from "heroku-logger";
import dedent from "dedent-js";
import { getContracts } from "./vb24.mjs";
import StorageManagerService from "./storage/storageManagerService.js";

const contractsKey = "contracts";
const storage = StorageManagerService.getStorage();
let contracts;

storage.getKey(contractsKey).then((storedData) => {
  if (storedData) {
    contracts = storedData;
    logger.debug("Got contracts data from storage", {
      module: "messaging",
    });
  } else {
    logger.debug("No contracts data stored. Trying to get from API", {
      module: "messaging",
    });
    getContracts().then((fetchedData) => {
      contracts = fetchedData;
      storage.setKey(contractsKey, fetchedData);
      logger.debug("Got contracts data from API", {
        module: "messaging",
      });
    });
  }
});

function getContractInfo(contractId) {
  const contract = contracts.find(({ id }) => id === contractId);
  let type;
  switch (contract.type) {
    case "card":
      type = "💳";
      break;

    case "cardAccount":
      type = "🏦";
      break;

    default:
      type = "";
  }

  return `${type} ${contract.name}`;
}

function formatOperationMessage(item) {
  let title;
  let body;
  const {
    description,
    fees,
    location,
    operationType,
    service,
    totalAmount,
    transAmount,
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
      logger.warn("Unknown operation type", {
        id: item.id,
        operationType,
        module: "messaging",
      });
  }
  body += `\n<i>Type</i>: ${operationType}`;

  return { title, body };
}

function formatRegularMessage(item) {
  let accountCurrencyAmount = "";
  const {
    isContactless,
    isTokenPay,
    location,
    merchantCategory,
    totalAmount,
    transAmount,
  } = item;

  let paymentMethod = "";
  if (isContactless) {
    paymentMethod = "💳";
    if (isTokenPay) {
      paymentMethod = "📲";
    }
  }

  if (transAmount.currency !== totalAmount.currency) {
    accountCurrencyAmount = ` (${totalAmount.value} <b>${totalAmount.currency}</b>)`;
  }

  const title = location.merchant;
  let body = `${transAmount.value} <b>${transAmount.currency}</b>${accountCurrencyAmount} ${paymentMethod}`;

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
        ${getContractInfo(item.contractId)}
        
        at ${convertTZ(item.operationTime, process.env.TIMEZONE)}
      `;
    }
  } catch (exception) {
    logger.warn(exception.message, { item, module: "messaging" });
    message = dedent`
      Error: Could not process transaction message
  
      <i>${item.id}</i>
    `;
  }

  return message;
}

export default formatHistoryMessage;
