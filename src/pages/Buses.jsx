import { useState } from "react";
import Input from "../components/Input";
import Card from "../components/Card";
import Button from "../components/Button";

function Buses() {
  const [search, setSearch] = useState("");
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);

  const buses = [
    {
      id: 1,
      name: "Kigali Bus",
      route: "Nyabugogo → Kimironko",
      arrival: "10 min",
      seats: 12,
      price: 500,
      busNumber: "KBC 102A",
    },
    {
      id: 2,
      name: "City Express",
      route: "Kimisange → Downtown",
      arrival: "15 min",
      seats: 8,
      price: 700,
      busNumber: "RAC 245B",
    },
    {
      id: 3,
      name: "Rwanda Transit",
      route: "Remera → Nyabugogo",
      arrival: "20 min",
      seats: 18,
      price: 600,
      busNumber: "RTA 318C",
    },
  ];

  const filteredBuses = buses.filter(
    (bus) =>
      bus.name.toLowerCase().includes(search.toLowerCase()) ||
      bus.route.toLowerCase().includes(search.toLowerCase())
  );

  /*
   * Mock occupied seats for the prototype.
   * These will eventually come from the backend.
   */
  const occupiedSeats = [3, 7, 12, 15];

  const allSeats = Array.from({ length: 20 }, (_, index) => index + 1);

  const openBus = (bus) => {
    setSelectedBus(bus);
    setSelectedSeats([]);
  };

  const closeBus = () => {
    setSelectedBus(null);
    setSelectedSeats([]);
  };

  const toggleSeat = (seatNumber) => {
    if (occupiedSeats.includes(seatNumber)) {
      return;
    }

    setSelectedSeats((currentSeats) =>
      currentSeats.includes(seatNumber)
        ? currentSeats.filter((seat) => seat !== seatNumber)
        : [...currentSeats, seatNumber]
    );
  };

  const totalPrice = selectedBus
    ? selectedSeats.length * selectedBus.price
    : 0;

  const handleBooking = () => {
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }

    alert(
      `Booking ${selectedBus.name}\nSeats: ${selectedSeats.join(
        ", "
      )}\nTotal: ${totalPrice.toLocaleString()} RWF`
    );

    closeBus();
  };

  return (
    <div className="min-h-screen bg-[#071426] px-5 pb-28 pt-6 text-white">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#20d9c2]">
          Siga Transit
        </p>

        <h1 className="mt-1 text-2xl font-bold">Find a Bus</h1>

        <p className="mt-1 text-sm text-white/55">
          Choose a bus for your journey
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search bus or route..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-white/10 bg-[#10243c] text-white placeholder:text-white/40 focus:border-[#20d9c2] focus:ring-[#20d9c2]/20"
        />
      </div>

      {/* Bus list */}
      <div className="space-y-4">
        {filteredBuses.length > 0 ? (
          filteredBuses.map((bus) => (
            <Card
              key={bus.id}
              className="border border-white/5 bg-[#10243c] p-4 shadow-none"
            >
              {/* Bus heading */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#20d9c2]/10 text-xl">
                    🚌
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-white">
                      {bus.name}
                    </h2>

                    <p className="mt-1 truncate text-xs text-white/50">
                      {bus.route}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-lg bg-[#20d9c2]/10 px-2.5 py-1 text-xs font-semibold text-[#20d9c2]">
                  {bus.arrival}
                </span>
              </div>

              {/* Bus information */}
              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-white/35">
                    Seats
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white">
                    {bus.seats}
                  </p>
                </div>

                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-white/35">
                    Bus
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white">
                    {bus.busNumber}
                  </p>
                </div>

                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-white/35">
                    From
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#20d9c2]">
                    {bus.price.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Action */}
              <Button
                size="medium"
                onClick={() => openBus(bus)}
                className="mt-4 bg-[#20d9c2] text-[#071426] hover:bg-[#18c5b0]"
              >
                View Seats
              </Button>
            </Card>
          ))
        ) : (
          <Card className="border border-white/5 bg-[#10243c] p-8 text-center shadow-none">
            <div className="text-3xl">🚌</div>

            <p className="mt-3 font-medium text-white">
              No buses found
            </p>

            <p className="mt-1 text-sm text-white/40">
              Try searching for another bus or route.
            </p>
          </Card>
        )}
      </div>

      {/* Bus / seat modal */}
      {selectedBus && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[30px] bg-[#10243c] px-5 pb-7 pt-5">
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#20d9c2]">
                  Select your seat
                </p>

                <h2 className="mt-1 text-xl font-bold text-white">
                  {selectedBus.name}
                </h2>

                <p className="mt-1 text-xs text-white/45">
                  {selectedBus.route}
                </p>
              </div>

              <button
                type="button"
                onClick={closeBus}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/15"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Seat legend */}
            <div className="mt-6 flex items-center justify-center gap-5 text-[11px] text-white/50">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-[#243b55]" />
                Available
              </div>

              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-white/20" />
                Occupied
              </div>

              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-[#20d9c2]" />
                Selected
              </div>
            </div>

            {/* Bus interior */}
            <div className="mx-auto mt-6 max-w-[290px] rounded-[30px] border border-white/10 bg-[#071426] p-5">
              {/* Driver */}
              <div className="mb-5 flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                <span className="text-xs font-medium text-white/45">
                  FRONT
                </span>

                <span className="text-lg">🚌</span>

                <span className="text-xs text-white/45">
                  DRIVER
                </span>
              </div>

              {/* Seats */}
              <div className="grid grid-cols-4 gap-3">
                {allSeats.map((seatNumber) => {
                  const isOccupied = occupiedSeats.includes(seatNumber);
                  const isSelected = selectedSeats.includes(seatNumber);

                  return (
                    <button
                      key={seatNumber}
                      type="button"
                      disabled={isOccupied}
                      onClick={() => toggleSeat(seatNumber)}
                      className={`flex h-11 items-center justify-center rounded-xl text-xs font-bold transition ${
                        isOccupied
                          ? "cursor-not-allowed bg-white/10 text-white/20"
                          : isSelected
                          ? "bg-[#20d9c2] text-[#071426] shadow-[0_0_14px_rgba(32,217,194,0.25)]"
                          : "bg-[#243b55] text-white/80 hover:bg-[#31506e]"
                      }`}
                    >
                      {seatNumber}
                    </button>
                  );
                })}
              </div>

              {/* Back */}
              <div className="mt-5 rounded-xl bg-white/5 py-2 text-center text-[10px] uppercase tracking-[0.2em] text-white/30">
                Back of bus
              </div>
            </div>

            {/* Booking summary */}
            <div className="mt-6 rounded-2xl bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/40">
                    Selected seats
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white">
                    {selectedSeats.length > 0
                      ? selectedSeats.join(", ")
                      : "None"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-white/40">
                    Total
                  </p>

                  <p className="mt-1 text-lg font-bold text-[#20d9c2]">
                    {totalPrice.toLocaleString()} RWF
                  </p>
                </div>
              </div>
            </div>

            {/* Book button */}
            <Button
              onClick={handleBooking}
              disabled={selectedSeats.length === 0}
              className="mt-5 bg-[#20d9c2] text-[#071426] hover:bg-[#18c5b0]"
            >
              {selectedSeats.length > 0
                ? `Book ${selectedSeats.length} ${
                    selectedSeats.length === 1 ? "Seat" : "Seats"
                  }`
                : "Select a Seat"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Buses;