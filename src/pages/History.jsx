import { useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";

function History() {
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
    <div className="min-h-screen bg-[#071426] px-5 py-6 text-white">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#20d9c2]">
          Siga Transit
        </p>
        <h1 className="mt-1 text-2xl font-bold">History</h1>
        <p className="mt-1 text-sm text-white/55">
          View your previous journeys
        </p>
      </div>

      <div className="space-y-4">
        {trips.length > 0 ? (
          trips.map((trip) => (
            <Card key={trip.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {trip.destination}
                  </h2>

                  <p className="mt-1 text-sm text-white/50">
                    From {trip.from}
                  </p>
                </div>

                <span className="rounded-lg bg-[#20d9c2]/10 px-3 py-1 text-xs font-medium text-[#20d9c2]">
                  {trip.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
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
                className="mt-4"
              >
                View Trip
              </Button>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <p className="font-medium text-white">No trips yet</p>

            <p className="mt-1 text-sm text-white/40">
              Your completed journeys will appear here.
            </p>
          </Card>
        )}
      </div>

      {selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70">
          <div className="w-full max-w-md rounded-t-[30px] bg-[#10243c] p-6 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                Trip Details
              </h2>

              <button
                type="button"
                onClick={() => setSelectedTrip(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/15"
              >
                ✕
              </button>
            </div>

            <div className="mt-5">
              <p className="text-xs text-white/40">Destination</p>
              <p className="mt-1 text-base font-medium text-white">
                {selectedTrip.destination}
              </p>
            </div>

            <div className="mt-4">
              <p className="text-xs text-white/40">Starting point</p>
              <p className="mt-1 text-base font-medium text-white">
                {selectedTrip.from}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/40">Distance</p>
                <p className="mt-1 text-base font-medium text-white">
                  {selectedTrip.distance}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">Duration</p>
                <p className="mt-1 text-base font-medium text-white">
                  {selectedTrip.duration}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setSelectedTrip(null)}
              className="mt-6 bg-[#20d9c2] text-[#071426] hover:bg-[#18c5b0]"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default History;