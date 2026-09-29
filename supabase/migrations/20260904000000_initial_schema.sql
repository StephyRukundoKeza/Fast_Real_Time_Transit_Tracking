-- profiles
create table public.profiles (
  id uuid not null,
  phone text null,
  full_name text null,
  role public.user_role not null default 'passenger'::user_role,
  avatar_url text null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint profiles_pkey primary key (id),
  constraint profiles_phone_key unique (phone),
  constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade
);

-- routes
create table public.routes (
  id uuid not null default gen_random_uuid(),
  route_number text not null,
  route_name text not null,
  origin text not null,
  destination text not null,
  stops jsonb null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint routes_pkey primary key (id),
  constraint routes_route_number_key unique (route_number)
);

-- buses
create table public.buses (
  id uuid not null default gen_random_uuid(),
  bus_number text not null,
  plate_number text not null,
  company_name text null,
  route_id uuid null,
  driver_id uuid null,
  current_lat double precision null,
  current_lng double precision null,
  heading double precision null default 0.0,
  speed double precision null default 0.0,
  status public.bus_status not null default 'active'::bus_status,
  capacity integer null default 40,
  last_ping timestamp with time zone null default timezone('utc'::text, now()),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint buses_pkey primary key (id),
  constraint buses_bus_number_key unique (bus_number),
  constraint buses_plate_number_key unique (plate_number),
  constraint buses_driver_id_fkey foreign key (driver_id) references profiles (id) on delete set null,
  constraint buses_route_id_fkey foreign key (route_id) references routes (id) on delete set null
);

-- trips
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  bus_id uuid not null references public.buses(id) on delete cascade,
  driver_id uuid references public.profiles(id) on delete set null,
  departure_time timestamptz not null,
  arrival_time timestamptz,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'boarding', 'departed', 'completed', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now())
);

-- seats
create table public.seats (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  seat_number int not null,
  status text not null default 'available'
    check (status in ('available', 'booked')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (trip_id, seat_number)
);

create function public.generate_trip_seats()
returns trigger as $$
declare
  bus_capacity int;
  i int;
begin
  select capacity into bus_capacity from public.buses where id = new.bus_id;
  if bus_capacity is null then
    bus_capacity := 40;
  end if;
  for i in 1..bus_capacity loop
    insert into public.seats (trip_id, seat_number) values (new.id, i);
  end loop;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_trip_created
  after insert on public.trips
  for each row execute function public.generate_trip_seats();

-- bookings
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  seat_id uuid not null references public.seats(id) on delete cascade,
  passenger_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'cancelled')),
  booked_at timestamptz not null default timezone('utc', now())
);

create unique index bookings_seat_unique_when_confirmed
  on public.bookings (seat_id)
  where status = 'confirmed';

create function public.sync_seat_status()
returns trigger as $$
begin
  if tg_op = 'insert' and new.status = 'confirmed' then
    update public.seats set status = 'booked' where id = new.seat_id;
  elsif tg_op = 'update' then
    if new.status = 'cancelled' and old.status = 'confirmed' then
      update public.seats set status = 'available' where id = new.seat_id;
    elsif new.status = 'confirmed' and old.status = 'cancelled' then
      update public.seats set status = 'booked' where id = new.seat_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_booking_change
  after insert or update on public.bookings
  for each row execute function public.sync_seat_status();

-- admin helper
create function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- RLS
alter table public.profiles enable row level security;
create policy "profiles_select_own_or_admin" on public.profiles for select
  using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles for update
  using (auth.uid() = id or public.is_admin());

alter table public.routes enable row level security;
create policy "routes_select_all" on public.routes for select using (true);
create policy "routes_admin_write" on public.routes for all
  using (public.is_admin()) with check (public.is_admin());

alter table public.buses enable row level security;
create policy "buses_select_all" on public.buses for select using (true);
create policy "buses_admin_write" on public.buses for all
  using (public.is_admin()) with check (public.is_admin());
create policy "buses_driver_update_own" on public.buses for update
  using (driver_id = auth.uid()) with check (driver_id = auth.uid());

alter table public.trips enable row level security;
create policy "trips_select_all" on public.trips for select using (true);
create policy "trips_admin_write" on public.trips for all
  using (public.is_admin()) with check (public.is_admin());
create policy "trips_driver_update_own" on public.trips for update
  using (driver_id = auth.uid()) with check (driver_id = auth.uid());

alter table public.seats enable row level security;
create policy "seats_select_all" on public.seats for select using (true);
create policy "seats_admin_write" on public.seats for all
  using (public.is_admin()) with check (public.is_admin());

alter table public.bookings enable row level security;
create policy "bookings_select_own_or_admin" on public.bookings for select
  using (auth.uid() = passenger_id or public.is_admin());
create policy "bookings_insert_own" on public.bookings for insert
  with check (auth.uid() = passenger_id);
create policy "bookings_update_own_or_admin" on public.bookings for update
  using (auth.uid() = passenger_id or public.is_admin())
  with check (auth.uid() = passenger_id or public.is_admin());