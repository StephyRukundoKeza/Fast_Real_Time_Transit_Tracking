// src/components/PlanTripSearch.jsx
import React, { useState } from 'react';
import Card from './Card';

export default function PlanTripSearch({ onSearch }) {
  const [routeType, setRouteType] = useState('kigali'); // 'kigali' | 'interdistrict'
  const [origin, setOrigin] = useState('Nyabugogo');
  const [destination, setDestination] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({ routeType, origin, destination });
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-4 font-sans">
      {/* 1. Quick Action Category Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card
          onClick={() => setRouteType('kigali')}
          className={routeType === 'kigali' ? '!border-amber-400/50 !bg-[#142d4a]' : ''}
        >
          <div className="text-lg mb-1">📍</div>
          <p className="text-xs font-bold text-white">Within Kigali</p>
          <p className="text-[10px] text-gray-400 mt-0.5">City routes</p>
        </Card>

        <Card
          onClick={() => setRouteType('interdistrict')}
          className={routeType === 'interdistrict' ? '!border-amber-400/50 !bg-[#142d4a]' : ''}
        >
          <div className="text-lg mb-1">🚌</div>
          <p className="text-xs font-bold text-white">Inter-District</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Long distance</p>
        </Card>
      </div>

      {/* 2. Main Search Card */}
      <Card className="!bg-[#10243c] !border-white/10">
        <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-3">
          Plan Your Trip · {routeType === 'kigali' ? 'City' : 'Upcountry'}
        </p>

        <form onSubmit={handleSearch} className="space-y-3">
          {/* Origin */}
          <div className="flex items-center gap-3 bg-[#0b192c] rounded-xl px-3.5 py-2.5 border border-white/5 focus-within:border-amber-400/50">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">From</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Current Terminal"
                className="w-full bg-transparent text-xs font-bold text-white outline-none placeholder-gray-500"
              />
            </div>
          </div>

          {/* Destination */}
          <div className="flex items-center gap-3 bg-[#0b192c] rounded-xl px-3.5 py-2.5 border border-white/5 focus-within:border-amber-400/50">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-gray-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">To</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={
                  routeType === 'kigali'
                    ? 'To: Remera, Kimironko, Kicukiro...'
                    : 'To: Province, District, Musanze...'
                }
                className="w-full bg-transparent text-xs font-bold text-white outline-none placeholder-gray-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs py-3 rounded-xl transition-all shadow-md active:scale-[0.98]"
          >
            Search Buses
          </button>
        </form>
      </Card>
    </div>
  );
}