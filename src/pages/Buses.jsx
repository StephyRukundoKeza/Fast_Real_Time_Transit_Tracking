import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { MAX_SEATS_PER_TRIP, isValidSeatSelection } from '../utils/validation';

// Cosmetic subtitles only — the list of companies itself comes from the
// database (see `featuredCompanies` below), not from this map.
const COMPANY_DESCRIPTIONS = {
  Ritco: 'Inter-city & Regional Transport',
  'Volcano Express': 'Express Kigali routes',
  Virunga: 'Northern Province & Musanze',
  Horizon: 'Southern & Western routes',
  RFTC: 'Local & City coasters',
  'Kigali Bus Services': 'Zone 1 city routes',
  'Royal Express': 'Zone 2 city routes',
  'City Express': 'Interdistrict corridors',
  'Stella Express': 'Interdistrict corridors',
};

// Straight-line distance between two lat/lng points, in kilometers.
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Buses() {
  const navigate = useNavigate();
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Navigation Flow: step 1 = Search UI, step 2 = Company List, step 3 = Active Trips
  const [step, setStep] = useState(1);
  const [tab, setTab] = useState('kigali'); // 'kigali' | 'interdistrict'
  const [originFilter, setOriginFilter] = useState('Nyabugogo');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [searchError, setSearchError] = useState('');
  const [locating, setLocating] = useState(false);
  
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch real trips and join route + bus details from Supabase
  useEffect(() => {
    async function fetchBuses() {
      setLoading(true);
      setErrorMessage('');

const { data, error } = await supabase
  .from('trips')
  .select(`
    id,
    departure_time,
    routes!route_id (
      id,
      origin,
      destination,
      is_kigali,
      stops
    ),
    buses!bus_id (
      id,
      bus_number,
      plate_number,
      company_name
    )
  `)
  .gt('departure_time', new Date().toISOString())
  .order('departure_time', { ascending: true });

      if (error) {
        console.error('Supabase query error:', error);
        setErrorMessage(error.message);
      } else if (data) {
        setBuses(data);
      }
      setLoading(false);
    }

    fetchBuses();
  }, []);

  // Every known stop across all routes, deduplicated by name — used to find
  // the closest one to the rider's current location.
  const allStops = useMemo(() => {
    const map = new Map();
    buses.forEach((trip) => {
      (trip.routes?.stops || []).forEach((stop) => {
        if (stop?.name && typeof stop.lat === 'number' && typeof stop.lng === 'number') {
          map.set(stop.name, stop);
        }
      });
    });
    return Array.from(map.values());
  }, [buses]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setSearchError('Your browser does not support location access.');
      return;
    }
    setSearchError('');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (allStops.length === 0) {
          setSearchError('Stop locations are still loading — try again in a moment.');
          setLocating(false);
          return;
        }
        let nearest = allStops[0];
        let nearestDist = getDistanceKm(latitude, longitude, nearest.lat, nearest.lng);
        allStops.forEach((stop) => {
          const dist = getDistanceKm(latitude, longitude, stop.lat, stop.lng);
          if (dist < nearestDist) {
            nearest = stop;
            nearestDist = dist;
          }
        });
        setOriginFilter(nearest.name);
        setLocating(false);
      },
      () => {
        setSearchError('Could not get your location. Please enable location access and try again.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Require a destination before moving on, and only proceed once it's set.
  const handleProceedToStep2 = () => {
    if (!destinationFilter.trim()) {
      setSearchError('Please enter a destination before searching.');
      return;
    }
    setSearchError('');
    setStep(2);
  };

  // Only trips whose route matches the selected tab (Within Kigali vs Inter-District)
  const busesInTab = useMemo(() => {
    return buses.filter((trip) => Boolean(trip.routes?.is_kigali) === (tab === 'kigali'));
  }, [buses, tab]);

  // Narrow further to trips whose route actually matches what was searched for.
  const routeFilteredBuses = useMemo(() => {
    const origin = originFilter.toLowerCase().trim();
    const destination = destinationFilter.toLowerCase().trim();
    return busesInTab.filter((trip) => {
      const tripOrigin = (trip.routes?.origin || '').toLowerCase();
      const tripDestination = (trip.routes?.destination || '').toLowerCase();
      const matchesOrigin = !origin || tripOrigin.includes(origin);
      const matchesDestination = !destination || tripDestination.includes(destination);
      return matchesOrigin && matchesDestination;
    });
  }, [busesInTab, originFilter, destinationFilter]);

  // Derive the list of companies to show from the actual, route-matching trip
  // data, instead of a hardcoded array that can go stale.
  const featuredCompanies = useMemo(() => {
    const names = new Set(
      routeFilteredBuses.map((trip) => trip.buses?.company_name).filter(Boolean)
    );
    return Array.from(names)
      .sort()
      .map((name) => ({
        name,
        desc: COMPANY_DESCRIPTIONS[name] || 'Scheduled routes',
      }));
  }, [routeFilteredBuses]);

  // Filter trips for selected company on Step 3
  const filteredTrips = useMemo(() => {
    if (!selectedCompany) return [];

    return routeFilteredBuses.filter((trip) => {
      const company = (trip.buses?.company_name || '').toLowerCase();
      const target = selectedCompany.toLowerCase();
      const origin = (trip.routes?.origin || '').toLowerCase();
      const destination = (trip.routes?.destination || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesCompany = company.includes(target) || target === 'all';
      const matchesSearch = !query || origin.includes(query) || destination.includes(query);

      return matchesCompany && matchesSearch;
    });
  }, [routeFilteredBuses, selectedCompany, searchQuery]);

  return (
    <div className="min-h-screen bg-[#070e17] text-slate-100 p-5 pb-28 font-sans">
      {/* Dynamic Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="text-[11px] font-bold tracking-widest text-[#1ed7b5] uppercase">
            SIGA TRANSIT
          </div>
          <h1 className="text-2xl font-black text-white">
            {step === 1 && 'Search Buses'}
            {step === 2 && 'Select Bus Company'}
            {step === 3 && `${selectedCompany} Buses`}
          </h1>
          {step === 1 && (
            <p className="text-xs text-slate-400 mt-0.5">
              Choose within Kigali or inter-district, then search by route.
            </p>
          )}
        </div>

        {/* Dynamic Back Button */}
        {step > 1 && (
          <button
            onClick={() => {
              if (step === 3) {
                setStep(2);
                setSelectedCompany(null);
                setSearchQuery('');
              } else if (step === 2) {
                setStep(1);
              }
            }}
            className="text-xs bg-[#0d1d2d] border border-slate-700 hover:border-[#1ed7b5] px-3 py-1.5 rounded-xl text-slate-300 font-semibold transition-all"
          >
            ← Back
          </button>
        )}
      </div>

      {/* ========================================================
          STEP 1: ROUTE SEARCH PAGE
         ======================================================== */}
      {step === 1 && (
        <div className="space-y-5 mt-4">
          {/* Tabs: Within Kigali vs Inter-District */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTab('kigali')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                tab === 'kigali'
                  ? 'bg-[#0d1d2d] border-[#1ed7b5] text-white'
                  : 'bg-[#0a1524] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-lg mb-1 block">📍</span>
              <div className="text-xs font-bold text-white">Within Kigali</div>
              <div className="text-[10px] text-slate-400">City routes</div>
            </button>

            <button
              type="button"
              onClick={() => setTab('interdistrict')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                tab === 'interdistrict'
                  ? 'bg-[#0d1d2d] border-[#1ed7b5] text-white'
                  : 'bg-[#0a1524] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-lg mb-1 block">🚌</span>
              <div className="text-xs font-bold text-white">Inter-District</div>
              <div className="text-[10px] text-slate-400">Long distance</div>
            </button>
          </div>

          {/* Plan Your Trip Input Card */}
          <div className="bg-[#0d1d2d] border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              PLAN YOUR TRIP - {tab === 'kigali' ? 'CITY' : 'PROVINCIAL'}
            </div>

            <div className="bg-[#071426] border border-slate-800 rounded-xl p-3">
              <label className="text-[9px] font-bold text-amber-500 uppercase block mb-1">
                FROM
              </label>
              <input
                type="text"
                value={originFilter}
                onChange={(e) => setOriginFilter(e.target.value)}
                placeholder="Origin (e.g. Nyabugogo)..."
                className="w-full bg-transparent text-xs font-bold text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={locating}
                className="text-[10px] font-bold text-[#1ed7b5] mt-1.5 disabled:opacity-50"
              >
                {locating ? 'Locating…' : '📍 Use my current location'}
              </button>
            </div>

            <div className="bg-[#071426] border border-slate-800 rounded-xl p-3">
              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                TO
              </label>
              <input
                type="text"
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
                placeholder="To: Remera, Kimironko, Kicukiro..."
                className="w-full bg-transparent text-xs font-semibold text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            {searchError && (
              <p className="text-[11px] text-red-400 font-semibold">{searchError}</p>
            )}

            <button
              type="button"
              onClick={handleProceedToStep2}
              className="w-full bg-amber-500 hover:bg-amber-400 text-[#070e17] font-bold py-3 rounded-xl text-xs transition-all shadow-lg shadow-amber-500/10"
            >
              Search Buses
            </button>
          </div>

          {/* Featured Route Card */}
          <div className="bg-[#0d1d2d] border border-slate-800/80 rounded-2xl p-5 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                {originFilter || 'Nyabugogo'} - {destinationFilter || 'Kimironko'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {originFilter || 'Nyabugogo'} → {destinationFilter || 'Kimironko'}
              </p>
              <p className="text-xs font-bold text-[#1ed7b5] mt-1">450 RWF</p>
            </div>

            <button
              type="button"
              onClick={handleProceedToStep2}
              className="w-full bg-[#1ed7b5] hover:bg-[#1bc4a4] text-[#070e17] text-xs font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#1ed7b5]/10"
            >
              View Buses
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 2: COMPANY SELECTION
         ======================================================== */}
      {step === 2 && (
        <div className="space-y-4 mt-6">
          <p className="text-xs text-slate-400 mb-2">
            Showing agencies for {originFilter || 'anywhere'} → {destinationFilter || 'anywhere'}.
          </p>

          {featuredCompanies.length === 0 ? (
            <div className="bg-[#0d1926] border border-slate-800/80 rounded-2xl p-8 text-center text-xs text-slate-400">
              No buses found from {originFilter || 'your origin'} to {destinationFilter || 'that destination'}
              {' '}in {tab === 'kigali' ? 'Within Kigali' : 'Inter-District'}. Try the other tab or a different destination.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {featuredCompanies.map((company) => {
                const tripCount = routeFilteredBuses.filter((t) =>
                  (t.buses?.company_name || '').toLowerCase().includes(company.name.toLowerCase())
                ).length;

                return (
                  <div
                    key={company.name}
                    onClick={() => {
                      setSelectedCompany(company.name);
                      setStep(3);
                    }}
                    className="bg-[#0d1d2d] border border-slate-800 hover:border-[#1ed7b5] rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-between group shadow-lg active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-[#070f1a] border border-slate-800 flex items-center justify-center text-xl group-hover:border-[#1ed7b5] transition-colors">
                        {company.name === 'Ritco'
                          ? '🚌'
                          : company.name === 'Volcano Express'
                          ? '⚡'
                          : company.name === 'Virunga'
                          ? '⛰️'
                          : company.name === 'Horizon'
                          ? '🌅'
                          : '🚐'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-[#1ed7b5] transition-colors">
                          {company.name}
                        </h3>
                        <p className="text-[11px] text-slate-400">{company.desc}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono bg-[#1ed7b5]/10 text-[#1ed7b5] border border-[#1ed7b5]/30 px-2.5 py-1 rounded-full font-bold">
                        {loading ? '...' : `${tripCount} Trips`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          STEP 3: ACTIVE TRIPS VIEW
         ======================================================== */}
      {step === 3 && (
        <div className="space-y-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Refine within ${selectedCompany} (e.g. Kigali, Musanze)...`}
            className="w-full bg-[#0d1926] border border-slate-800 rounded-2xl py-3 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1ed7b5] transition-colors mb-4"
          />

          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400 animate-pulse">
              Loading {selectedCompany} active trips...
            </div>
          ) : errorMessage ? (
            <div className="bg-red-950/40 border border-red-800/60 rounded-2xl p-5 text-center text-red-400 text-xs font-mono">
              {errorMessage}
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="bg-[#0d1926] border border-slate-800/80 rounded-2xl p-8 text-center text-xs text-slate-400">
              No active bus trips found for {selectedCompany}.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTrips.map((trip) => {
                const plate = trip.buses?.plate_number || 'N/A';
                const origin = trip.routes?.origin || 'Origin';
                const destination = trip.routes?.destination || 'Destination';

                return (
                  <div
                    key={trip.id}
                    className="bg-[#0d1d2d] border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-[#1ed7b5] uppercase tracking-wider">
                        {plate}
                      </span>
                      <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        active
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white mb-4">
                      Route: {origin} → {destination}
                    </h3>

                    <div className="grid grid-cols-2 gap-2 bg-[#070f1a] p-3 rounded-xl mb-4 text-center">
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">Company</div>
                        <div className="text-xs font-semibold text-slate-200 truncate">
                          {trip.buses?.company_name || selectedCompany}
                        </div>
                      </div>
                      <div>
                      <div className="text-[10px] text-slate-500 font-medium">Departs</div>
                        <div className="text-xs font-semibold text-slate-200">
                          {trip.departure_time
                            ? new Date(trip.departure_time).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Scheduled'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() =>
                          navigate(`/seat-selection/${trip.buses?.bus_number}`, {
                            state: {
                              routeName: `${origin} → ${destination}`,
                              tripId: trip.id,
                            },
                          })
                        }
                        className="w-full bg-[#1ed7b5] hover:bg-[#1bc4a4] text-[#070e17] text-xs font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#1ed7b5]/10 active:scale-[0.99]"
                      >
                        Select Seats
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}