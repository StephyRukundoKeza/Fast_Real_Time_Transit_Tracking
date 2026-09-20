-- Data/Integration schema: fares, trip scheduling automation, bus-near-stop
-- notifications, booking history view, saved destinations.
-- Applied directly in Supabase on 2026-09-20. Reference only — do not re-run
-- against the same database.

alter table routes add column if not exists fare_rwf integer;
alter table routes add column if not exists is_kigali boolean not null default true;

-- TODO: paste real fare backfill statement from Supabase SQL Editor history.

create table if not exists trip_schedules (
  id bigint generated always as identity primary key,
  route_id uuid not null references routes(id),
  bus_id uuid not null references buses(id),
  departure_time_of_day time not null,
  duration_minutes integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- TODO: paste real trip_schedules seed insert from Supabase SQL Editor history.

create or replace function generate_upcoming_trips(days_ahead integer default 14)
returns void language plpgsql as $$
declare sched record; target_date date; new_departure timestamptz; new_arrival timestamptz; i integer;
begin
  for sched in select * from trip_schedules where is_active loop
    for i in 0..days_ahead loop
      target_date := current_date + i;
      new_departure := target_date + sched.departure_time_of_day;
      new_arrival := new_departure + (sched.duration_minutes || ' minutes')::interval;
      if not exists (select 1 from trips where bus_id = sched.bus_id and departure_time = new_departure) then
        insert into trips (route_id, bus_id, departure_time, arrival_time, status)
        values (sched.route_id, sched.bus_id, new_departure, new_arrival, 'scheduled');
      end if;
    end loop;
  end loop;
end; $$;

create extension if not exists pg_cron with schema extensions;
select cron.schedule('generate-upcoming-trips-daily', '0 0 * * *', $$select generate_upcoming_trips();$$);

with new_route as (
  insert into routes (route_number, route_name, origin, destination, is_active, is_kigali, fare_rwf, stops)
  values ('R4', 'Nyabugogo - Musanze', 'Nyabugogo', 'Musanze', true, false, 3821, '[]'::jsonb)
  returning id
)
insert into buses (bus_number, plate_number, company_name, route_id, capacity, status)
select 'RIB 401D', 'RAD 401 D', 'Volcano Express', id, 30, 'active' from new_route;

update routes set stops = '[{"name":"Nyabugogo","lat":-1.940913,"lng":30.044749},{"name":"Kimironko","lat":-1.942618,"lng":30.1382016}]'::jsonb where route_number = 'R1';
update routes set stops = '[{"name":"Kimisagara","lat":-1.951117,"lng":30.0452773},{"name":"Downtown (Kigali CBD Bus Station)","lat":-1.9434706,"lng":30.0572791}]'::jsonb where route_number = 'R2';
update routes set stops = '[{"name":"Remera","lat":-1.9562624,"lng":30.122076},{"name":"Nyabugogo","lat":-1.940913,"lng":30.044749}]'::jsonb where route_number = 'R3';
update routes set stops = '[{"name":"Nyabugogo","lat":-1.940913,"lng":30.044749},{"name":"Musanze","lat":-1.50405,"lng":29.63631}]'::jsonb where route_number = 'R4';

create or replace function haversine_meters(lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision)
returns double precision as $$
declare r double precision := 6371000; dlat double precision; dlon double precision; a double precision;
begin
  dlat := radians(lat2 - lat1); dlon := radians(lon2 - lon1);
  a := sin(dlat/2)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)^2;
  return r * 2 * asin(sqrt(a));
end; $$ language plpgsql immutable;

create table if not exists stop_notifications (
  id bigint generated always as identity primary key,
  bus_id uuid not null references buses(id),
  route_id uuid not null references routes(id),
  stop_name text not null,
  distance_meters double precision not null,
  triggered_at timestamptz not null default now()
);
alter table stop_notifications enable row level security;
create policy "stop_notifications_select_all" on stop_notifications for select using (true);

create or replace function detect_bus_near_stop()
returns trigger as $$
declare stop jsonb; stop_lat double precision; stop_lng double precision; stop_name text;
        new_dist double precision; old_dist double precision; threshold_meters constant double precision := 300;
begin
  if new.current_lat is null or new.current_lng is null or new.route_id is null then return new; end if;
  for stop in select jsonb_array_elements(coalesce(r.stops, '[]'::jsonb)) from routes r where r.id = new.route_id loop
    stop_lat := (stop->>'lat')::double precision; stop_lng := (stop->>'lng')::double precision; stop_name := stop->>'name';
    if stop_lat is null or stop_lng is null then continue; end if;
    new_dist := haversine_meters(new.current_lat, new.current_lng, stop_lat, stop_lng);
    if old.current_lat is not null and old.current_lng is not null then
      old_dist := haversine_meters(old.current_lat, old.current_lng, stop_lat, stop_lng);
    else old_dist := null; end if;
    if new_dist <= threshold_meters and (old_dist is null or old_dist > threshold_meters) then
      insert into stop_notifications (bus_id, route_id, stop_name, distance_meters) values (new.id, new.route_id, stop_name, new_dist);
    end if;
  end loop;
  return new;
end; $$ language plpgsql security definer;

create trigger on_bus_location_update after update of current_lat, current_lng on buses
  for each row execute function detect_bus_near_stop();
alter publication supabase_realtime add table stop_notifications;

create or replace view booking_history with (security_invoker = true) as
select b.id as booking_id, b.status, b.booked_at, b.passenger_id, s.seat_number,
       t.id as trip_id, t.departure_time, t.arrival_time, r.route_name, r.origin, r.destination, r.fare_rwf
from bookings b
join seats s on s.id = b.seat_id
join trips t on t.id = b.trip_id
join routes r on r.id = t.route_id;

create table if not exists saved_destinations (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  location_id bigint not null references locations(id) on delete cascade,
  label text,
  created_at timestamptz not null default now(),
  unique (user_id, location_id)
);
alter table saved_destinations enable row level security;
create policy "saved_destinations_select_own" on saved_destinations for select using (auth.uid() = user_id);
create policy "saved_destinations_insert_own" on saved_destinations for insert with check (auth.uid() = user_id);
create policy "saved_destinations_delete_own" on saved_destinations for delete using (auth.uid() = user_id);
