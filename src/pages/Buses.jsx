import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Popular default bus companies to feature as filters
const DEFAULT_COMPANIES = ['All', 'Virunga', 'Ritco', 'Volcano', 'Horizon', 'RFTC'];

export default function Buses() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState('All');

  // Fetch active buses/trips from Supabase
  useEffect(() => {
    async function fetchBuses() {
      setLoading(true);
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id,
          route_name,
          departure_time,
          price,
          available_seats,
          company_name,
          buses (
            id,
            plate_number,
            driver_name,
            company_name
          )
        `);

      if (!error && data) {
        setBuses(data);
      }
      setLoading(false);
    }

    fetchBuses();
  }, []);

  // Extract unique companies from returned database rows combined with defaults
  const companyOptions = useMemo(() => {
    const fetchedCompanies = buses
      .map((t) => t.company_name || t.buses?.company_name)
      .filter(Boolean);

    const merged = new Set(['All', ...DEFAULT_COMPANIES, ...fetchedCompanies]);
    return Array.from(merged);
  }, [buses]);

  // Filter trips based on selected company
  const filteredBuses = useMemo(() => {
    if (selectedCompany === 'All') return buses;

    return buses.filter((trip) => {
      const company = (trip.company_name || trip.buses?.company_name || '').toLowerCase();
      const route = (trip.route_name || '').toLowerCase();
      const target = selectedCompany.toLowerCase();

      return company.includes(target) || route.includes(target);
    });
  }, [buses, selectedCompany]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 pb-24">
      <h1 className="text-2xl font-bold mb-4 text-slate-100">Available Bus Trips</h1>

      {/* Company Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 scrollbar-none">
        {companyOptions.map((company) => {
          const isActive = selectedCompany === company;
          return (
            <button
              key={company}
              onClick={() => setSelectedCompany(company)}
              className={`
                px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border
                ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20 scale-105'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                }
              `}
            >
              {company === 'All' ? '🚌 All Companies' : company}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <p className="animate-pulse">Loading available trips...</p>
        </div>
      ) : filteredBuses.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
          {selectedCompany === 'All'
            ? 'No active bus trips found at the moment.'
            : `No active trips found for ${selectedCompany}.`}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBuses.map((trip) => {
            const companyName =
              trip.company_name || trip.buses?.company_name || 'Express Bus';

            return (
              <div
                key={trip.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-slate-700 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-md mb-1 inline-block">
                      {companyName}
                    </span>
                    <h3 className="text-lg font-bold text-slate-100">{trip.route_name}</h3>
                    <p className="text-xs text-slate-400">
                      Bus: {trip.buses?.plate_number || 'N/A'} • {trip.buses?.driver_name || 'Driver'}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-400">
                    {trip.price ? `${trip.price.toLocaleString()} RWF` : 'Free'}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-4 text-xs text-slate-300">
                  <span>
                    Departs:{' '}
                    {trip.departure_time
                      ? new Date(trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Scheduled'}
                  </span>
                  <span className="bg-cyan-950 text-cyan-300 px-2.5 py-1 rounded-md font-mono border border-cyan-800/50">
                    {trip.available_seats ?? 0} seats left
                  </span>
                </div>

                <button
                  onClick={() => setSelectedBus(trip)}
                  className="w-full mt-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10 active:scale-[0.98]"
                >
                  <span>💺</span>
                  <span>Select Seats</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Realtime Seat Selection Modal */}
      {selectedBus && (
        <SeatSelectionModal
          trip={selectedBus}
          onClose={() => setSelectedBus(null)}
        />
      )}
    </div>
  );
}

// ==========================================
// REALTIME SEAT SELECTION MODAL COMPONENT
// ==========================================
function SeatSelectionModal({ trip, onClose }) {
  const navigate = useNavigate();
  const [seats, setSeats] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(true);

  // Fetch initial seat records and setup real-time subscription
  useEffect(() => {
    async function fetchSeats() {
      setLoadingSeats(true);
      const { data, error } = await supabase
        .from('seats')
        .select('*')
        .eq('trip_id', trip.id)
        .order('seat_number', { ascending: true });

      if (!error && data) {
        setSeats(data);
      }
      setLoadingSeats(false);
    }

    fetchSeats();

    // Subscribe to changes on the seats table for this specific trip
    const channel = supabase
      .channel(`public:seats:trip_id=eq.${trip.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'seats', filter: `trip_id=eq.${trip.id}` },
        (payload) => {
          setSeats((prevSeats) =>
            prevSeats.map((seat) => (seat.id === payload.new.id ? payload.new : seat))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trip.id]);

  // Toggle individual seat selection
  const toggleSeat = (seat) => {
    if (seat.status !== 'available') return;

    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id));
    } else {
      if (selectedSeatIds.length >= 4) {
        alert('You can select a maximum of 4 seats per booking.');
        return;
      }
      setSelectedSeatIds((prev) => [...prev, seat.id]);
    }
  };

  // Navigate to payment page with context
  const handleProceedToCheckout = () => {
    if (selectedSeatIds.length === 0) return;

    const selectedSeatDetails = seats.filter((s) => selectedSeatIds.includes(s.id));
    const totalPrice = selectedSeatDetails.length * (trip.price || 0);

    navigate('/payment', {
      state: {
        tripId: trip.id,
        routeName: trip.route_name,
        companyName: trip.company_name || trip.buses?.company_name,
        plateNumber: trip.buses?.plate_number,
        seats: selectedSeatDetails,
        totalPrice,
      },
    });
  };

  const selectedCount = selectedSeatIds.length;
  const totalPrice = selectedCount * (trip.price || 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-slate-100 text-sm">Select Your Seat</h2>
            <p className="text-xs text-slate-400">{trip.route_name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full text-lg leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Bus Info Bar */}
        <div className="px-5 py-3 bg-slate-950 flex justify-between items-center text-xs text-slate-300">
          <span className="font-mono font-semibold text-cyan-400">
            {trip.buses?.plate_number || 'BUS'}
          </span>
          <span className="text-amber-400 font-medium">{selectedCount}/4 Selected</span>
        </div>

        {/* Seat Layout Container */}
        <div className="p-6 overflow-y-auto flex-1 bg-white flex flex-col items-center">
          {/* Driver Indicator */}
          <div className="w-full max-w-[220px] mb-6 flex justify-end">
            <span className="bg-slate-900 text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider">
              ✦ Driver
            </span>
          </div>

          {loadingSeats ? (
            <div className="py-12 text-slate-500 text-xs animate-pulse">
              Loading seat layout...
            </div>
          ) : seats.length === 0 ? (
            <div className="py-12 text-slate-500 text-xs text-center">
              No seat map found for this trip.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 w-full max-w-[220px]">
              {seats.map((seat) => {
                const isSelected = selectedSeatIds.includes(seat.id);
                const isTaken = seat.status !== 'available';

                return (
                  <button
                    key={seat.id}
                    disabled={isTaken}
                    onClick={() => toggleSeat(seat)}
                    className={`
                      h-10 rounded-xl border flex items-center justify-center text-xs font-bold transition-all
                      ${
                        isTaken
                          ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
                          : isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105'
                          : 'bg-white border-amber-400 text-amber-600 hover:bg-amber-50 active:scale-95'
                      }
                    `}
                  >
                    {seat.seat_number}
                  </button>
                );
              })}
            </div>
          )}

          {/* Seat Status Legend */}
          <div className="flex gap-4 mt-8 text-[11px] text-slate-600 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded border border-amber-400 bg-white"></span>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-slate-900"></span>
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-200"></span>
              <span>Taken</span>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <button
            disabled={selectedCount === 0}
            onClick={handleProceedToCheckout}
            className={`
              w-full py-3.5 rounded-xl font-bold text-sm transition-all
              ${
                selectedCount > 0
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }
            `}
          >
            Buy Ticket {selectedCount > 0 ? `(${totalPrice.toLocaleString()} RWF)` : ''}
          </button>
        </div>

      </div>
    </div>
  );
}