import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";

// Coaster-style minibus layout: 2 seats | aisle | 3 seats per row,
// with a 5-seat bench across the very back row (no aisle there).
const SEAT_ROWS = [
  { left: 2, right: 3 },
  { left: 2, right: 3 },
  { left: 2, right: 3 },
  { left: 2, right: 3 },
  { left: 2, right: 3 },
  { left: 2, right: 3 },
  { bench: 5 },
];

const MAX_SEATS = 4;

// Placeholder occupied seats until real trip data is wired in.
const OCCUPIED_SEAT_IDS = ["1B", "2C", "3A", "3E", "4B", "5D", "6A", "7C"];

function buildSeats() {
  const letters = ["A", "B", "C", "D", "E"];
  const seats = [];

  SEAT_ROWS.forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 1;
    const count = row.bench ?? row.left + row.right;

    for (let i = 0; i < count; i++) {
      const id = `${rowNumber}${letters[i]}`;
      seats.push({
        id,
        row: rowNumber,
        side: row.bench ? "bench" : i < row.left ? "left" : "right",
        status: OCCUPIED_SEAT_IDS.includes(id) ? 1 : 0, // 1 = Occupied, 0 = Available
      });
    }
  });

  return seats;
}

const initialSeats = buildSeats();

function SeatSelection() {
  const { busId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const routeName = location.state?.routeName || "Route details unavailable";

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [limitMessage, setLimitMessage] = useState("");

  const handleSeatClick = (seat) => {
    if (seat.status === 1) return; // Ignore occupied seats

    setSelectedSeats((prev) => {
      if (prev.includes(seat.id)) {
        setLimitMessage("");
        return prev.filter((id) => id !== seat.id);
      }

      if (prev.length >= MAX_SEATS) {
        setLimitMessage(`You can only select up to ${MAX_SEATS} seats.`);
        return prev;
      }

      setLimitMessage("");
      return [...prev, seat.id];
    });
  };

  const renderSeat = (seat) => {
    const isOccupied = seat.status === 1;
    const isSelected = selectedSeats.includes(seat.id);

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
        {seat.id}
      </button>
    );
  };

  return (
        <div className="min-h-screen bg-[#071426] px-5 py-6 text-white pb-44">
      {/* Top Header */}
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
          <p className="mt-0.5 text-xs text-white/55">{routeName} ({busId})</p>
        </div>
      </div>

      {/* Seat Legend */}
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

      {/* Selection limit note / warning */}
      <p className="mb-4 text-center text-[11px] text-white/40">
        {limitMessage || `Choose up to ${MAX_SEATS} seats.`}
      </p>

      {/* Bus Seat Layout Container */}
      <Card className="p-6 max-w-xs mx-auto border-white/10">
        <div className="text-center text-xs text-white/40 mb-2 uppercase tracking-wider font-semibold">
          Front / Driver Side
        </div>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />

        <div className="space-y-2.5">
          {SEAT_ROWS.map((rowConfig, rowIndex) => {
            const rowNumber = rowIndex + 1;
            const rowSeats = initialSeats.filter((s) => s.row === rowNumber);

            if (rowConfig.bench) {
              return (
                <div key={rowNumber} className="flex items-center justify-center gap-2">
                  {rowSeats.map(renderSeat)}
                </div>
              );
            }

            const leftSeats = rowSeats.filter((s) => s.side === "left");
            const rightSeats = rowSeats.filter((s) => s.side === "right");

            return (
              <div key={rowNumber} className="flex items-center justify-center gap-2">
                <div className="flex gap-2">{leftSeats.map(renderSeat)}</div>
                <div className="w-5" aria-hidden="true" />
                <div className="flex gap-2">{rightSeats.map(renderSeat)}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-center text-[10px] text-white/30 uppercase tracking-wider">
          Rear Bench
        </div>
      </Card>

      {/* Floating Bottom Confirm Bar */}
            <div className="fixed bottom-[70px] left-0 right-0 z-30 bg-[#10243c] border-t border-white/10 p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.3)]">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-white/50">
              Selected Seats ({selectedSeats.length}/{MAX_SEATS})
            </p>
            <p className="text-lg font-bold text-[#20d9c2]">
              {selectedSeats.length > 0 ? selectedSeats.join(", ") : "None"}
            </p>
          </div>

          <Button
            disabled={selectedSeats.length === 0}
            onClick={() =>
              selectedSeats.length > 0 &&
              navigate("/confirm", { state: { busId, seatIds: selectedSeats } })
            }
            className="w-auto px-6"
          >
            Confirm {selectedSeats.length > 1 ? `${selectedSeats.length} Seats` : "Seat"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SeatSelection;