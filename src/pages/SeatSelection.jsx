import { useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";

function SeatSelection({ busId = "BUS-101", routeName = "Route 101: Kimironko ➔ Nyabugogo", onBack, onConfirm }) {
  // 1 = Occupied, 0 = Available
  const initialSeats = [
    { id: "1A", status: 1 }, { id: "1B", status: 0 }, { id: "1C", status: 0 }, { id: "1D", status: 1 },
    { id: "2A", status: 0 }, { id: "2B", status: 0 }, { id: "2C", status: 1 }, { id: "2D", status: 0 },
    { id: "3A", status: 1 }, { id: "3B", status: 1 }, { id: "3C", status: 0 }, { id: "3D", status: 0 },
    { id: "4A", status: 0 }, { id: "4B", status: 0 }, { id: "4C", status: 0 }, { id: "4D", status: 1 },
    { id: "5A", status: 0 }, { id: "5B", status: 1 }, { id: "5C", status: 0 }, { id: "5D", status: 0 },
  ];

  const [selectedSeat, setSelectedSeat] = useState(null);

  const handleSeatClick = (seat) => {
    if (seat.status === 1) return; // Ignore occupied seats
    setSelectedSeat(seat.id === selectedSeat ? null : seat.id);
  };

  return (
    <div className="min-h-screen bg-[#071426] px-5 py-6 text-white pb-28">
      {/* Top Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-medium text-[#20d9c2] hover:underline"
          >
            ← Back to Buses
          </button>
          <h1 className="mt-1 text-2xl font-bold">Select Your Seat</h1>
          <p className="mt-0.5 text-xs text-white/55">{routeName} ({busId})</p>
        </div>
      </div>

      {/* Seat Legend */}
      <Card className="mb-6 flex items-center justify-around py-3">
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

      {/* Bus Seat Layout Container */}
      <Card className="p-6 max-w-xs mx-auto border-white/10">
        <div className="text-center text-xs text-white/40 mb-6 uppercase tracking-wider font-semibold">
          Front / Driver Side
        </div>

        {/* 2 x 2 Seat Grid */}
        <div className="grid grid-cols-4 gap-3">
          {initialSeats.map((seat, index) => {
            const isOccupied = seat.status === 1;
            const isSelected = selectedSeat === seat.id;

            return (
              <div
                key={seat.id}
                className={`${(index + 1) % 2 === 0 && (index + 1) % 4 !== 0 ? "mr-4" : ""}`}
              >
                <button
                  type="button"
                  disabled={isOccupied}
                  onClick={() => handleSeatClick(seat)}
                  className={`w-full py-3 rounded-xl font-bold text-xs transition flex items-center justify-center ${
                    isOccupied
                      ? "bg-white/5 text-white/20 cursor-not-allowed border border-transparent"
                      : isSelected
                      ? "bg-[#20d9c2] text-[#071426] shadow-lg shadow-[#20d9c2]/20"
                      : "bg-[#071426] text-white border border-white/15 hover:border-[#20d9c2]"
                  }`}
                >
                  {seat.id}
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Floating Bottom Confirm Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#10243c] border-t border-white/10 p-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-white/50">Selected Seat</p>
            <p className="text-lg font-bold text-[#20d9c2]">
              {selectedSeat ? selectedSeat : "None"}
            </p>
          </div>

          <Button
            disabled={!selectedSeat}
            onClick={() => onConfirm && onConfirm(selectedSeat)}
            className="w-auto px-6"
          >
            Confirm Seat
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SeatSelection;