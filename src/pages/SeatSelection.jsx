// src/components/SeatSelection.jsx
import React, { useState } from 'react';

// Seats matching the exact layout shown in the Figma screenshot
const SEAT_LAYOUT = [
  // Rows 1-8: Standard 2+1 configuration
  ...Array.from({ length: 8 }, (_, i) => {
    const rowNum = i + 1;
    const baseId = i * 3;
    return {
      row: rowNum,
      A: { id: baseId + 1, label: baseId + 1, status: 'taken' },
      B: { id: baseId + 2, label: baseId + 2, status: 'taken' },
      C: { id: baseId + 3, label: baseId + 3, status: rowNum === 8 ? 'selected' : 'taken' },
    };
  }),
  // Row 9: 25, 26, 27
  {
    row: 9,
    A: { id: 25, label: 25, status: 'selected' },
    B: { id: 26, label: 26, status: 'selected' },
    C: { id: 27, label: 27, status: 'selected' },
  },
  // Row 10: 28 on the left
  {
    row: 10,
    A: { id: 28, label: 28, status: 'selected' },
    B: null,
    C: null,
  },
];

export default function SeatSelection() {
  const [selectedSeats, setSelectedSeats] = useState([24, 25, 26, 27, 28]);

  const toggleSeat = (seatId) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((id) => id !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-900 p-4 font-sans text-slate-800">
      {/* Phone Mockup Frame */}
      <div className="relative w-full max-w-[360px] overflow-hidden rounded-[40px] border-[8px] border-slate-950 bg-[#f4f7fc] shadow-2xl">
        
        {/* Dark Blue Header */}
        <div className="bg-[#0e1b42] px-5 pt-8 pb-5 text-white">
          <div className="flex items-center gap-3">
            <button className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              ‹
            </button>
            <div>
              <h1 className="text-sm font-bold tracking-tight">Select Your Seat</h1>
              <p className="text-[10px] text-slate-300">
                Nyabugogo → Muhanga (Gitarama) • 07:00
              </p>
            </div>
          </div>

          {/* Subheader info bar */}
          <div className="mt-4 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-2">
              <span className="rounded bg-white/10 px-2 py-0.5 font-bold text-white">
                RAL 567 C
              </span>
              <span className="text-slate-300">Alexis Rusingizandekwe</span>
            </div>
            <span className="font-bold text-amber-400">5 available</span>
          </div>
        </div>

        {/* Inner Content Card */}
        <div className="p-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            
            {/* Driver Badge */}
            <div className="mb-6 flex justify-center">
              <div className="flex items-center gap-1.5 rounded-full bg-[#0e1b42] px-5 py-1 text-[11px] font-bold text-white shadow-sm">
                <span className="text-[10px] text-teal-400">❖</span> DRIVER
              </div>
            </div>

            {/* Column Headers A B ... C */}
            <div className="mb-2 grid grid-cols-[20px_1fr_16px_1fr] items-center text-center text-[10px] font-semibold text-slate-400">
              <span />
              <div className="grid grid-cols-2 gap-2">
                <span>A</span>
                <span>B</span>
              </div>
              <span />
              <div className="flex justify-center">
                <span>C</span>
              </div>
            </div>

            {/* Seat Grid Rows 1 to 10 */}
            <div className="space-y-2 text-center text-[11px] font-medium">
              {SEAT_LAYOUT.map((row) => (
                <div key={row.row} className="grid grid-cols-[20px_1fr_16px_1fr] items-center">
                  
                  {/* Row Number */}
                  <span className="text-left text-[10px] font-medium text-slate-400">
                    {row.row}
                  </span>

                  {/* Left Column Pair (A & B) */}
                  <div className="grid grid-cols-2 gap-2">
                    {row.A ? (
                      <SeatButton
                        seat={row.A}
                        isSelected={selectedSeats.includes(row.A.id)}
                        onClick={() => toggleSeat(row.A.id)}
                      />
                    ) : <div />}
                    {row.B ? (
                      <SeatButton
                        seat={row.B}
                        isSelected={selectedSeats.includes(row.B.id)}
                        onClick={() => toggleSeat(row.B.id)}
                      />
                    ) : <div />}
                  </div>

                  {/* Aisle Divider */}
                  <div className="flex items-center justify-center">
                    <span className="h-4 border-r border-slate-200" />
                  </div>

                  {/* Right Column Single (C) */}
                  <div className="flex justify-center">
                    {row.C ? (
                      <SeatButton
                        seat={row.C}
                        isSelected={selectedSeats.includes(row.C.id)}
                        onClick={() => toggleSeat(row.C.id)}
                      />
                    ) : <div className="w-8" />}
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <hr className="my-4 border-slate-100" />

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded border border-amber-500 bg-amber-50" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-[#0e1b42]" />
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded border border-slate-200 bg-slate-100" />
                <span>Taken</span>
              </div>
            </div>
          </div>

          {/* Bottom Info Banner */}
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-[10px] leading-relaxed text-blue-800">
            <span className="mt-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-blue-400 text-[8px] font-bold text-blue-600">
              i
            </span>
            <p>
              Rwandan buses seat 26–30 passengers in a 2+1 row layout. Window seats (A & C) are on the sides. You can select up to 4 seats. Seat 1 is directly behind the driver.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

// Seat Button Sub-component
function SeatButton({ seat, isSelected, onClick }) {
  if (isSelected) {
    return (
      <button
        onClick={onClick}
        className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-amber-500 bg-amber-50 text-xs font-bold text-amber-600 shadow-sm transition-transform active:scale-95"
      >
        {seat.label}
      </button>
    );
  }

  return (
    <button
      disabled={seat.status === 'taken'}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50/80 text-slate-300 transition-colors"
    >
      {/* Grey Person Icon for Taken Seats */}
      <svg className="h-4 w-4 fill-slate-300" viewBox="0 0 24 24">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </button>
  );
}