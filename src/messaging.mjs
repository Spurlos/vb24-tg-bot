function convertTZ(date, timezoneString) {
  return new Date(date).toLocaleString("en-GB", { timeZone: timezoneString });
}

function formatHistoryMessage(item) {
  const {
    description,
    merchantCategory,
    operationTime,
    transAmount,
    totalAmount,
  } = item;
  let accountCurrencyAmount = "";

  if (transAmount.currency !== totalAmount.currency) {
    accountCurrencyAmount = ` (${totalAmount.value} <b>${totalAmount.currency}</b>)`;
  }

  return `<b>${description}</b>

<i>Amount</i>: ${transAmount.value} <b>${
    transAmount.currency
  }</b>${accountCurrencyAmount}
<i>Category</i>: #${merchantCategory}
at ${convertTZ(operationTime, process.env.TIMEZEONE)}`;
}

export default formatHistoryMessage;
