import https from "https";
import logger from "heroku-logger";
import merge from "lodash.merge";
import { CookieJar, fetch } from "node-fetch-cookies";
// TODO: Figure out adding full CA chain for fetcher.
// import {create} from 'ssl-root-cas';
// https.globalAgent.options.ca = create();

const agent = new https.Agent({
  rejectUnauthorized: false,
});
const appEndpoint = "https://web.vb24.md/wb";
const commonRequestOptions = {
  headers: {
    accept: "application/json, text/javascript, */*; q=0.01",
    "accept-language": "en-CA,en-GB;q=0.9,en;q=0.8,ru;q=0.7",
    "cache-control": "no-cache",
    pragma: "no-cache",
    "sec-ch-ua":
      '"Google Chrome";v="93", " Not;A Brand";v="99", "Chromium";v="93"',
    "sec-ch-ua-mobile": "?0",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-requested-with": "XMLHttpRequest",
  },
  referrer: appEndpoint,
  referrerPolicy: "strict-origin-when-cross-origin",
  body: null,
  mode: "cors",
  agent,
};
const cookieJar = new CookieJar();
let sessionState = {};

function checkHttpStatus(response) {
  if (response.ok) {
    // response.status >= 200 && response.status < 300
    return response;
  }

  throw Error(response.statusText);
}

async function login() {
  const credentials = {
    login: process.env.VB24_LOGIN,
    password: process.env.VB24_PASSWORD,
    captcha: "",
  };
  const customRequestOptions = {
    headers: {
      "content-type": "application/json",
      "ow-client-browser": "Chrome",
    },
    body: JSON.stringify(credentials),
    method: "POST",
  };
  const options = merge({}, commonRequestOptions, customRequestOptions);

  await fetch(cookieJar, `${appEndpoint}/api/v2/session`, options)
    .then(checkHttpStatus)
    .then((loginResponse) => loginResponse.json())
    .then((loginJson) => {
      sessionState = loginJson;
      switch (sessionState.status) {
        case "authenticated":
          logger.debug("Successfully logged in", { module: "vb24" });
          break;
        case "not_authenticated":
          logger.debug("Could not login", { module: "vb24" });
          break;
        default:
          logger.warn("Unknown status after login attempt", {
            module: "vb24",
            status: sessionState.status,
          });
          // TODO: Probably throw an error here and stop execution after few retries
          break;
      }
    });
}

async function getCookie() {
  await fetch(cookieJar, `${appEndpoint}/`, commonRequestOptions)
    .then(checkHttpStatus)
    .then(() =>
      logger.debug("Fetched cookie from login page", { module: "vb24" })
    );
}

async function checkSessionStatus() {
  await fetch(cookieJar, `${appEndpoint}/api/v2/session`, commonRequestOptions)
    .then(checkHttpStatus)
    .then((sessionCheckResponse) => sessionCheckResponse.json())
    .then(({ status }) => {
      sessionState.status = status;
      switch (sessionState.status) {
        case "authenticated":
          logger.debug("Still logged in", { module: "vb24" });
          break;
        case "not_authenticated":
          logger.debug("We're logged out", { module: "vb24" });
          break;
        default:
          logger.warn("Unknown status after session status check attempt", {
            module: "vb24",
            status: sessionState.status,
          });
          // TODO: Probably throw an error here and stop execution after few retries
          break;
      }
    });
}

async function ensureSession() {
  logger.debug("Checking auth state", { module: "vb24" });
  await checkSessionStatus();
  if (sessionState.status === "not_authenticated") {
    await getCookie();
    await login();
  }
}

async function getHistory() {
  await ensureSession();
  logger.debug("Begin fetching history", { module: "vb24" });

  return fetch(cookieJar, `${appEndpoint}/api/v2/history`, commonRequestOptions)
    .then(checkHttpStatus)
    .then((historyResponse) => historyResponse.json());
}

async function getContracts() {
  await ensureSession();
  logger.debug("Begin fetching contracts", { module: "vb24" });

  return fetch(
    cookieJar,
    `${appEndpoint}/api/v2/contracts`,
    commonRequestOptions
  )
    .then(checkHttpStatus)
    .then((historyResponse) => historyResponse.json());
}

export { getHistory, getContracts };
