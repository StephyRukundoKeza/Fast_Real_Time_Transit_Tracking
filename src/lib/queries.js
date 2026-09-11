import { supabase } from '../supabaseClient'

export async function getRoutes() {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('is_active', true)
  if (error) throw error
  return data
}

export async function getBuses() {
  const { data, error } = await supabase
    .from('buses')
    .select('*, routes(route_name, origin, destination)')
  if (error) throw error
  return data
}

export async function getSeats(tripId) {
  const { data, error } = await supabase
    .from('seats')
    .select('*')
    .eq('trip_id', tripId)
    .order('seat_number', { ascending: true })
  if (error) throw error
  return data
}