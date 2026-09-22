import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import Card from "../components/Card";
import Button from "../components/Button";

function formatTripTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function History({ user }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function loadBookings() {
      setLoading(true);
      setLoadError("");

      const { data, error } = await supabase
        .from("bookings")
        .select(
          `id, status, booked_at,
           seats ( seat_number ),
           trips ( departure_time, routes ( route_name, fare_rwf ) )`
        )
        .eq("passenger_id", user.id)
        .order("booked_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        setLoadError(error.message);
      } else {
        setBookings(data || []);
      }
      setLoading(false);
    }

    loadBookings();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Split into upcoming (trip hasn't departed yet) vs past (already departed),
  // so "Trip History" can literally mean past trips while upcoming ones stay visible too.
  const now = Date.now();
  const upcomingBookings = bookings.filter((b) => {
    const t = b.trips?.departure_time ? new Date(b.trips.departure_time).getTime() : null;
    return t !== null && t >= now;
  });
  const pastBookings = bookings.filter((b) => {
    const t = b.trips?.departure_time ? new Date(b.trips.departure_time).getTime() : null;
    return t === null || t < now;
  });

  function renderBookingCard(b) {
    return (
      <Card
        key={b.id}
        className="p-4 bg-[#10243c] rounded-2xl border border-white/5 shadow-xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {b.trips?.routes?.route_name || "Unknown route"}
            </h2>
            <p className="mt-1 text-sm text-white/50">
              Seat {b.seats?.seat_number ?? "—"}
            </p>
          </div>

          <span
            className={`rounded-lg px-3 py-1 text-xs font-medium border ${
              b.status === "confirmed"
                ? "bg-[#20d9c2]/10 text-[#20d9c2] border-[#20d9c2]/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}
          >
            {b.status}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
          <div>
            <p className="text-xs text-white/40">Departure</p>
            <p className="mt-1 text-sm font-medium text-white/80">
              {formatTripTime(b.trips?.departure_time)}
            </p>
          </div>

          <div>
            <p className="text-xs text-white/40">Fare</p>
            <p className="mt-1 text-sm font-medium text-white/80">
              {b.trips?.routes?.fare_rwf != null
                ? `${b.trips.routes.fare_rwf.toLocaleString()} RWF`
                : "—"}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="small"
          onClick={() => setSelectedBooking(b)}
          className="mt-4 w-full py-2 text-xs font-semibold rounded-xl border-white/10 text-white/80 hover:bg-white/5"
        >
          View Details
        </Button>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-[#071426] px-5 py-6 text-white pb-24">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#20d9c2]">
          Siga Transit
        </p>
        <h1 className="mt-1 text-2xl font-bold">Trip History</h1>
        <p className="mt-1 text-sm text-white/55">
          Your real bookings, pulled straight from the database.
        </p>
      </div>

      {loading ? (
        <Card className="p-8 text-center">Loading…</Card>
      ) : loadError ? (
        <Card className="p-8 text-center text-red-400">{loadError}</Card>
      ) : bookings.length === 0 ? (
        <Card className="p-8 text-center bg-[#10243c] rounded-2xl border border-white/5">
          <p className="font-medium text-white">No trips yet</p>
          <p className="mt-1 text-sm text-white/40">
            Your bookings will appear here once you book a seat.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {upcomingBookings.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">
                Upcoming
              </h3>
              <div className="space-y-4">
                {upcomingBookings.map((b) => renderBookingCard(b))}
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">
              Trip History
            </h3>
            {pastBookings.length > 0 ? (
              <div className="space-y-4">
                {pastBookings.map((b) => renderBookingCard(b))}
              </div>
            ) : (
              <Card className="p-8 text-center bg-[#10243c] rounded-2xl border border-white/5">
                <p className="font-medium text-white">No past trips yet</p>
                <p className="mt-1 text-sm text-white/40">
                  Completed trips will show up here after they depart.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-t-[30px] bg-[#10243c] p-6 text-white border-t border-white/10 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#20d9c2] tracking-wider">
                  Receipt
                </span>
                <h2 className="text-xl font-bold text-white">Booking Details</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/15 active:scale-95 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs text-white/40">Route</p>
                <p className="mt-1 text-base font-semibold text-white">
                  {selectedBooking.trips?.routes?.route_name || "Unknown route"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-xl bg-[#071426]/50 p-3 border border-white/5">
                <div>
                  <p className="text-xs text-white/40">Seat</p>
                  <p className="mt-1 text-sm font-semibold text-[#20d9c2]">
                    {selectedBooking.seats?.seat_number ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/40">Status</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {selectedBooking.status}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/40">Departure</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {formatTripTime(selectedBooking.trips?.departure_time)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/40">Fare</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {selectedBooking.trips?.routes?.fare_rwf != null
                      ? `${selectedBooking.trips.routes.fare_rwf.toLocaleString()} RWF`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setSelectedBooking(null)}
              className="mt-6 w-full py-3 bg-[#20d9c2] text-[#071426] font-bold rounded-xl hover:bg-[#18c5b0] transition-colors"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}