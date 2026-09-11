import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Card from "../components/Card";
import Button from "../components/Button";

const MAX_SEATS = 4;

function layoutSeats(seats) {
  const rows = [];
  let i = 0;
  while (i < seats.length) {
    const remaining = seats.length - i;
    if (remaining <= 5) {
      rows.push({ bench: seats.slice(i, i + remaining) });
      i += remaining;
    } else {
      rows.push({ left: seats.slice(i, i + 2), right: seats.slice(i + 2, i + 5) });
      i += 5;
    }
  }
  return rows;
}

function formatTripTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function SeatSelection({ user }) {
  const { busId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const routeName = location.state?.routeName || "Route details unavailable";

  const [trip, setTrip] = useState(null);
  const [tripOptions, setTripOptions] = useState([]);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [limitMessage, setLimitMessage] = useState("");
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [myBookedCount, setMyBookedCount] = useState(0);

  const refetchSeats = useCallback(async (tripId) => {
    const { data, error } = await supabase
      .from("seats")
      .select("id, seat_number, status")
      .eq("trip_id", tripId)
      .order("seat_number", { ascending: true });
    if (!error) setSeats(data || []);
  }, []);

  const selectTrip = useCallback(
    async (tripRow) => {
      setTrip(tripRow);
      setTripOptions([]);
      setSelectedSeatIds([]);
      setLimitMessage("");
      setBookingMessage("");

      await refetchSeats(tripRow.id);

      if (user) {
        const { count } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("trip_id", tripRow.id)
          .eq("passenger_id", user.id)
          .eq("status", "confirmed");
        setMyBookedCount(count || 0);
      }

      setLoading(false);
    },
    [refetchSeats, user]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError("");
      setTrip(null);
      setTripOptions([]);

      const { data: busRow, error: busError } = await supabase
        .from("buses")
        .select("id")
        .eq("bus_number", busId)
        .maybeSingle();

      if (cancelled) return;

      if (busError || !busRow) {
        setLoadError("Could not find this bus.");
        setLoading(false);
        return;
      }

      // Only ever consider trips that haven't already departed
      const { data: upcomingTrips, error: tripsError } = await supabase
        .from("trips")
        .select("id, departure_time")
        .eq("bus_id", busRow.id)
        .gt("departure_time", new Date().toISOString())
        .order("departure_time", { ascending: true });

      if (cancelled) return;

      if (tripsError) {
        setLoadError("Failed to load trip info.");
        setLoading(false);
        return;
      }

      if (!upcomingTrips || upcomingTrips.length === 0) {
        setLoadError("No upcoming trip found for this bus yet.");
        setLoading(false);
        return;
      }

      if (upcomingTrips.length === 1) {
        await selectTrip(upcomingTrips[0]);
      } else {
        setTripOptions(upcomingTrips);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busId]);

  useEffect(() => {
    if (!trip?.id) return;

    const channel = supabase
      .channel(`seats-trip-${trip.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "seats", filter: `trip_id=eq.${trip.id}` },
        (payload) => {
          setSeats((prev) =>
            prev.map((s) => (s.id === payload.new.id ? { ...s, status: payload.new.status } : s))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trip?.id]);

  const remainingAllowance = Math.max(0, MAX_SEATS - myBookedCount);

  const handleSeatClick = (seat) => {
    if (seat.status === "booked") return;

    setSelectedSeatIds((prev) => {
      if (prev.includes(seat.id)) {
        setLimitMessage("");
        return prev.filter((id) => id !== seat.id);
      }
      if (prev.length >= remainingAllowance) {
        setLimitMessage(
          remainingAllowance <= 0
            ? `You've already booked the maximum of ${MAX_SEATS} seats on this trip.`
            : `You can only select ${remainingAllowance} more seat${remainingAllowance === 1 ? "" : "s"} (max ${MAX_SEATS} per trip).`
        );
        return prev;
      }
      setLimitMessage("");
      return [...prev, seat.id];
    });
  };

  const handleConfirmBooking = async () => {
    if (selectedSeatIds.length === 0 || !trip) return;

    if (!user) {
      setBookingMessage("Please log in to confirm a booking.");
      return;
    }

    setBookingInProgress(true);
    setBookingMessage("");

    const rows = selectedSeatIds.map((seatId) => ({
      trip_id: trip.id,
      seat_id: seatId,
      passenger_id: user.id,
    }));

    const { error } = await supabase.from("bookings").insert(rows);
    setBookingInProgress(false);

    if (error) {
      if (error.code === "23505") {
        setBookingMessage("One of those seats was just booked by someone else — please pick again.");
        setSelectedSeatIds([]);
        refetchSeats(trip.id);
      } else {
        setBookingMessage(`Booking failed: ${error.message}`);
      }
      return;
    }

    navigate("/confirm", { state: { busId, tripId: trip.id, seatIds: selectedSeatIds } });
  };

  const renderSeat = (seat) => {
    const isOccupied = seat.status === "booked";
    const isSelected = selectedSeatIds.includes(seat.id);

    return (
      <button
        key={seat.id}
        type="button"
        disabled={isOccupied}
        onClick={() => handleSeatClick(seat)}
        className={`h-10 w-10 rounded-lg font-bold text-[11px] transition flex items-center justify-center ${
          isOccupied
            ? "bg-white/5 text-white/20 cursor-not-allowed border border-transparent"
            : isSelected
            ? "bg-[#20d9c2] text-[#071426] shadow-lg shadow-[#20d9c2]/20"
            : "bg-[#071426] text-white border border-white/15 hover:border-[#20d9c2]"
        }`}
      >
        {seat.seat_number}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#071426] px-5 py-6 text-white pb-44">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-xs font-medium text-[#20d9c2] hover:underline"
          >
            ← Back to Buses
          </button>
          <h1 className="mt-1 text-2xl font-bold">Select Your Seat</h1>
          <p className="mt-0.5 text-xs text-white/55">
            {routeName} ({busId})
            {trip ? ` · Departs ${formatTripTime(trip.departure_time)}` : ""}
          </p>
        </div>
      </div>

      {loading ? (
        <Card className="p-8 text-center">Loading…</Card>
      ) : loadError ? (
        <Card className="p-8 text-center text-red-400">{loadError}</Card>
      ) : tripOptions.length > 0 ? (
        <Card className="p-4 max-w-sm mx-auto">
          <p className="mb-3 text-center text-sm font-semibold text-white">
            This bus has more than one upcoming trip — pick one:
          </p>
          <div className="space-y-2">
            {tripOptions.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTrip(t)}
                className="w-full rounded-xl border border-white/15 bg-[#071426] px-4 py-3 text-left text-sm text-white hover:border-[#20d9c2] transition"
              >
                Departs {formatTripTime(t.departure_time)}
              </button>
            ))}
          </div>
        </Card>
      ) : (
        <>
          <Card className="mb-3 flex items-center justify-around py-3">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 rounded bg-[#10243c] border border-white/20" />
              <span className="text-xs text-white/70">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 rounded bg-[#20d9c2]" />
              <span className="text-xs text-white/70">Selected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 rounded bg-white/10 opacity-40" />
              <span className="text-xs text-white/70">Occupied</span>
            </div>
          </Card>

          <p className="mb-4 text-center text-[11px] text-white/40">
            {limitMessage ||
              bookingMessage ||
              (remainingAllowance > 0
                ? `Choose up to ${remainingAllowance} more seat${remainingAllowance === 1 ? "" : "s"} (max ${MAX_SEATS} per trip).`
                : `You've already booked the maximum of ${MAX_SEATS} seats on this trip.`)}
          </p>

          <Card className="p-6 max-w-xs mx-auto border-white/10">
            <div className="text-center text-xs text-white/40 mb-2 uppercase tracking-wider font-semibold">
              Front / Driver Side
            </div>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />

            <div className="space-y-2.5">
              {layoutSeats(seats).map((row, idx) =>
                row.bench ? (
                  <div key={idx} className="flex items-center justify-center gap-2">
                    {row.bench.map(renderSeat)}
                  </div>
                ) : (
                  <div key={idx} className="flex items-center justify-center gap-2">
                    <div className="flex gap-2">{row.left.map(renderSeat)}</div>
                    <div className="w-5" aria-hidden="true" />
                    <div className="flex gap-2">{row.right.map(renderSeat)}</div>
                  </div>
                )
              )}
            </div>

            <div className="mt-4 text-center text-[10px] text-white/30 uppercase tracking-wider">
              Rear Bench
            </div>
          </Card>
        </>
      )}

      <div className="fixed bottom-[70px] left-0 right-0 z-30 bg-[#10243c] border-t border-white/10 p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.3)]">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-white/50">
              Selected Seats ({selectedSeatIds.length}/{MAX_SEATS})
            </p>
            <p className="text-lg font-bold text-[#20d9c2]">
              {selectedSeatIds.length > 0 ? selectedSeatIds.length : "None"}
            </p>
          </div>

          <Button
            disabled={selectedSeatIds.length === 0 || bookingInProgress || tripOptions.length > 0}
            onClick={handleConfirmBooking}
            className="w-auto px-6"
          >
            {bookingInProgress ? "Booking…" : `Confirm ${selectedSeatIds.length > 1 ? `${selectedSeatIds.length} Seats` : "Seat"}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SeatSelection;