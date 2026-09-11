import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";

function Buses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const filters = ["All", "On Time", "Delayed", "Arriving Soon"];

  useEffect(() => {
    async function fetchBuses() {
      try {
        setLoading(true);
        setError(null);

        // Fetching buses along with route details
        const { data, error: fetchError } = await supabase
          .from("buses")
          .select("*, routes(*)");

        if (fetchError) throw fetchError;

        if (data) {
          const formattedData = data.map((bus) => ({
            id: bus.bus_number || `BUS-${bus.id}`,
            route: bus.routes
              ? `Route ${bus.routes.route_number}: ${bus.routes.origin} ➔ ${bus.routes.destination}`
              : "Unassigned Route",
            nextStop: bus.current_stop || "In Transit",
            eta: bus.eta || "N/A",
            status: bus.status || "On Time",
            seatsAvailable: bus.available_seats ?? 0,
            driver: bus.driver_name || "Assigned Driver",
          }));
          setBuses(formattedData);
        }
      } catch (err) {
        console.error("Error fetching buses:", err);
        setError("Failed to load live bus data.");
      } finally {
        setLoading(false);
      }
    }

    fetchBuses();
  }, []);

  const filteredBuses = buses.filter((bus) => {
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
        {loading ? (
          <Card className="p-8 text-center">
            <p className="font-medium text-white/70">Loading live bus data...</p>
          </Card>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="font-medium text-red-400">{error}</p>
          </Card>
        ) : filteredBuses.length > 0 ? (
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
	      <Button
  size="small"
  className="mt-2"
  onClick={() => navigate(`/seats/${bus.id}`, { state: { routeName: bus.route } })}
>
  Select Seats
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