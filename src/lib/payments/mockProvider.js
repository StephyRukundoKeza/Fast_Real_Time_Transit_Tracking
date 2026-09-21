// Mock payment provider — simulates a mobile money charge/verify flow with
// the same shape a real gateway (Flutterwave, DPO, Pesapal) would have, so
// swapping in a real provider later only means replacing this file.
//
// Testing hook: any phone number ending in "0000" simulates a declined
// payment, so you can demo both the success and failure paths.

const CHARGE_DELAY_MS = 2500; // simulate the few seconds a real mobile money prompt takes
const DECLINE_SUFFIX = "0000";

let mockTxCounter = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function initiatePayment({ phoneNumber, amount, currency = "RWF", email, txRef }) {
  await sleep(400); // simulate initial API round-trip
  mockTxCounter += 1;
  const transactionId = txRef || `MOCK-${Date.now()}-${mockTxCounter}`;
  console.log(`[mockProvider] Charge initiated: ${transactionId} for ${amount} ${currency} to ${phoneNumber}`);
  return {
    success: true,
    transactionId,
    status: "pending",
  };
}

export async function pollUntilFinal(transactionId, { phoneNumber } = {}) {
  await sleep(CHARGE_DELAY_MS);
  const declined = phoneNumber && phoneNumber.replace(/\s/g, "").endsWith(DECLINE_SUFFIX);
  if (declined) {
    console.log(`[mockProvider] ${transactionId} declined (mock)`);
    return { transactionId, status: "failed", success: false, message: "Payment declined" };
  }
  console.log(`[mockProvider] ${transactionId} successful (mock)`);
  return { transactionId, status: "successful", success: true, message: "Payment successful" };
}