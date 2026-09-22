// Shared input validation used across every form in the app: phone number
// entry (login + payment), payment amounts, and seat selection counts.

// Rwanda mobile numbers: +250 followed by 9 digits, the first of which is 7
// (covers both MTN and Airtel Rwanda ranges, written in international format).
const RWANDA_PHONE_REGEX = /^\+2507\d{8}$/;

export function isValidRwandaPhone(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/\s/g, "");
  return RWANDA_PHONE_REGEX.test(cleaned);
}

export function isValidPaymentAmount(amount) {
  return typeof amount === "number" && Number.isFinite(amount) && amount > 0;
}

export const MAX_SEATS_PER_TRIP = 4;

export function isValidSeatSelection(count, max = MAX_SEATS_PER_TRIP) {
  return Number.isInteger(count) && count >= 1 && count <= max;
}