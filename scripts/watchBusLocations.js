// scripts/watchBusLocations.js
//
// Read-only: listens for new bus_locations rows via Supabase Realtime and
// prints them the instant they arrive — lets you watch the simulator's
// updates live without needing the map UI built yet.
//
// Usage:
//   node --env-file=.env.local scripts/watchBusLocations.js

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY; // same key the real app uses to read

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("Listening for live bus_locations updates... (Ctrl+C to stop)");

supabase
  .channel("bus-locations-watch")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "bus_locations" },
    (payload) => {
      const row = payload.new;
      console.log(
        `[LIVE] bus ${row.bus_id} -> (${row.lat.toFixed(5)}, ${row.lng.toFixed(5)}) heading ${row.heading}° speed ${row.speed}km/h at ${row.recorded_at}`
      );
    }
  )
  .subscribe((status) => {
    console.log("Subscription status:", status);
  });