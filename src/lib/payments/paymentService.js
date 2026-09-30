// Single entry point the UI calls — hides which provider is active behind it.
import * as mockProvider from "./mockProvider";

// Swap this one line once a real sandbox works, e.g.:
//   import * as dpoProvider from "./dpoProvider";
//   const ACTIVE_PROVIDER = dpoProvider;
const ACTIVE_PROVIDER = mockProvider;

// How long the app waits for a gateway to give a final answer before giving
// up on its own. Real mobile money prompts (USSD approval on the payer's
// phone) can take a few minutes, so this is deliberately generous — it's a
// safety net for a hung gateway, not the everyday case.
const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export async function initiatePayment(params) {
  return ACTIVE_PROVIDER.initiatePayment(params);
}

export async function pollUntilFinal(transactionId, opts) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => {
      resolve({
        transactionId,
        status: "timeout",
        success: false,
        message: "Payment timed out. Please try again.",
      });
    }, POLL_TIMEOUT_MS);
  });

  try {
    return await Promise.race([ACTIVE_PROVIDER.pollUntilFinal(transactionId, opts), timeout]);
  } finally {
    clearTimeout(timer);
  }
}