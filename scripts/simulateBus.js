// scripts/simulateBus.js
// Dev-only tool: simulates a bus moving along a route by pushing a new
// GPS ping into bus_locations every few seconds. Not part of the shipped app.
import { createClient } from '@supabase/supabase-js'

const BUS_ID = process.argv[2]

if (!BUS_ID) {
  console.error('Usage: node --env-file=.env.local scripts/simulateBus.js <bus-id>')
  process.exit(1)
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// A simple straight-line path (edit these to any two real coordinates you like)
const START = { lat: -1.9441, lng: 30.0444 } // e.g. Nyabugogo
const END = { lat: -1.9526, lng: 30.1044 }   // e.g. Remera
const STEPS = 40
const INTERVAL_MS = 5000

let step = 0

function lerp(a, b, t) {
  return a + (b - a) * t
}

async function pushLocation() {
  const t = (step % STEPS) / STEPS
  const lat = lerp(START.lat, END.lat, t)
  const lng = lerp(START.lng, END.lng, t)
  const heading = Math.atan2(END.lng - START.lng, END.lat - START.lat) * (180 / Math.PI)
  const speed = 30 + Math.random() * 10

  const { error } = await supabase.from('bus_locations').insert({
    bus_id: BUS_ID,
    lat,
    lng,
    heading,
    speed,
  })

  if (error) {
    console.error('Failed to push location:', error.message)
  } else {
    console.log(`[${new Date().toLocaleTimeString()}] Pushed (${lat.toFixed(5)}, ${lng.toFixed(5)}) for bus ${BUS_ID}`)
  }

  step++
}

console.log(`Simulating bus ${BUS_ID}, pushing a location every ${INTERVAL_MS / 1000}s. Ctrl+C to stop.`)
pushLocation()
setInterval(pushLocation, INTERVAL_MS)