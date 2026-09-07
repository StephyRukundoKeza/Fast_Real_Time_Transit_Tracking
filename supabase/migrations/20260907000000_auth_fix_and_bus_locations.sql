-- Fix: schema-qualify user_role type in the profile-creation trigger,
-- and restrict signup role to passenger/driver only (never admin).
create or replace function public.handle_new_user()
returns trigger as $$
declare
  requested_role text := new.raw_user_meta_data->>'role';
begin
  insert into public.profiles (id, phone, full_name, role)
  values (
    new.id,
    new.phone,
    coalesce(new.raw_user_meta_data->>'full_name', 'Passenger'),
    case
      when requested_role in ('passenger', 'driver') then requested_role::public.user_role
      else 'passenger'::public.user_role
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- bus_locations: a history log of GPS pings per bus, separate from
-- buses' own current_lat/current_lng "latest position" snapshot fields.
create table public.bus_locations (
  id uuid primary key default gen_random_uuid(),
  bus_id uuid not null references public.buses(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  heading double precision default 0.0,
  speed double precision default 0.0,
  recorded_at timestamptz not null default timezone('utc', now())
);

create index bus_locations_bus_id_idx on public.bus_locations (bus_id, recorded_at desc);

create function public.sync_bus_current_location()
returns trigger as $$
begin
  update public.buses
  set current_lat = new.lat, current_lng = new.lng,
      heading = new.heading, speed = new.speed, last_ping = new.recorded_at
  where id = new.bus_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_bus_location_insert
  after insert on public.bus_locations
  for each row execute function public.sync_bus_current_location();

alter table public.bus_locations enable row level security;
create policy "bus_locations_select_all" on public.bus_locations for select using (true);
create policy "bus_locations_driver_insert_own" on public.bus_locations for insert
  with check (exists (select 1 from public.buses where id = bus_id and driver_id = auth.uid()));
create policy "bus_locations_admin_write" on public.bus_locations for all
  using (public.is_admin()) with check (public.is_admin());

alter publication supabase_realtime add table public.bus_locations;