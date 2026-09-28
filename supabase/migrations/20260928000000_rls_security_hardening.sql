-- RLS security hardening from the "review RLS so a user can only ever see
-- their own bookings" security pass. Two gaps found and closed:
--
-- 1. profiles: profiles_update_own_or_admin had no explicit `with check`,
--    so it silently reused the `using` clause, which only checks row
--    ownership, not which columns/values are being written. Any user could
--    PATCH their own profile with {"role":"admin"} and self-escalate, which
--    then unlocks the `or is_admin()` escape hatch on every other table's
--    RLS (bookings included). Confirmed live: a non-admin user attempting
--    this now gets rejected with "You are not allowed to change your own
--    role."
--
-- 2. bookings: bookings_update_own_or_admin's `with check` only verifies
--    passenger_id ownership on the NEW row, so it doesn't stop a user from
--    re-pointing their own booking at a different trip_id/seat_id/
--    passenger_id via a raw update call. A user should only ever be able to
--    change `status` (to cancel) on a booking they own.
--
-- Run this SQL in the Supabase SQL Editor to apply (this repo does not
-- auto-run migrations against the live database).

drop trigger if exists prevent_role_escalation on public.profiles;
drop function if exists public.prevent_self_role_escalation();

create function public.prevent_self_role_escalation()
returns trigger as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'You are not allowed to change your own role.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_self_role_escalation();

drop trigger if exists prevent_booking_tampering on public.bookings;
drop function if exists public.prevent_booking_field_tampering();

create function public.prevent_booking_field_tampering()
returns trigger as $$
begin
  if (new.trip_id is distinct from old.trip_id
      or new.seat_id is distinct from old.seat_id
      or new.passenger_id is distinct from old.passenger_id)
     and not public.is_admin() then
    raise exception 'You are not allowed to change the trip, seat, or passenger on an existing booking.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger prevent_booking_tampering
  before update on public.bookings
  for each row execute function public.prevent_booking_field_tampering();
