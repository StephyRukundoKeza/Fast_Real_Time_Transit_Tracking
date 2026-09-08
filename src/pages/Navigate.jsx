// src/pages/Navigate.jsx
import React, { useState, useRef, useEffect } from 'react';

const POPULAR_DESTINATIONS = [
  { name: 'Kimironko Market', distance: '6.8 km', duration: '18 min', eta: '10:45 AM', traffic: 'moderate', trafficColor: 'bg-amber-500', trafficText: 'Moderate Traffic' },
  { name: 'Remera Bus Park', distance: '4.2 km', duration: '12 min', eta: '10:39 AM', traffic: 'good', trafficColor: 'bg-emerald-500', trafficText: 'Smooth Traffic' },
  { name: 'Nyabugogo Terminal', distance: '8.5 km', duration: '32 min', eta: '10:59 AM', traffic: 'bad', trafficColor: 'bg-rose-500', trafficText: 'Heavy Traffic' },
  { name: 'Kicukiro Centre', distance: '5.1 km', duration: '15 min', eta: '10:42 AM', traffic: 'good', trafficColor: 'bg-emerald-500', trafficText: 'Smooth Traffic' },
  { name: 'Nyamirambo Stadium', distance: '7.0 km', duration: '22 min', eta: '10:49 AM', traffic: 'moderate', trafficColor: 'bg-amber-500', trafficText: 'Moderate Traffic' },
  { name: 'Musanze Bus Stop', distance: '92.0 km', duration: '2h 15m', eta: '12:42 PM', traffic: 'good', trafficColor: 'bg-emerald-500', trafficText: 'Clear Highway' }
];

export default function Navigate() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const dropdownRef = useRef(null);

  // Filter places based on user input
  const suggestions = POPULAR_DESTINATIONS.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    setQuery(item.name);
    setSelectedRoute(item);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setSelectedRoute(null);
    setIsOpen(false);
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 p-0 font-sans text-white overflow-x-hidden">
      {/* 1. Map Viewport Container */}
      <div 
        className="w-[75%] h-[75vh] rounded-r-2xl overflow-hidden relative border-r border-b border-slate-800 shadow-2xl bg-cover bg-center"
        style={{
          backgroundImage: `url('https://tile.openstreetmap.org/15/18663/16843.png')`
        }}
      >
        <div className="absolute inset-0 bg-slate-950/40" />
        
        {/* Label indicator */}
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-700/60">
          Kigali Map Viewport
        </div>
      </div>

      {/* 2. Destination Search Input & Route Metrics */}
      <div className="p-4 w-[75%] max-w-md relative space-y-3" ref={dropdownRef}>
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search your destination..."
            className="w-full bg-slate-900/90 border border-slate-800 focus:border-amber-400/70 text-xs font-medium text-white placeholder-slate-500 rounded-xl pl-10 pr-8 py-3 outline-none transition-all shadow-lg"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown Suggestions */}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute left-4 right-4 mt-1 bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-30 backdrop-blur-md max-h-48 overflow-y-auto">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(item)}
                className="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-800/80 hover:text-amber-400 border-b border-slate-800/40 last:border-0 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[10px]">📍</span>
                  <span>{item.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{item.distance}</span>
              </button>
            ))}
          </div>
        )}

        {/* 3. Selected Route Info Panel (Appears after selecting a destination) */}
        {selectedRoute && (
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3.5 shadow-xl backdrop-blur-md space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Destination Details
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${selectedRoute.trafficColor} animate-pulse`} />
                <span className="text-[10px] font-bold text-slate-300">
                  {selectedRoute.trafficText}
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {/* Distance */}
              <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/60">
                <p className="text-[9px] font-semibold text-slate-400 uppercase">Distance</p>
                <p className="text-xs font-bold text-white mt-0.5">{selectedRoute.distance}</p>
              </div>

              {/* Remaining Time */}
              <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/60">
                <p className="text-[9px] font-semibold text-slate-400 uppercase">Travel Time</p>
                <p className="text-xs font-bold text-amber-400 mt-0.5">{selectedRoute.duration}</p>
              </div>

              {/* Arrival Time */}
              <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/60">
                <p className="text-[9px] font-semibold text-slate-400 uppercase">Arrival</p>
                <p className="text-xs font-bold text-emerald-400 mt-0.5">{selectedRoute.eta}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}