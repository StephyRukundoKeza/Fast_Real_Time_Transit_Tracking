// Single entry point the UI calls — hides which provider is active behind it.
import * as mockProvider from "./mockProvider";

// Swap this one line once a real sandbox works, e.g.:
//   import * as dpoProvider from "./dpoProvider";
//   const ACTIVE_PROVIDER = dpoProvider;
const ACTIVE_PROVIDER = mockProvider;

export async function initiatePayment(params) {
  return ACTIVE_PROVIDER.initiatePayment(params);
}

export async function pollUntilFinal(transactionId, opts) {
  return ACTIVE_PROVIDER.pollUntilFinal(transactionId, opts);
}