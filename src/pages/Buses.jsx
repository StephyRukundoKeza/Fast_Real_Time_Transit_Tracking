// src/pages/Buses.jsx
import React, { useState } from 'react';

// Transport Operators
const OPERATORS = [
  {
    id: 'volcano',
    name: 'Volcano Express',
    code: 'VOL',
    color: 'from-amber-500 to-orange-600',
    activeBuses: 12,
    routesCount: 'Kigali ➔ Huye / Musanze',
    tag: 'Popular'
  },
  {
    id: 'virunga',
    name: 'Virunga Express',
    code: 'VIR',
    color: 'from-emerald-500 to-teal-700',
    activeBuses: 8,
    routesCount: 'Kigali ➔ Rubavu / Musanze',
    tag: 'Express'
  },
  {
    id: 'shalom',
    name: 'Shalom Express',
    code: 'SHA',
    color: 'from-blue-600 to-indigo-800',
    activeBuses: 6,
    routesCount: 'Kigali ➔ Muhanga / Karongi',
    tag: 'Regional'
  },
  {
    id: 'rftc',
    name: 'RFTC',
    code: 'RFTC',
    color: 'from-cyan-500 to-blue-600',
    activeBuses: 24,
    routesCount: 'Kigali City Routes',
    tag: 'City Transport'
  },
  {
    id: 'rtco',
    name: 'RTCO',
    code: 'RTCO',
    color: 'from-purple-600 to-slate-900',
    activeBuses: 15,
    routesCount: 'Inter-Province Express',
    tag: 'Long Distance'
  }
];

const SEAT_LAYOUT = [
  ...Array.from({ length: 8 }, (_, i) => {
    const rowNum = i + 1;
    const baseId = i * 3;
    return {
      row: rowNum,
      A: { id: baseId + 1, label: baseId + 1, status: 'taken' },
      B: { id: baseId + 2, label: baseId + 2, status: 'taken' },
      C: { id: baseId + 3, label: baseId + 3, status: rowNum === 8 ? 'available' : 'taken' },
    };
  }),
  {
    row: 9,
    A: { id: 25, label: 25, status: 'available' },
    B: { id: 26, label: 26, status: 'available' },
    C: { id: 27, label: 27, status: 'available' },
  },
  {
    row: 10,
    A: { id: 28, label: 28, status: 'available' },
    B: null,
    C: null,
  },
];

