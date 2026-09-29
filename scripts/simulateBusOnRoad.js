// scripts/simulateBusOnRoad.js
//
// Simulates a bus moving back and forth along the REAL ROAD PATH between
// its route's stops (using OSRM's public routing service), instead of a
// straight line between two points. Pushes location updates into
// `bus_locations` for Supabase Realtime to broadcast to the map.
//
// Usage:
//   node --env-file=.env.local scripts/simulateBusOnRoad.js "RIB 401D"
//   node --env-file=.env.local scripts/simulateBusOnRoad.js "RIB 401D" 60   (60 km/h instead of the default 40)

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const [, , busNumberArg, speedArg] = process.argv;
const BUS_NUMBER = busNumberArg;
const SPEED_KMH = Number(speedArg) || 40;
const TICK_MS = 3000;

if (!BUS_NUMBER) {
  console.error('Usage: node --env-file=.env.local scripts/simulateBusOnRoad.js "<bus_number>" [speed_kmh]');
  process.exit(1);
}

function toRad(d) { return (d * Math.PI) / 180; }
function toDeg(r) { return (r * 180) / Math.PI; }

function haversineKm(a, b) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

function bearing(a, b) {
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findBus(busNumber) {
  const { data, error } = await supabase
    .from("buses")
    .select("id, bus_number, route_id")
    .eq("bus_number", busNumber)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`No bus found with bus_number "${busNumber}"`);
  return data;
}

async function findRouteStops(routeId) {
  const { data, error } = await supabase
    .from("routes")
    .select("route_name, stops")
    .eq("id", routeId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`No route found with id "${routeId}"`);
  if (!Array.isArray(data.stops) || data.stops.length < 2) {
    throw new Error(`Route "${data.route_name}" needs at least 2 stops in its "stops" column to build a road path.`);
  }
  return data;
}

// Ask OSRM's public routing server for the real road-following path that
// passes through every stop, in order. Returns an array of {lat, lng}.
async function fetchRoadPath(stops) {
  const coords = stops.map((s) => `${s.lng},${s.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM request failed: ${res.status} ${res.statusText}`);
  const json = await res.json();

  if (json.code !== "Ok" || !json.routes?.[0]) {
    throw new Error(`OSRM could not find a road route: ${json.message || json.code}`);
  }

  return json.routes[0].geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
}

// Precompute cumulative distance (km) at each point along the path, so we
// can place the bus at any distance-along-path without recomputing.
function buildCumulativeDistances(path) {
  const cumulative = [0];
  for (let i = 1; i < path.length; i++) {
    cumulative.push(cumulative[i - 1] + haversineKm(path[i - 1], path[i]));
  }
  return cumulative;
}

// Given a distance travelled along the path, find the interpolated
// {lat, lng} and the heading at that point.
function pointAtDistance(path, cumulative, distanceKm) {
  const total = cumulative[cumulative.length - 1];
  const d = Math.max(0, Math.min(distanceKm, total));

  let i = 1;
  while (i < cumulative.length && cumulative[i] < d) i++;
  i = Math.min(i, path.length - 1);

  const segStart = cumulative[i - 1];
  const segEnd = cumulative[i];
  const segLen = segEnd - segStart || 1;
  const t = (d - segStart) / segLen;

  const a = path[i - 1];
  const b = path[i];

  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
    heading: bearing(a, b),
  };
}

async function main() {
  const bus = await findBus(BUS_NUMBER);
  const route = await findRouteStops(bus.route_id);

  console.log(`Fetching real road path for "${route.route_name}" through ${route.stops.length} stop(s)...`);
  const path = await fetchRoadPath(route.stops);
  const cumulative = buildCumulativeDistances(path);
  const totalKm = cumulative[cumulative.length - 1];

  console.log(`Got a road path of ${path.length} points, ${totalKm.toFixed(1)} km, at ${SPEED_KMH} km/h.`);
  console.log("Press Ctrl+C to stop.");

  let traveled = 0;
  let direction = 1;
  const kmPerTick = (SPEED_KMH * (TICK_MS / 1000)) / 3600;

  while (true) {
    const point = pointAtDistance(path, cumulative, traveled);
    const heading = direction === 1 ? point.heading : (point.heading + 180) % 360;

    const { error } = await supabase.from("bus_locations").insert({
      bus_id: bus.id,
      lat: point.lat,
      lng: point.lng,
      heading,
      speed: SPEED_KMH,
      recorded_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to push location:", error.message);
    } else {
      console.log(`${traveled.toFixed(2)} / ${totalKm.toFixed(2)} km: (${point.lat.toFixed(5)}, ${point.lng.toFixed(5)})`);
    }

    traveled += direction * kmPerTick;
    if (traveled >= totalKm) {
      traveled = totalKm;
      direction = -1;
    } else if (traveled <= 0) {
      traveled = 0;
      direction = 1;
    }

    await sleep(TICK_MS);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});