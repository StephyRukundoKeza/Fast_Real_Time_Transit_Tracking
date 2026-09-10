// src/pages/History.jsx
import React, { useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";

export default function History() {
  const [selectedTrip, setSelectedTrip] = useState(null);

  const trips = [
    {
      id: 1,
      destination: "Kigali Convention Centre",
      from: "Kimironko",
      date: "Today",
      time: "08:30 AM",
      distance: "6.4 km",
      duration: "18 min",
      status: "Completed",
    },
    {
      id: 2,
      destination: "Nyabugogo Bus Station",
      from: "Remera",
      date: "Yesterday",
      time: "04:15 PM",
      distance: "7.2 km",
      duration: "22 min",
      status: "Completed",
    },
    {
      id: 3,
      destination: "Kimironko Market",
      from: "Downtown Kigali",
      date: "Aug 30",
      time: "11:20 AM",
      distance: "5.8 km",
      duration: "16 min",
      status: "Completed",
    },
  ];

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

      <div className="space-y-4">
        {trips.length > 0 ? (
          trips.map((trip) => (
            <Card key={trip.id} className="p-4 bg-[#10243c] rounded-2xl border border-white/5 shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {trip.destination}
                  </h2>
                  <p className="mt-1 text-sm text-white/50">
                    From {trip.from}
                  </p>
                </div>

                <span className="rounded-lg bg-[#20d9c2]/10 px-3 py-1 text-xs font-medium text-[#20d9c2] border border-[#20d9c2]/20">
                  {trip.status}
                </span>
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

              <Button
                variant="outline"
                size="small"
                onClick={() => setSelectedTrip(trip)}
                className="mt-4 w-full py-2 text-xs font-semibold rounded-xl border-white/10 text-white/80 hover:bg-white/5"
              >
                View Details
              </Button>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center bg-[#10243c] rounded-2xl border border-white/5">
            <p className="font-medium text-white">No trips yet</p>
            <p className="mt-1 text-sm text-white/40">
              Your completed journeys will appear here.
            </p>
          </Card>
        )}
      </div>

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