function SeatSelectionModal({ bus, onClose }) {
  const [step, setStep] = useState('select');
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedBank, setSelectedBank] = useState('Bank of Kigali');

  const toggleSeat = (seatId) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((id) => id !== seatId));
    } else {
      if (selectedSeats.length >= 4) {
        alert('You can only select up to 4 seats.');
        return;
      }
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-[360px] overflow-hidden rounded-[40px] border-[8px] border-slate-950 bg-[#f4f7fc] shadow-2xl">
        <div className="bg-[#0e1b42] px-5 pt-8 pb-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={step === 'payment' ? () => setStep('select') : onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-lg hover:bg-white/20 transition-colors"
              >
                ‹
              </button>
              <div>
                <h1 className="text-sm font-bold tracking-tight">
                  {step === 'select' ? 'Select Your Seat' : 'Payment Method'}
                </h1>
                <p className="text-[10px] text-slate-300">
                  {bus ? bus.routeName : 'Nyabugogo → Muhanga'} • {bus ? bus.eta : '07:00'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-xs">✕</button>
          </div>

          <div className="mt-4 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-2">
              <span className="rounded bg-white/10 px-2 py-0.5 font-bold text-white">
                {bus ? bus.id : 'RAL 567 C'}
              </span>
              <span className="text-slate-300">Alexis Rusingizandekwe</span>
            </div>
            <span className="font-bold text-amber-400">
              {selectedSeats.length}/4 Selected
            </span>
          </div>
        </div>

        {step === 'select' && (
          <div className="p-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="mb-6 flex justify-center">
                <div className="flex items-center gap-1.5 rounded-full bg-[#0e1b42] px-5 py-1 text-[11px] font-bold text-white shadow-sm">
                  <span className="text-[10px] text-teal-400">❖</span> DRIVER
                </div>
              </div>

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

              <div className="space-y-2 text-center text-[11px] font-medium">
                {SEAT_LAYOUT.map((row) => (
                  <div key={row.row} className="grid grid-cols-[20px_1fr_16px_1fr] items-center">
                    <span className="text-left text-[10px] font-medium text-slate-400">
                      {row.row}
                    </span>

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

                    <div className="flex items-center justify-center">
                      <span className="h-4 border-r border-slate-200" />
                    </div>

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

              <hr className="my-4 border-slate-100" />

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

            <button
              disabled={selectedSeats.length === 0}
              onClick={() => setStep('payment')}
              className="mt-4 w-full rounded-2xl bg-[#0e1b42] py-3 text-xs font-bold text-white shadow-lg transition-all hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Buy Ticket ({selectedSeats.length})
            </button>
          </div>
        )}

        {step === 'payment' && (
          <div className="p-4 space-y-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
              <h2 className="text-xs font-bold text-slate-800">Select Payment Option</h2>

              <button
                onClick={() => setPaymentMethod('momo')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMethod === 'momo'
                    ? 'border-yellow-500 bg-yellow-50 text-slate-900 shadow-sm'
                    : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 font-bold text-[10px] text-black">
                    💛
                  </span>
                  <span>MTN MoMo</span>
                </div>
                <span className="text-[10px] text-slate-400">Mobile</span>
              </button>

              <button
                onClick={() => setPaymentMethod('airtel')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMethod === 'airtel'
                    ? 'border-red-500 bg-red-50 text-slate-900 shadow-sm'
                    : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 font-bold text-[10px] text-white">
                    🔴
                  </span>
                  <span>Airtel Money</span>
                </div>
                <span className="text-[10px] text-slate-400">Mobile</span>
              </button>

              <button
                onClick={() => setPaymentMethod('apple')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMethod === 'apple'
                    ? 'border-black bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">🍎</span>
                  <span>Apple Pay</span>
                </div>
                <span className="text-[10px] text-slate-400">Digital Wallet</span>
              </button>

              <div
                className={`rounded-xl border transition-all ${
                  paymentMethod === 'bank'
                    ? 'border-blue-600 bg-blue-50/50 p-3 shadow-sm'
                    : 'border-slate-200 bg-slate-50/60 p-3 hover:bg-slate-100'
                }`}
              >
                <button
                  onClick={() => setPaymentMethod('bank')}
                  className="w-full flex items-center justify-between text-xs font-semibold text-slate-700"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">🏦</span>
                    <span>Bank Transfer</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Card / App</span>
                </button>

                {paymentMethod === 'bank' && (
                  <div className="mt-3 pt-2 border-t border-slate-200/60 space-y-1.5">
                    <label className="text-[10px] font-medium text-slate-500">Choose Bank:</label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                    >
                      <option value="Bank of Kigali">Bank of Kigali (BK)</option>
                      <option value="Equity Bank">Equity Bank</option>
                      <option value="Banque Populaire">Banque Populaire (BPR)</option>
                      <option value="I&M Bank">I&M Bank</option>
                      <option value="NCBA Bank">NCBA Bank</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <button
              disabled={!paymentMethod}
              onClick={() => {
                alert(`Payment confirmed via ${paymentMethod === 'bank' ? selectedBank : paymentMethod}!`);
                onClose();
              }}
              className="w-full rounded-2xl bg-[#0e1b42] py-3 text-xs font-bold text-white shadow-lg transition-all hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Pay Now
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

function SeatButton({ seat, isSelected, onClick }) {
  if (isSelected) {
    return (
      <button
        onClick={onClick}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0e1b42] text-xs font-bold text-white shadow-md transition-transform active:scale-95"
      >
        {seat.label}
      </button>
    );
  }

  if (seat.status === 'taken') {
    return (
      <button
        disabled
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed"
      >
        <svg className="h-4 w-4 fill-slate-300" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-amber-500 bg-amber-50 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-transform active:scale-95"
    >
      {seat.label}
    </button>
  );
}

const INITIAL_BUSES = [
  // Volcano Express
  {
    id: 'RAC 245B',
    operatorId: 'volcano',
    operatorName: 'Volcano Express',
    routeCode: 'Route V1',
    routeName: 'Kigali ➔ Musanze',
    status: 'active',
    statusTag: 'On Time',
    statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    nextStop: 'Nyabugogo Terminal',
    eta: '4 mins',
    totalSeats: 28,
    occupiedSeats: [2, 3, 5, 8, 9, 12, 14, 15, 18, 19, 21, 24, 25, 27]
  },
  {
    id: 'RAD 890C',
    operatorId: 'volcano',
    operatorName: 'Volcano Express',
    routeCode: 'Route V2',
    routeName: 'Kigali ➔ Huye',
    status: 'active',
    statusTag: 'On Time',
    statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    nextStop: 'Muhanga Stop',
    eta: '12 mins',
    totalSeats: 28,
    occupiedSeats: [1, 4, 7, 10, 11, 16]
  },
  {
    id: 'RAB 112E',
    operatorId: 'volcano',
    operatorName: 'Volcano Express',
    routeCode: 'Route V3',
    routeName: 'Huye ➔ Kigali',
    status: 'active',
    statusTag: 'Delayed',
    statusColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    nextStop: 'Nyanza Junction',
    eta: '18 mins',
    totalSeats: 28,
    occupiedSeats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
  },

  // Virunga Express
  {
    id: 'RTA 318C',
    operatorId: 'virunga',
    operatorName: 'Virunga Express',
    routeCode: 'Route VIR-1',
    routeName: 'Kigali ➔ Rubavu',
    status: 'active',
    statusTag: 'Delayed',
    statusColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    nextStop: 'Nyirangarama',
    eta: '14 mins',
    totalSeats: 28,
    occupiedSeats: [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 23, 24, 25, 26, 27]
  },
  {
    id: 'RAE 404K',
    operatorId: 'virunga',
    operatorName: 'Virunga Express',
    routeCode: 'Route VIR-2',
    routeName: 'Rubavu ➔ Musanze',
    status: 'active',
    statusTag: 'Arriving Soon',
    statusColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    nextStop: 'Musanze Center',
    eta: '2 mins',
    totalSeats: 28,
    occupiedSeats: [3, 6, 9, 12, 15]
  },

  // Shalom Express
  {
    id: 'RAD 512D',
    operatorId: 'shalom',
    operatorName: 'Shalom Express',
    routeCode: 'Route S1',
    routeName: 'Kigali ➔ Karongi',
    status: 'active',
    statusTag: 'On Time',
    statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    nextStop: 'Muhanga Park',
    eta: '7 mins',
    totalSeats: 28,
    occupiedSeats: [3, 5, 9, 11, 15, 18, 21, 24]
  },
  {
    id: 'RAF 771B',
    operatorId: 'shalom',
    operatorName: 'Shalom Express',
    routeCode: 'Route S2',
    routeName: 'Karongi ➔ Kigali',
    status: 'active',
    statusTag: 'On Time',
    statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    nextStop: 'Ruhango Stop',
    eta: '10 mins',
    totalSeats: 28,
    occupiedSeats: [1, 2, 4, 5, 8, 10, 12, 14]
  },

  // RFTC
  {
    id: 'KBC 102A',
    operatorId: 'rftc',
    operatorName: 'RFTC',
    routeCode: 'Route R1',
    routeName: 'Nyabugogo ➔ Kimironko',
    status: 'active',
    statusTag: 'Arriving Soon',
    statusColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    nextStop: 'Gishushu Stop',
    eta: '1 min',
    totalSeats: 28,
    occupiedSeats: [1, 4, 6, 7, 10, 11, 13, 16, 17, 20, 22, 23, 26, 28]
  },
  {
    id: 'RCA 901M',
    operatorId: 'rftc',
    operatorName: 'RFTC',
    routeCode: 'Route R2',
    routeName: 'Downtown ➔ Nyamirambo',
    status: 'active',
    statusTag: 'On Time',
    statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    nextStop: 'Biryogo',
    eta: '3 mins',
    totalSeats: 28,
    occupiedSeats: [2, 5, 8, 12, 18, 20]
  },
  {
    id: 'RCB 334X',
    operatorId: 'rftc',
    operatorName: 'RFTC',
    routeCode: 'Route R5',
    routeName: 'Remera ➔ Kanombe',
    status: 'active',
    statusTag: 'On Time',
    statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    nextStop: 'Kipharma',
    eta: '5 mins',
    totalSeats: 28,
    occupiedSeats: [1, 3, 7, 9, 11, 13, 15, 17]
  },

  // RTCO
  {
    id: 'RDA 650A',
    operatorId: 'rtco',
    operatorName: 'RTCO',
    routeCode: 'Route RTC-1',
    routeName: 'Kigali ➔ Rusizi',
    status: 'active',
    statusTag: 'On Time',
    statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    nextStop: 'Nyamagabe',
    eta: '25 mins',
    totalSeats: 28,
    occupiedSeats: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
  },
  {
    id: 'RDB 221P',
    operatorId: 'rtco',
    operatorName: 'RTCO',
    routeCode: 'Route RTC-2',
    routeName: 'Kigali ➔ Nyagatare',
    status: 'active',
    statusTag: 'Arriving Soon',
    statusColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    nextStop: 'Kayoza Stop',
    eta: '2 mins',
    totalSeats: 28,
    occupiedSeats: [1, 2, 3, 5, 7, 11, 13, 17, 19, 23, 25]
  }
];

export default function Buses() {
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedBusForModal, setSelectedBusForModal] = useState(null);

  const filterTabs = ['All', 'On Time', 'Delayed', 'Arriving Soon'];

  const filteredBuses = INITIAL_BUSES.filter((bus) => {
    const matchesOperator = selectedOperator ? bus.operatorId === selectedOperator.id : true;

    const matchesSearch =
      bus.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.routeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.nextStop.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      activeFilter === 'All' || bus.statusTag.toLowerCase() === activeFilter.toLowerCase();

    return matchesOperator && matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 p-4 md:p-6 font-sans">
      
      {/* SCREEN 1: SELECT TRANSPORT OPERATOR */}
      {!selectedOperator ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Transport Agencies</h1>
            <p className="text-xs text-slate-400 mt-1">Select a bus company to view available routes and fleet</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {OPERATORS.map((company) => (
              <div
                key={company.id}
                onClick={() => setSelectedOperator(company)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl hover:border-slate-700 transition-all duration-300 active:scale-[0.99]"
              >
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${company.color}`} />
                
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 font-black text-white text-sm border border-slate-700 shadow-inner">
                      {company.code}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {company.name}
                      </h2>
                      <p className="text-[11px] text-slate-400">{company.routesCount}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-semibold bg-slate-800 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                    {company.tag}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
                  <span className="text-slate-400 text-[11px]">Active Fleet:</span>
                  <span className="font-bold text-emerald-400">{company.activeBuses} Buses Active ➔</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* SCREEN 2: BUS DIRECTORY FOR SELECTED OPERATOR */
        <div>
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setSelectedOperator(null)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all active:scale-95"
            >
              ←
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-wide">{selectedOperator.name}</h1>
                <span className="text-[10px] bg-slate-800 text-cyan-400 px-2 py-0.5 rounded font-mono border border-slate-700">
                  {selectedOperator.code}
                </span>
              </div>
              <p className="text-xs text-slate-400">Select an active bus to pick your seats</p>
            </div>
          </div>

          <div className="relative mb-4">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${selectedOperator.name} buses...`}
              className="w-full bg-slate-900/90 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-8 py-3 outline-none focus:border-cyan-500/60 transition-all shadow-md"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            {filteredBuses.length > 0 ? (
              filteredBuses.map((bus) => {
                const openCount = bus.totalSeats - bus.occupiedSeats.length;
                return (
                  <div
                    key={bus.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-4 hover:border-slate-700/60 transition-all"
                  >
                    <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold bg-slate-800 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                            {bus.id}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${bus.statusColor}`}>
                            {bus.statusTag}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white mt-1">
                          <span className="text-slate-400 mr-1.5">{bus.routeCode}:</span>
                          {bus.routeName}
                        </h3>
                      </div>

                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        {bus.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center py-1">
                      <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                        <p className="text-[9px] font-semibold text-slate-400 uppercase">Next Stop</p>
                        <p className="text-xs font-bold text-slate-200 mt-0.5 truncate">{bus.nextStop}</p>
                      </div>

                      <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                        <p className="text-[9px] font-semibold text-slate-400 uppercase">ETA</p>
                        <p className="text-xs font-bold text-cyan-400 mt-0.5">{bus.eta}</p>
                      </div>

                      <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                        <p className="text-[9px] font-semibold text-slate-400 uppercase">Open Seats</p>
                        <p className="text-xs font-bold text-emerald-400 mt-0.5">
                          {openCount} <span className="text-[9px] text-slate-500">/ {bus.totalSeats}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedBusForModal(bus)}
                        className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/10 active:scale-[0.99]"
                      >
                        <span>💺</span>
                        <span>Select Seats</span>
                      </button>

                      <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 px-3.5 rounded-xl border border-slate-700/60 transition-all active:scale-[0.99]">
                        <span>🚌 Track</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800/50">
                <span className="text-3xl block mb-2">🚌</span>
                <p className="text-xs font-medium">No buses found for this operator</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedBusForModal && (
        <SeatSelectionModal 
          bus={selectedBusForModal} 
          onClose={() => setSelectedBusForModal(null)} 
        />
      )}
    </div>
  );
}