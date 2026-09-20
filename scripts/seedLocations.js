// scripts/seedLocations.js
//
// One-off script: seeds a `locations` table in Supabase with REAL Rwanda
// place data, so search screens stop relying on hardcoded arrays.
//
// Two data sources are combined:
//  1. Nationwide named places (city / town / suburb) extracted from the
//     HDX/OpenStreetMap "Rwanda Populated Places" export
//     (Map/populated_places.geojson) — great coverage for inter-district
//     search, thin coverage inside Kigali itself.
//  2. Kigali's 35 official sectors (Gasabo: 15, Kicukiro: 10, Nyarugenge: 10),
//     verified against Wikipedia's district pages and geocoded via the free
//     OpenStreetMap Nominatim API — fills the Kigali gap in (1) with the
//     real neighbourhood names people actually search for (Remera,
//     Kimironko, Nyamirambo, etc.).
//
// Before running:
//   1. Create the table in the Supabase SQL editor:
//
//      create table locations (
//        id bigint generated always as identity primary key,
//        name text not null,
//        category text not null default 'place',
//        province text,
//        district text,
//        is_kigali boolean not null default false,
//        latitude double precision,
//        longitude double precision,
//        created_at timestamptz not null default now()
//      );
//
//   2. Make sure Map/populated_places.geojson exists (unzip the HDX
//      download into a Map/ folder at the project root if you haven't).
//
// Usage:
//   node --env-file=.env.local scripts/seedLocations.js
//
// This only inserts — safe to inspect the printed counts before it runs,
// but if you re-run it you will get duplicate rows (there's no unique
// constraint on name+province yet), so only run it once, or truncate the
// table first if you need to re-seed.

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
// Use the service role key for this admin/backend seeding script so it
// bypasses Row Level Security — the anon key (used by the actual app) is
// meant to be read-only here and will always be blocked from inserting.
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local.\n" +
    "Get the service role key from: Supabase dashboard -> Project Settings -> API -> service_role secret.\n" +
    "NEVER put that key in frontend code or commit it — .env.local only.\n" +
    "Run with: node --env-file=.env.local scripts/seedLocations.js"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const GEOJSON_PATH = path.resolve("Map/populated_places.geojson");

// Only keep features that are actually named, real settlements —
// this drops ~6,300 unnamed residential-landuse polygons and ~3,150
// villages/hamlets that are too granular for a bus-route search.
const KEEP_PLACE_TYPES = new Set(["city", "town", "suburb"]);

// Verified against en.wikipedia.org/wiki/Gasabo_District,
// /wiki/Kicukiro_District and /wiki/Nyarugenge_District.
const KIGALI_SECTORS = {
  Gasabo: [
    "Bumbogo", "Gatsata", "Gikomero", "Gisozi", "Jabana", "Jali", "Kacyiru",
    "Kimihurura", "Kimironko", "Kinyinya", "Ndera", "Nduba", "Remera",
    "Rusororo", "Rutunga",
  ],
  Kicukiro: [
    "Kagarama", "Niboye", "Gatenga", "Gikondo", "Gahanga", "Kanombe",
    "Nyarugunga", "Kigarama", "Masaka", "Kicukiro",
  ],
  Nyarugenge: [
    "Gitega", "Kanyinya", "Kigali", "Kimisagara", "Mageragere", "Muhima",
    "Nyakabanda", "Nyamirambo", "Nyarugenge", "Rwezamenyo",
  ],
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Free geocoder, no API key — but its usage policy caps requests at 1/sec
// and requires an identifying User-Agent, both handled below.
async function nominatimQuery(queryText) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=rw&q=${encodeURIComponent(
    queryText
  )}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "SigaTransitApp-Seeder/1.0" },
  });
  if (!res.ok) throw new Error(`Nominatim error ${res.status} for "${queryText}"`);
  const results = await res.json();
  if (!results.length) return null;
  return { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon) };
}

// Some smaller/newer sectors don't match a "Name, Kigali, Rwanda" style query
// but do match a looser one, so try progressively simpler forms before
// giving up on a sector entirely.
async function geocodeNominatim(sectorName) {
  const attempts = [
    `${sectorName}, Kigali, Rwanda`,
    `${sectorName}, Rwanda`,
    sectorName,
  ];
  for (let i = 0; i < attempts.length; i++) {
    const coords = await nominatimQuery(attempts[i]);
    if (coords) return coords;
    if (i < attempts.length - 1) await sleep(1100); // stay under 1 req/sec between retries too
  }
  return null;
}

