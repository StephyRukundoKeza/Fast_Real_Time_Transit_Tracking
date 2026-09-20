// scripts/simulateBusLocation.js
//
// Simulates one bus moving back and forth between two real places (from
// your `locations` table) and pushes its position into `bus_locations`
// every few seconds, for Supabase Realtime to broadcast to the map.
//
// Usage:
//   node --env-file=.env.local scripts/simulateBusLocation.js "RAC 245B" "Nyabugogo" "Remera"

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const [, , busNumberArg, fromNameArg, toNameArg] = process.argv;
const BUS_NUMBER = busNumberArg;
const FROM_NAME = fromNameArg || "Nyabugogo";
const TO_NAME = toNameArg || "Remera";
const STEPS = 30;      // ticks to travel from A to B before turning around
const TICK_MS = 3000;  // push an update every 3 seconds

if (!BUS_NUMBER) {
  console.error('Usage: node --env-file=.env.local scripts/simulateBusLocation.js "<bus_number>" ["<from place>"] ["<to place>"]');
  process.exit(1);
}

async function findBusId(busNumber) {
  const { data, error } = await supabase
    .from("buses")
    .select("id, bus_number")
    .eq("bus_number", busNumber)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`No bus found with bus_number "${busNumber}"`);
  return data.id;
}

async function findLocation(name) {
  const { data, error } = await supabase
    .from("locations")
    .select("name, latitude, longitude")
    .ilike("name", `%${name}%`)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`No location found matching "${name}"`);
  return data;
}

function interpolate(a, b, t) {
  return {
    lat: a.latitude + (b.latitude - a.latitude) * t,
    lng: a.longitude + (b.longitude - a.longitude) * t,
  };
}

function calculateBearing(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const busId = await findBusId(BUS_NUMBER);
  const from = await findLocation(FROM_NAME);
  const to = await findLocation(TO_NAME);
  const forwardBearing = calculateBearing(from, to);
  const backwardBearing = calculateBearing(to, from);

  console.log(`Simulating bus ${BUS_NUMBER} (id ${busId}) between "${from.name}" and "${to.name}".`);
  console.log("Press Ctrl+C to stop.");

  let step = 0;
  let direction = 1; // 1 = heading to `to`, -1 = heading back to `from`

  while (true) {
    const t = direction === 1 ? step / STEPS : 1 - step / STEPS;
    const point = interpolate(from, to, t);

    const { error } = await supabase.from("bus_locations").insert({
      bus_id: busId,
      lat: point.lat,
      lng: point.lng,
      heading: direction === 1 ? forwardBearing : backwardBearing,
      speed: 30,
      recorded_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to push location:", error.message);
    } else {
      console.log(`Tick ${step}: (${point.lat.toFixed(5)}, ${point.lng.toFixed(5)})`);
    }

    step++;
    if (step > STEPS) {
      step = 0;
      direction *= -1; // reached the end, turn around
    }

    await sleep(TICK_MS);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});