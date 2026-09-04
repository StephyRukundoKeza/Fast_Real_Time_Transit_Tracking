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
    <div className="min-h-screen bg-gray-50 px-5 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">History</h1>
        <p className="mt-1 text-sm text-gray-500">
          View your previous journeys
        </p>
      </div>

      <div className="space-y-4">
        {trips.length > 0 ? (
          trips.map((trip) => (
            <Card key={trip.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {trip.destination}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    From {trip.from}
                  </p>
                </div>

                <span className="rounded-lg bg-green-50 px-3 py-1 text-xs font-medium text-green-600">
                  {trip.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400">Date</p>
                  <p className="mt-1 text-sm font-medium text-gray-700">
                    {trip.date}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">Time</p>
                  <p className="mt-1 text-sm font-medium text-gray-700">
                    {trip.time}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">Distance</p>
                  <p className="mt-1 text-sm font-medium text-gray-700">
                    {trip.distance}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">Duration</p>
                  <p className="mt-1 text-sm font-medium text-gray-700">
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
            <p className="font-medium text-gray-700">No trips yet</p>

            <p className="mt-1 text-sm text-gray-400">
              Your completed journeys will appear here.
            </p>
          </Card>
        )}
      </div>

      {selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Trip Details
              </h2>

              <button
                onClick={() => setSelectedTrip(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-5">
              <p className="text-xs text-gray-400">Destination</p>

              <p className="mt-1 text-base font-medium text-gray-800">
                {selectedTrip.destination}
              </p>
            </div>

            <div className="mt-4">
              <p className="text-xs text-gray-400">Starting point</p>

              <p className="mt-1 text-base font-medium text-gray-800">
                {selectedTrip.from}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400">Distance</p>

                <p className="mt-1 text-base font-medium text-gray-800">
                  {selectedTrip.distance}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Duration</p>

                <p className="mt-1 text-base font-medium text-gray-800">
                  {selectedTrip.duration}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setSelectedTrip(null)}
              className="mt-6"
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