// Most features are a simple Point, but a handful of places (e.g. town/city
// boundaries) are stored as an area instead of a single node. For those we
// just average the outer ring's points as a good-enough centroid — this is
// a search/display marker, not a survey measurement.
function averageRing(ring) {
  let sumLng = 0;
  let sumLat = 0;
  for (const [lng, lat] of ring) {
    sumLng += lng;
    sumLat += lat;
  }
  return [sumLng / ring.length, sumLat / ring.length];
}

function extractLngLat(geometry) {
  if (!geometry) return null;
  if (geometry.type === "Point") {
    return geometry.coordinates;
  }
  if (geometry.type === "Polygon") {
    return averageRing(geometry.coordinates[0]);
  }
  if (geometry.type === "MultiPolygon") {
    return averageRing(geometry.coordinates[0][0]);
  }
  return null;
}

function loadNationwidePlaces() {
  if (!fs.existsSync(GEOJSON_PATH)) {
    console.error(`Could not find ${GEOJSON_PATH} — unzip the HDX download into a Map/ folder first.`);
    process.exit(1);
  }
  const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf-8"));

  const rows = [];
  let skipped = 0;
  for (const feature of geojson.features) {
    const p = feature.properties;
    if (!p.name || !KEEP_PLACE_TYPES.has(p.place)) continue;

    const point = extractLngLat(feature.geometry);
    const [longitude, latitude] = point || [];
    if (typeof longitude !== "number" || typeof latitude !== "number" || !Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      console.warn(`Skipping "${p.name}" — unsupported/invalid geometry (${feature.geometry?.type}).`);
      skipped++;
      continue;
    }
    rows.push({
      name: p.name,
      category: p.place, // 'city' | 'town' | 'suburb'
      province: p.adm1_name || null,
      district: p.adm2_name || null,
      is_kigali: (p.adm1_name || "").toLowerCase().includes("kigali"),
      latitude,
      longitude,
    });
  }
  if (skipped > 0) {
    console.warn(`Skipped ${skipped} place(s) with unusable geometry.`);
  }
  return rows;
}

async function loadKigaliSectors() {
  const rows = [];
  for (const [district, sectors] of Object.entries(KIGALI_SECTORS)) {
    for (const name of sectors) {
      const coords = await geocodeNominatim(name);
      if (!coords) {
        console.warn(`Could not geocode sector: ${name} (${district})`);
        continue;
      }
      rows.push({
        name,
        category: "sector",
        province: "Kigali City",
        district,
        is_kigali: true,
        latitude: coords.lat,
        longitude: coords.lon,
      });
      await sleep(1100); // stay under Nominatim's 1 request/sec limit
    }
  }
  return rows;
}

async function insertInBatches(rows, batchSize = 50) {
  let inserted = 0;
  let failed = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from("locations").insert(batch);
    if (error) {
      console.error(`Batch starting at row ${i + 1} failed:`, error.message);
      failed += batch.length;
    } else {
      console.log(`Inserted rows ${i + 1}-${i + batch.length}`);
      inserted += batch.length;
    }
  }
  return { inserted, failed };
}

async function main() {
  console.log("Reading nationwide places from Map/populated_places.geojson...");
  const nationwide = loadNationwidePlaces();
  console.log(`Found ${nationwide.length} named city/town/suburb places.`);

  console.log("Geocoding Kigali's 35 sectors via Nominatim (takes ~40 seconds, be patient)...");
  const kigali = await loadKigaliSectors();
  console.log(`Geocoded ${kigali.length}/35 Kigali sectors.`);

  const all = [...nationwide, ...kigali];
  console.log(`Inserting ${all.length} total rows into Supabase (in batches of 50, so one bad row won't sink everything else)...`);
  const { inserted, failed } = await insertInBatches(all);
  console.log(`Done. Inserted ${inserted}, failed ${failed}. Spot-check the \`locations\` table in the Supabase dashboard.`);
  if (failed > 0) {
    console.log("Some rows failed — scroll up to see which batch and why, then fix and re-run just that piece if needed.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
