import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Card from "../components/Card";
import Button from "../components/Button";

export default function History({ user }) {
  const navigate = useNavigate();
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [trips, setTrips] = useState([]);
  const [savedStops, setSavedStops] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Fetch booking history and saved destinations
  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Get user session if user prop is missing
      let currentUser = user;
      if (!currentUser) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        currentUser = authUser;
      }

      // 1. Query booking history
      let historyQuery = supabase.from("booking_history").select("*");
      if (currentUser?.id) {
        historyQuery = historyQuery.eq("passenger_id", currentUser.id);
      }
      const { data: historyData } = await historyQuery.order("booked_at", { ascending: false });

      if (historyData) {
        const formattedTrips = historyData.map((item) => {
          const bookedDate = item.booked_at ? new Date(item.booked_at) : new Date();

          // Clean destination stop name
          let destName = item.destination_stop || item.route_name || "Musanze";
          if (destName.includes("-")) {
            destName = destName.split("-").pop().trim();
          }

          let originName = item.origin_stop || "Nyabugogo";
          if (originName.includes("-")) {
            originName = originName.split("-")[0].trim();
          }

          return {
            id: item.booking_id || item.id,
            destination: destName,
            fullRoute: item.route_name || `${originName} - ${destName}`,
            from: originName,
            date: bookedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            time: bookedDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            distance: item.distance || "6.4 km",
            duration: item.duration || "18 min",
            status: item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : "Completed",
            seatNumber: item.seat_number || item.seat_code,
            price: item.price || item.fare,
            departureTime: item.departure_time || null,
            busId: item.bus_id || null,
          };
        });
        setTrips(formattedTrips);
      }

      // 2. Fetch user's saved destinations from database
      if (currentUser?.id) {
        const { data: savedData, error } = await supabase
          .from("saved_destinations")
          .select("location_id, locations ( name )")
          .eq("user_id", currentUser.id);

        if (!error && savedData) {
          setSavedStops(new Set(savedData.map((s) => s.locations?.name).filter(Boolean)));
        }
      }

      setLoading(false);
    }

    fetchData();
  }, [user]);

  // Toggle Save/Unsave destination in Supabase
  
  const toggleSaveDestination = async (e, stopName) => {
    e.preventDefault();
    e.stopPropagation();

    if (!stopName) return;

    let currentUser = user;
    if (!currentUser) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      currentUser = authUser;
    }

    if (!currentUser?.id) return;

    const isCurrentlySaved = savedStops.has(stopName);

    // 1. Optimistic UI update
    const updatedStops = new Set(savedStops);
    if (isCurrentlySaved) {
      updatedStops.delete(stopName);
    } else {
      updatedStops.add(stopName);
    }
    setSavedStops(updatedStops);

    // 2. saved_destinations references a real location row, not a
    // free-text name, so resolve the location_id for this stop first.
    const { data: locationRow, error: locationError } = await supabase
      .from("locations")
      .select("id")
      .ilike("name", stopName)
      .maybeSingle();

    if (locationError || !locationRow) {
      console.error("Could not find a location matching:", stopName, locationError);
      setSavedStops(new Set(savedStops)); // rollback
      return;
    }

    // 3. Database Sync
    if (isCurrentlySaved) {
      const { error } = await supabase
        .from("saved_destinations")
        .delete()
        .eq("user_id", currentUser.id)
        .eq("location_id", locationRow.id);

      if (error) {
        console.error("Error unsaving destination:", error);
        // Rollback on error
        setSavedStops(new Set(savedStops));
      }
    } else {
      const { error } = await supabase.from("saved_destinations").insert([
        {
          user_id: currentUser.id,
          location_id: locationRow.id,
          label: stopName,
        },
      ]);

      if (error) {
        console.error("Error saving destination:", error);
        // Rollback on error
        setSavedStops(new Set(savedStops));
      }
    }
  };

  const renderBookingCard = (trip, idx, showTrack) => {
    const isSaved = savedStops.has(trip.destination);
    return (
      <Card key={`${trip.id}-${idx}`} className="p-4 bg-[#10243c] rounded-2xl border border-white/5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">
              {trip.from} - {trip.destination}
            </h2>
            <p className="mt-1 text-sm text-white/50">
              Destination: {trip.destination}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="rounded-lg bg-[#20d9c2]/10 px-3 py-1 text-xs font-medium text-[#20d9c2] border border-[#20d9c2]/20">
              {trip.status}
            </span>

            {/* Interactive Save Destination Button */}
            <button
              type="button"
              onClick={(e) => toggleSaveDestination(e, trip.destination)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all active:scale-95 cursor-pointer ${
                isSaved
                  ? "bg-amber-400 text-[#071426] border-amber-400 shadow-md"
                  : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <span className="text-sm">{isSaved ? "★" : "☆"}</span>
              <span>{isSaved ? "Saved" : "Save Destination"}</span>
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
          <div>
            <p className="text-xs text-white/40">Date</p>
            <p className="mt-1 text-sm font-medium text-white/80">
              {trip.date}
            </p>
          </div>

          <div>
            <p className="text-xs text-white/40">Time</p>
            <p className="mt-1 text-sm font-medium text-white/80">
              {trip.time}
            </p>
          </div>

          <div>
            <p className="text-xs text-white/40">Distance</p>
            <p className="mt-1 text-sm font-medium text-white/80">
              {trip.distance}
            </p>
          </div>

          <div>
            <p className="text-xs text-white/40">Duration</p>
            <p className="mt-1 text-sm font-medium text-white/80">
              {trip.duration}
            </p>
          </div>
        </div>

        {showTrack && trip.busId && (
          <Button
            onClick={() => navigate("/navigate", { state: { busId: trip.busId } })}
            className="mt-4 w-full py-2 text-xs font-semibold rounded-xl"
          >
            Track My Bus
          </Button>
        )}

        <Button
          variant="outline"
          size="small"
          onClick={() => setSelectedTrip(trip)}
          className="mt-2 w-full py-2 text-xs font-semibold rounded-xl border-white/10 text-white/80 hover:bg-white/5"
        >
          View Details
        </Button>
      </Card>
    );
  };

  const now = Date.now();
  const upcomingTrips = trips.filter(
    (t) => t.departureTime && new Date(t.departureTime).getTime() > now
  );
  const pastTrips = trips.filter(
    (t) => !t.departureTime || new Date(t.departureTime).getTime() <= now
  );

  return (
    <div className="min-h-screen bg-[#071426] px-5 py-6 text-white pb-24">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#20d9c2]">
          Siga Transit
        </p>
        <h1 className="mt-1 text-2xl font-bold">Trip History</h1>
        <p className="mt-1 text-sm text-white/55">
          View your previous journeys and booking details
        </p>
      </div>

      {loading ? (
        <Card className="p-8 text-center bg-[#10243c] rounded-2xl border border-white/5">
          <p className="text-sm font-medium text-white/60">Loading trip history...</p>
        </Card>
      ) : trips.length === 0 ? (
        <Card className="p-8 text-center bg-[#10243c] rounded-2xl border border-white/5">
          <p className="font-medium text-white">No trips yet</p>
          <p className="mt-1 text-sm text-white/40">
            Your completed journeys will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">
              Upcoming
            </h2>
            {upcomingTrips.length > 0 ? (
              <div className="space-y-4">
                {upcomingTrips.map((trip, idx) => renderBookingCard(trip, idx, true))}
              </div>
            ) : (
              <p className="text-sm text-white/40">No upcoming trips.</p>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">
              Trip History
            </h2>
            {pastTrips.length > 0 ? (
              <div className="space-y-4">
                {pastTrips.map((trip, idx) => renderBookingCard(trip, idx, false))}
              </div>
            ) : (
              <p className="text-sm text-white/40">No past trips yet.</p>
            )}
          </div>
        </div>
      )}

      {/* TRIP DETAILS MODAL OVERLAY */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-t-[30px] bg-[#10243c] p-6 text-white border-t border-white/10 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#20d9c2] tracking-wider">Receipt</span>
                <h2 className="text-xl font-bold text-white">Trip Details</h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTrip(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/15 active:scale-95 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs text-white/40">Destination</p>
                <p className="mt-1 text-base font-semibold text-white">
                  {selectedTrip.destination}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">Starting point</p>
                <p className="mt-1 text-base font-semibold text-white">
                  {selectedTrip.from}
                </p>
              </div>

              {selectedTrip.seatNumber && (
                <div>
                  <p className="text-xs text-white/40">Seat</p>
                  <p className="mt-1 text-base font-semibold text-white">
                    {selectedTrip.seatNumber}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 rounded-xl bg-[#071426]/50 p-3 border border-white/5">
                <div>
                  <p className="text-xs text-white/40">Distance</p>
                  <p className="mt-1 text-sm font-semibold text-[#20d9c2]">
                    {selectedTrip.distance}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-white/40">Duration</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {selectedTrip.duration}
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setSelectedTrip(null)}
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