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