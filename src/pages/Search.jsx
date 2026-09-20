import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PlanTripSearch from "../components/PlanTripSearch";
import { supabase } from "../supabaseClient";
import Card from "../components/Card";
import Button from "../components/Button";

export default function Search() {
  const navigate = useNavigate();
  const [results, setResults] = useState(null); // null = no search run yet
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async ({ routeType, origin, destination }) => {
    setLoading(true);
    setError("");
    setResults(null);

    let q = supabase
      .from("routes")
      .select("id, route_number, route_name, origin, destination, fare_rwf")
      .eq("is_kigali", routeType === "kigali")
      .eq("is_active", true);

    if (origin) q = q.ilike("origin", `%${origin.trim()}%`);
    if (destination) q = q.ilike("destination", `%${destination.trim()}%`);

    const { data, error } = await q;

    if (error) {
      setError(error.message);
    } else {
      setResults(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#071426] px-5 py-6 text-white pb-24">
      <h1 className="mb-1 text-2xl font-bold">Search Buses</h1>
      <p className="mb-6 text-xs text-white/55">
        Choose within Kigali or inter-district, then search by route.
      </p>

      <PlanTripSearch onSearch={handleSearch} />

      <div className="mt-6 max-w-sm mx-auto space-y-3">
        {loading && (
          <Card className="p-6 text-center text-sm text-white/60">Searching…</Card>
        )}

        {error && <Card className="p-6 text-center text-sm text-red-400">{error}</Card>}

        {!loading && results && results.length === 0 && (
          <Card className="p-6 text-center text-sm text-white/60">
            No routes found for this search yet.
          </Card>
        )}

        {!loading &&
          results &&
          results.map((route) => (
            <Card key={route.id} className="p-4">
              <p className="text-sm font-semibold text-white">{route.route_name}</p>
              <p className="mt-1 text-xs text-white/50">
                {route.origin} → {route.destination}
              </p>
              {route.fare_rwf != null && (
                <p className="mt-2 text-xs font-medium text-[#20d9c2]">
                  {route.fare_rwf.toLocaleString()} RWF
                </p>
              )}

              <Button
                size="small"
                className="mt-3 w-full"
                onClick={() =>
                  navigate("/buses", { state: { initialSearch: route.route_number } })
                }
              >
                View Buses
              </Button>
            </Card>
          ))}
      </div>
    </div>
  );
}