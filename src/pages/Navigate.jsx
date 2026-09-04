import { useState } from "react";
import Input from "../components/Input";
import Button from "../components/Button";

function NavigatePage() {
  const [destination, setDestination] = useState("");
  const [locationActive, setLocationActive] = useState(false);

  const suggestions = [
    "Kigali City",
    "Kigali Convention Centre",
    "Kimironko Market",
    "Nyabugogo Bus Station",
  ];

  const filteredSuggestions = suggestions.filter((place) =>
    place.toLowerCase().includes(destination.toLowerCase())
  );

  const handleStartNavigation = () => {
    alert(`Navigation to ${destination} will start here.`);
  };

  return (
    <div className="min-h-screen bg-[#071426] text-white">
      {/* Main map area */}
      <div className="relative min-h-[calc(100vh-96px)] overflow-hidden">
        {/* Header */}
        <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-5 pt-6">
          <div className="flex items-center gap-3">
            {/* Reserved Siga logo area */}
            <div
              className="h-10 w-10 rounded-full bg-[#20d9c2]/15"
              aria-label="Siga logo area"
            />

            <div>
              <p className="text-xs font-medium text-white/55">
                Welcome back
              </p>

              <h1 className="text-base font-semibold text-white">
                Hello, Hirwa
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => alert("Notifications will appear here.")}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#10243c]/90 text-lg shadow-lg backdrop-blur"
            aria-label="Notifications"
          >
            🔔

            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#071426]" />
          </button>
        </div>

        {/* Map */}
        <div className="absolute inset-0 bg-[#dce7df]">
          {/* Subtle map blocks */}
          <div className="absolute left-[8%] top-[20%] h-24 w-32 rounded-lg bg-[#d3dfd7]" />
          <div className="absolute right-[8%] top-[28%] h-32 w-28 rounded-lg bg-[#d1ddd5]" />
          <div className="absolute left-[18%] top-[48%] h-28 w-24 rounded-lg bg-[#d1ddd5]" />
          <div className="absolute right-[18%] top-[58%] h-24 w-36 rounded-lg bg-[#d5e0d8]" />

          {/* Map roads */}
          <div className="absolute left-1/2 top-[-10%] h-[120%] w-8 -translate-x-1/2 rotate-[18deg] bg-white/90 shadow-sm" />

          <div className="absolute left-[-10%] top-[48%] h-8 w-[120%] -rotate-[8deg] bg-white/90 shadow-sm" />

          <div className="absolute left-[20%] top-[-10%] h-[120%] w-5 rotate-[42deg] bg-white/75" />

          <div className="absolute left-[65%] top-[-10%] h-[120%] w-4 rotate-[65deg] bg-white/70" />

          {/* Secondary roads */}
          <div className="absolute left-0 top-[32%] h-2 w-full rotate-[5deg] bg-white/60" />
          <div className="absolute left-0 top-[68%] h-2 w-full -rotate-[12deg] bg-white/60" />

          {/* Current location */}
          <div
            className={`absolute left-1/2 top-[44%] flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition ${
              locationActive
                ? "bg-[#19d9c2] shadow-[0_0_0_12px_rgba(25,217,194,0.16)]"
                : "bg-[#20cfc0] shadow-[0_0_0_9px_rgba(32,207,192,0.13)]"
            }`}
          >
            <div className="h-4 w-4 rounded-full border-[3px] border-white bg-white" />
          </div>
        </div>

        {/* Map controls */}
        <div className="absolute bottom-44 right-5 z-10 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setLocationActive(!locationActive)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg shadow-lg transition active:scale-95"
            aria-label="Current location"
          >
            📍
          </button>

          <button
            type="button"
            onClick={() => alert("Map controls will be connected later.")}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg shadow-lg transition active:scale-95"
            aria-label="Map settings"
          >
            ⊙
          </button>
        </div>

        {/* Destination panel */}
        <div className="absolute bottom-0 left-0 right-0 z-20 rounded-t-[28px] bg-[#173b65] px-5 pb-6 pt-6 shadow-[0_-10px_30px_rgba(0,0,0,0.16)]">
          <div className="mx-auto max-w-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs font-bold tracking-[0.18em] text-white">
                WHERE ARE YOU GOING?
              </h2>

              <span className="text-xs text-[#20d9c2]">
                Siga
              </span>
            </div>

            <div className="relative">
              <Input
                placeholder="Search Kigali destination..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="border-white/15 bg-white/10 text-white placeholder:text-white/45 focus:border-[#20d9c2] focus:ring-[#20d9c2]/20"
              />

              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
                ⌕
              </div>
            </div>

            {destination && filteredSuggestions.length > 0 && (
              <div className="mt-3 space-y-2">
                {filteredSuggestions.map((place) => (
                  <button
                    key={place}
                    type="button"
                    onClick={() => setDestination(place)}
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-left text-sm text-white transition hover:bg-white/15"
                  >
                    <span className="mr-2 text-[#20d9c2]">●</span>
                    {place}
                  </button>
                ))}
              </div>
            )}

            {destination && (
              <Button
                onClick={handleStartNavigation}
                className="mt-4 bg-[#20d9c2] text-[#071426] hover:bg-[#18c5b0]"
              >
                Start Navigation
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NavigatePage;