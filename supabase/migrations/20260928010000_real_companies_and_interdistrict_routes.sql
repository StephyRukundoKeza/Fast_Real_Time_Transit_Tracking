-- Replace remaining fictional company names with real, RURA-licensed
-- operators, and move two real interdistrict companies (Ritco, Horizon)
-- off Kigali city routes onto real interdistrict corridors they actually
-- run, adding those corridors as new routes.
--
-- Fares for R5/R6/R7 are estimated by scaling the existing R4 fare against
-- real road distances, not pulled from a live published fare sheet --
-- double check against a real fare table before this is customer-facing.
-- Durations (180/200/270 min) are reasonable estimates for those
-- distances, not schedule-verified.
--
-- Run this SQL in the Supabase SQL Editor to apply (this repo does not
-- auto-run migrations against the live database).

-- 1. Fix fictional company names -> real ones
update buses set company_name = 'Kigali Bus Services'
where company_name = 'Kigali Bus Company';

update buses set company_name = 'Royal Express'
where company_name = 'Rwanda Transit';

-- 2. Add the new real interdistrict routes
insert into routes (route_number, route_name, origin, destination, is_active, is_kigali, fare_rwf, stops)
select 'R5', 'Nyabugogo - Huye', 'Nyabugogo', 'Huye', true, false, 5400,
  '[{"name":"Nyabugogo","lat":-1.940913,"lng":30.044749},{"name":"Muhanga","lat":-2.0742,"lng":29.7566},{"name":"Huye","lat":-2.5967,"lng":29.7392}]'::jsonb
where not exists (select 1 from routes where route_number = 'R5');

insert into routes (route_number, route_name, origin, destination, is_active, is_kigali, fare_rwf, stops)
select 'R6', 'Nyabugogo - Rubavu', 'Nyabugogo', 'Rubavu', true, false, 6300,
  '[{"name":"Nyabugogo","lat":-1.940913,"lng":30.044749},{"name":"Muhanga","lat":-2.0742,"lng":29.7566},{"name":"Rubavu","lat":-1.7038,"lng":29.2564}]'::jsonb
where not exists (select 1 from routes where route_number = 'R6');

insert into routes (route_number, route_name, origin, destination, is_active, is_kigali, fare_rwf, stops)
select 'R7', 'Nyabugogo - Rusizi', 'Nyabugogo', 'Rusizi', true, false, 9200,
  '[{"name":"Nyabugogo","lat":-1.940913,"lng":30.044749},{"name":"Huye","lat":-2.5967,"lng":29.7392},{"name":"Rusizi","lat":-2.4847,"lng":28.9058}]'::jsonb
where not exists (select 1 from routes where route_number = 'R7');

-- 3. Move Ritco off R1 (Kigali city) onto R5 -- a real corridor RITCO's own
-- site confirms it runs (Nyabugogo -> Huye)
update buses set route_id = (select id from routes where route_number = 'R5')
where bus_number = 'RIT 100A';

update trip_schedules set
  route_id = (select id from routes where route_number = 'R5'),
  duration_minutes = 180
where bus_id = (select id from buses where bus_number = 'RIT 100A');

-- 4. Move Horizon off R2 (Kigali city) onto R6 -- a real interdistrict corridor
update buses set route_id = (select id from routes where route_number = 'R6')
where bus_number = 'HOR 300C';

update trip_schedules set
  route_id = (select id from routes where route_number = 'R6'),
  duration_minutes = 200
where bus_id = (select id from buses where bus_number = 'HOR 300C');

-- 5. Backfill R1 and R2 with real Kigali zone operators to replace the ones that moved
insert into buses (bus_number, plate_number, company_name, route_id, capacity, status)
select 'ROY 101A', 'RAC 101 A', 'Royal Express', id, 30, 'active'
from routes where route_number = 'R1'
and not exists (select 1 from buses where bus_number = 'ROY 101A');

insert into buses (bus_number, plate_number, company_name, route_id, capacity, status)
select 'RFT 402B', 'RAE 402 B', 'RFTC', id, 30, 'active'
from routes where route_number = 'R2'
and not exists (select 1 from buses where bus_number = 'RFT 402B');

-- 6. Add Stella Express on the new R7 corridor
insert into buses (bus_number, plate_number, company_name, route_id, capacity, status)
select 'STE 500A', 'RAF 500 A', 'Stella Express', id, 45, 'active'
from routes where route_number = 'R7'
and not exists (select 1 from buses where bus_number = 'STE 500A');

-- 7. Seed trip_schedules for the 3 new buses (2 departures each) and
-- backfill real trips immediately
insert into trip_schedules (route_id, bus_id, departure_time_of_day, duration_minutes, is_active)
select r.id, b.id, t.dep::time, t.dur, true
from routes r
join buses b on b.bus_number = 'ROY 101A'
cross join (values ('06:30', 25), ('16:30', 25)) as t(dep, dur)
where r.route_number = 'R1'
and not exists (select 1 from trip_schedules ts where ts.bus_id = b.id and ts.departure_time_of_day = t.dep::time);

insert into trip_schedules (route_id, bus_id, departure_time_of_day, duration_minutes, is_active)
select r.id, b.id, t.dep::time, t.dur, true
from routes r
join buses b on b.bus_number = 'RFT 402B'
cross join (values ('06:45', 20), ('16:45', 20)) as t(dep, dur)
where r.route_number = 'R2'
and not exists (select 1 from trip_schedules ts where ts.bus_id = b.id and ts.departure_time_of_day = t.dep::time);

insert into trip_schedules (route_id, bus_id, departure_time_of_day, duration_minutes, is_active)
select r.id, b.id, t.dep::time, t.dur, true
from routes r
join buses b on b.bus_number = 'STE 500A'
cross join (values ('07:00', 270), ('14:00', 270)) as t(dep, dur)
where r.route_number = 'R7'
and not exists (select 1 from trip_schedules ts where ts.bus_id = b.id and ts.departure_time_of_day = t.dep::time);

-- 8. Backfill real trips for everything that changed
select generate_upcoming_trips();
