// scripts/seedPOIs.js
//
// One-off script: adds real points of interest (bus stations, markets,
// malls, landmarks) into the same `locations` table that seedLocations.js
// populated with settlements/sectors. There's no ready-made downloadable
// dataset for this in Rwanda (checked HDX — it has Populated Places, Health
// Facilities, Buildings, Roads, etc., but nothing for POIs), so this queries
// OpenStreetMap's free Overpass API live instead of reading a downloaded file.
//
// Categories pulled:
//   amenity=bus_station     -> 'bus_station'
//   amenity=marketplace     -> 'market'
//   shop=mall               -> 'mall'
//   tourism=attraction      -> 'landmark'
//   amenity=conference_centre -> 'landmark'
// (Generic "office" tags are skipped on purpose — in OSM almost none of
// those carry an actual business name, so importing them would just add
// thousands of unnamed, unsearchable rows.)
//
// One query pulls all of Rwanda; is_kigali is then set with a simple
// coordinate bounding-box check (see KIGALI_BBOX below) rather than a
// second area-based Overpass query, since OSM's "Kigali City" area name
// didn't resolve reliably in testing.
//
// Usage:
//   node --env-file=.env.local scripts/seedPOIs.js

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // bypasses RLS, same as seedLocations.js

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local.\n" +
    "Run with: node --env-file=.env.local scripts/seedPOIs.js"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Public Overpass mirrors — tried in order in case one is down or rate-limits.
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const OVERPASS_HEADERS = {
  "Content-Type": "text/plain",
  Accept: "application/json",
  "User-Agent": "SigaTransitApp-Seeder/1.0 (one-off data seeding script)",
};

const POI_TAG_FILTERS = [
  ['amenity', 'bus_station'],
  ['amenity', 'marketplace'],
  ['shop', 'mall'],
  ['tourism', 'attraction'],
  ['amenity', 'conference_centre'],
];

function tagFiltersToQL(areaVar) {
  return POI_TAG_FILTERS.map(
    ([key, value]) =>
      `  node["${key}"="${value}"](area.${areaVar});\n  way["${key}"="${value}"](area.${areaVar});`
  ).join("\n");
}

function buildQuery({ areaSelector, areaVar, outClause }) {
  return `[out:json][timeout:90];\n${areaSelector}->.${areaVar};\n(\n${tagFiltersToQL(areaVar)}\n);\n${outClause}`;
}

const NATIONWIDE_QUERY = buildQuery({
  areaSelector: `area["ISO3166-1"="RW"][admin_level=2]`,
  areaVar: "rw",
  outClause: "out center tags;",
});

// Overpass's area["name"="Kigali City"] lookup doesn't reliably match
// OSM's actual boundary tagging (it returned zero matches in testing), so
// instead of a second fragile query, "is this in Kigali" is answered with
// a simple bounding box computed straight from the Kigali City points in
// Map/populated_places.geojson (the same file seedLocations.js used),
// padded by ~0.03 degrees (~3km) for margin.
const KIGALI_BBOX = {
  minLat: -2.06,
  maxLat: -1.78,
  minLon: 29.99,
  maxLon: 30.30,
};

function isWithinKigali(lat, lon) {
  return (
    lat >= KIGALI_BBOX.minLat &&
    lat <= KIGALI_BBOX.maxLat &&
    lon >= KIGALI_BBOX.minLon &&
    lon <= KIGALI_BBOX.maxLon
  );
}

async function runOverpassQuery(query, label) {
  let lastError;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      console.log(`Querying ${label} via ${endpoint} ...`);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: OVERPASS_HEADERS,
        body: query,
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`);
      }
      const json = await res.json();
      return json.elements || [];
    } catch (err) {
      console.warn(`  ${label} failed on ${endpoint}: ${err.message}`);
      lastError = err;
    }
  }
  throw new Error(`All Overpass endpoints failed for ${label}: ${lastError?.message}`);
}

function categorize(tags) {
  if (!tags) return null;
  if (tags.amenity === "bus_station") return "bus_station";
  if (tags.amenity === "marketplace") return "market";
  if (tags.shop === "mall") return "mall";
  if (tags.tourism === "attraction") return "landmark";
  if (tags.amenity === "conference_centre") return "landmark";
  return null;
}

function extractCoords(el) {
  if (el.type === "node") {
    return { latitude: el.lat, longitude: el.lon };
  }
  // ways/relations come back with a computed center when queried with "out center"
  if (el.center) {
    return { latitude: el.center.lat, longitude: el.center.lon };
  }
  return null;
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
  const nationwideElements = await runOverpassQuery(NATIONWIDE_QUERY, "nationwide POIs");
  console.log(`Got ${nationwideElements.length} raw elements nationwide.`);

  const rows = [];
  let skippedNoName = 0;
  let skippedNoCoords = 0;

  for (const el of nationwideElements) {
    const category = categorize(el.tags);
    const name = el.tags?.name;
    if (!category || !name) {
      skippedNoName++;
      continue;
    }
    const coords = extractCoords(el);
    if (!coords || !Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)) {
      skippedNoCoords++;
      continue;
    }
    rows.push({
      name,
      category,
      province: null,
      district: null,
      is_kigali: isWithinKigali(coords.latitude, coords.longitude),
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
  }

  console.log(`Usable POIs: ${rows.length} (skipped ${skippedNoName} unnamed/untagged, ${skippedNoCoords} with bad coordinates).`);
  if (rows.length === 0) {
    console.log("Nothing to insert. Done.");
    return;
  }

  console.log(`Inserting ${rows.length} POIs into Supabase...`);
  const { inserted, failed } = await insertInBatches(rows);
  console.log(`Done. Inserted ${inserted}, failed ${failed}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
