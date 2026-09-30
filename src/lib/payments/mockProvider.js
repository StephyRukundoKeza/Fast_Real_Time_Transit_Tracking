// Mock payment provider — simulates a mobile money charge/verify flow with
// the same shape a real gateway (Flutterwave, DPO, Pesapal) would have, so
// swapping in a real provider later only means replacing this file.
//
// Testing hooks: a phone number ending in "0000" simulates a declined
// payment, and one ending in "9999" simulates a gateway timeout — so you
// can demo the success, decline, and timeout paths.

const CHARGE_DELAY_MS = 2500; // simulate the few seconds a real mobile money prompt takes
const DECLINE_SUFFIX = "0000";
const TIMEOUT_SUFFIX = "9999";
const TIMEOUT_DELAY_MS = 8000; // simulate a gateway that never responds in time

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
  const cleaned = phoneNumber ? phoneNumber.replace(/\s/g, "") : "";

  if (cleaned.endsWith(TIMEOUT_SUFFIX)) {
    await sleep(TIMEOUT_DELAY_MS);
    console.log(`[mockProvider] ${transactionId} timed out (mock)`);
    return { transactionId, status: "timeout", success: false, message: "Payment timed out. Please try again." };
  }

  await sleep(CHARGE_DELAY_MS);
  const declined = cleaned.endsWith(DECLINE_SUFFIX);
  if (declined) {
    console.log(`[mockProvider] ${transactionId} declined (mock)`);
    return { transactionId, status: "failed", success: false, message: "Payment declined" };
  }
  console.log(`[mockProvider] ${transactionId} successful (mock)`);
  return { transactionId, status: "successful", success: true, message: "Payment successful" };
}