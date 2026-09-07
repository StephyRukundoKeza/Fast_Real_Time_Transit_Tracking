import { useState } from "react";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";

function Buses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  const filters = ["All", "On Time", "Delayed", "Arriving Soon"];

  const busesData = [
    {
      id: "BUS-101",
      route: "Route 101: Kimironko ➔ Nyabugogo",
      nextStop: "Gishushu",
      eta: "4 min",
      status: "On Time",
      seatsAvailable: 12,
      driver: "Jean Paul",
    },
    {
      id: "BUS-204",
      route: "Route 204: Remera ➔ Downtown",
      nextStop: "KBC Station",
      eta: "12 min",
      status: "Delayed",
      seatsAvailable: 3,
      driver: "Eric M.",
    },
    {
      id: "BUS-305",
      route: "Route 305: Kanombe ➔ City Center",
      nextStop: "Airport Junction",
      eta: "2 min",
      status: "Arriving Soon",
      seatsAvailable: 8,
      driver: "Claire N.",
    },
    {
      id: "BUS-108",
      route: "Route 108: Nyamirambo ➔ Kacyiru",
      nextStop: "Mineduc",
      eta: "8 min",
      status: "On Time",
      seatsAvailable: 15,
      driver: "David K.",
    },
  ];

  const filteredBuses = busesData.filter((bus) => {
    const matchesSearch =
      bus.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bus.nextStop.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bus.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      selectedFilter === "All" || bus.status === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#071426] px-5 py-6 text-white">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#20d9c2]">
          Siga Transit
        </p>
        <h1 className="mt-1 text-2xl font-bold">Smart Search</h1>
        <p className="mt-1 text-sm text-white/55">
          Find active buses and live route updates
        </p>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <Input
          placeholder="Search by route, stop, or bus ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filter Chips */}
      <div className="mb-6 flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setSelectedFilter(filter)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition ${
              selectedFilter === filter
                ? "bg-[#20d9c2] text-[#071426]"
                : "bg-[#10243c] text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Bus Results List */}
      <div className="space-y-4">
        {filteredBuses.length > 0 ? (
          filteredBuses.map((bus) => (
            <Card key={bus.id}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-[#20d9c2]">
                    {bus.id}
                  </span>
                  <h2 className="mt-0.5 text-base font-semibold text-white">
                    {bus.route}
                  </h2>
                </div>

                <span
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                    bus.status === "On Time"
                      ? "bg-[#20d9c2]/10 text-[#20d9c2]"
                      : bus.status === "Delayed"
                      ? "bg-red-500/15 text-red-400"
                      : "bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {bus.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
                <div>
                  <p className="text-[11px] text-white/40">Next Stop</p>
                  <p className="mt-0.5 text-xs font-medium text-white/90">
                    {bus.nextStop}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-white/40">ETA</p>
                  <p className="mt-0.5 text-xs font-medium text-[#20d9c2]">
                    {bus.eta}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-white/40">Open Seats</p>
                  <p className="mt-0.5 text-xs font-medium text-white/90">
                    {bus.seatsAvailable} seats
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="small"
                className="mt-4"
                onClick={() => alert(`Tracking ${bus.id}`)}
              >
                Track Bus
              </Button>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <p className="font-medium text-white">No buses found</p>
            <p className="mt-1 text-sm text-white/40">
              Try adjusting your search or filter settings.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

export default Buses;