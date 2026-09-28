// src/pages/Navigate.jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../supabaseClient';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createCustomIcon = (emoji, bgColor) => L.divIcon({
  className: 'custom-leaflet-marker',
  html: `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <div style="background-color: ${bgColor}; width: 36px; height: 36px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); font-size: 14px;">
        ${emoji}
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const userIcon = createCustomIcon('📍', '#10b981');
const destinationIcon = createCustomIcon('🎯', '#e11d48');
const busIcon = createCustomIcon('🚌', '#0284c7');

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  return null;
}

function MapCameraController({ focus, destinationCoords, userCoords }) {
  const map = useMap();

  useEffect(() => {
    if (focus === 'destination' && destinationCoords) {
      map.flyTo(destinationCoords, 15, { duration: 0.8 });
      const timer = setTimeout(() => {
        map.flyTo(userCoords, 14, { duration: 0.8 });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [focus, destinationCoords, userCoords, map]);

  return null;
}

const INITIAL_NOTIFICATIONS = [
  { id: 1, text: 'Shortcut detected (+3 mins faster)', time: 'Just now', icon: '⚡' },
  { id: 2, text: 'Heavy traffic ahead on KN 5 Rd', time: '2 mins ago', icon: '🚨' },
  { id: 3, text: 'Nearing Downtown Bus Station', time: '5 mins ago', icon: '🚏' },
  { id: 4, text: '10 mins remaining till your destination', time: '10 mins ago', icon: '⏳' },
  { id: 5, text: 'You have reached your destination', time: 'Yesterday', icon: '🎉' },
];

const POPULAR_PLACES = [
  { 
    id: 'p1', 
    name: 'Downtown Bus Station', 
    category: 'Transit Station', 
    distance: '1.2 km', 
    eta: '4 mins', 
    arrivalTime: '11:45 AM', 
    traffic: 'green',
    latlng: [-1.9441, 30.0619]
  },
  { 
    id: 'p2', 
    name: 'Kigali Heights Mall', 
    category: 'Shopping Center', 
    distance: '2.5 km', 
    eta: '8 mins', 
    arrivalTime: '11:49 AM', 
    traffic: 'yellow',
    latlng: [-1.9536, 30.0915]
  },
  { 
    id: 'p3', 
    name: 'Nyabugogo Bus Park', 
    category: 'Major Terminal', 
    distance: '3.8 km', 
    eta: '14 mins', 
    arrivalTime: '11:55 AM', 
    traffic: 'red',
    latlng: [-1.9366, 30.0445]
  },
  { 
    id: 'p4', 
    name: 'Convention Centre', 
    category: 'Landmark', 
    distance: '4.1 km', 
    eta: '12 mins', 
    arrivalTime: '11:53 AM', 
    traffic: 'green',
    latlng: [-1.9546, 30.0933]
  },
];

const USER_LOCATION = [-1.9501, 30.0588];
// Fallback bus location if database contains no records
const FALLBACK_BUS_LOCATION = [-1.9460, 30.0620];

export default function Navigate() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeRoute, setActiveRoute] = useState(null);
  const [cameraFocus, setCameraFocus] = useState('user');
  const [busLocation, setBusLocation] = useState(FALLBACK_BUS_LOCATION);
  const [busDetails, setBusDetails] = useState({ plate_number: 'RAC 123 A' });
  const [dbPlaces, setDbPlaces] = useState([]);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setDbPlaces([]);
      return;
    }

    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .ilike('name', `%${searchQuery.trim()}%`)
        .limit(5);

      if (!error && data && data.length > 0) {
        const formatted = data.map((loc) => ({
          id: `db-${loc.id}`,
          name: loc.name,
          category: loc.district ? `${loc.district} District` : loc.category || 'Location',
          distance: loc.is_kigali ? 'Kigali' : loc.province || 'Rwanda',
          eta: '10 mins',
          arrivalTime: '11:50 AM',
          traffic: 'green',
          latlng: [loc.latitude, loc.longitude],
        }));
        setDbPlaces(formatted);
      } else {
        setDbPlaces([]);
      }
    };

    const timer = setTimeout(fetchLocations, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchInitialBusLocation = async () => {
      // 1. First attempt query with relational join
      const { data, error } = await supabase
        .from('bus_locations')
        .select(`
          lat, 
          lng, 
          speed,
          buses (
            plate_number,
            model
          )
        `)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn("Supabase relation fetch error, falling back to simple query:", error.message);
        // Fallback simple query without join if foreign key schema fails
        const { data: simpleData } = await supabase
          .from('bus_locations')
          .select('lat, lng')
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (simpleData && simpleData.lat && simpleData.lng) {
          setBusLocation([simpleData.lat, simpleData.lng]);
        }
        return;
      }

      if (data && data.lat !== undefined && data.lng !== undefined) {
        setBusLocation([data.lat, data.lng]);
        if (data.buses) {
          setBusDetails(data.buses);
        }
      }
    };

    fetchInitialBusLocation();

    const channel = supabase
      .channel('bus-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bus_locations',
        },
        async (payload) => {
          const newRow = payload.new;
          if (newRow && newRow.lat !== undefined && newRow.lng !== undefined) {
            setBusLocation([newRow.lat, newRow.lng]);

            if (newRow.bus_id) {
              const { data: busData } = await supabase
                .from('buses')
                .select('plate_number, model')
                .eq('id', newRow.bus_id)
                .single();

              if (busData) setBusDetails(busData);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const triggerCameraAnimation = () => {
    setCameraFocus('destination');
    setTimeout(() => {
      setCameraFocus('user');
    }, 2000);
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleSelectDestination = (place) => {
    setSearchQuery(place.name);
    setActiveRoute(place);
    setIsFocused(false);
    triggerCameraAnimation();
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim().length > 0) {
      const allSuggestions = dbPlaces.length > 0 ? dbPlaces : filteredPlaces;
      const match = allSuggestions.find(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) || {
        name: searchQuery,
        category: 'Destination',
        distance: '3.0 km',
        eta: '10 mins',
        arrivalTime: '11:51 AM',
        traffic: 'green',
        latlng: [-1.9480, 30.0700]
      };
      setActiveRoute(match);
      setIsFocused(false);
      triggerCameraAnimation();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveRoute(null);
    setCameraFocus('user');
  };

  const filteredPlaces = POPULAR_PLACES.filter(place =>
    place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    place.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displaySuggestions = dbPlaces.length > 0 ? dbPlaces : filteredPlaces;
  const showSuggestions = isFocused && searchQuery.trim().length > 0 && !activeRoute;

  const trafficConfig = {
    green: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-500', label: 'Good Traffic' },
    yellow: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-500', label: 'Moderate Traffic' },
    red: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', dot: 'bg-rose-500', label: 'Heavy Traffic' }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-900 select-none">
      
      <MapContainer 
        center={USER_LOCATION} 
        zoom={14} 
        zoomControl={false}
        className="absolute inset-0 h-full w-full z-0"
      >
        <MapResizer />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* CURRENT USER MARKER */}
        <Marker position={USER_LOCATION} icon={userIcon}>
          <Popup>You are here</Popup>
        </Marker>

        {/* REALTIME BUS MARKER */}
        {busLocation && (
          <Marker position={busLocation} icon={busIcon}>
            <Popup>
              {busDetails?.plate_number ? `Bus (${busDetails.plate_number})` : 'Live Bus Position'}
            </Popup>
          </Marker>
        )}

        {/* DESTINATION MARKER */}
        {activeRoute && activeRoute.latlng && (
          <Marker position={activeRoute.latlng} icon={destinationIcon}>
            <Popup>{activeRoute.name}</Popup>
          </Marker>
        )}

        <MapCameraController 
          focus={cameraFocus} 
          destinationCoords={activeRoute?.latlng} 
          userCoords={USER_LOCATION} 
        />
      </MapContainer>

      {/* NOTIFICATIONS CONTAINER */}
      <div className="absolute top-6 right-8 z-50 flex flex-col items-end">
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-200 shadow-2xl backdrop-blur-md hover:bg-slate-800 active:scale-95 transition-all"
        >
          <span className="text-base">🔔</span>
          {notifications.length > 0 && (
            <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full bg-cyan-400 ring-2 ring-slate-950" />
          )}
        </button>

        {showNotifications && (
          <div className="mt-3 w-72 max-w-[calc(100vw-3rem)] rounded-2xl border border-slate-800 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white tracking-wider uppercase">Notifications</h3>
                <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-500/20">
                  {notifications.length}
                </span>
              </div>
              {notifications.length > 0 && (
                <button 
                  onClick={handleClearNotifications}
                  className="text-[10px] font-bold text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-wider"
                >
                  Clear
                </button>
              )}
            </div>

            {notifications.length > 0 ? (
              <div className="space-y-2">
                {notifications.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-start gap-3 rounded-xl bg-slate-800/40 p-2.5 border border-slate-800/60 hover:bg-slate-800/80 transition-all"
                  >
                    <span className="text-base mt-0.5">{item.icon}</span>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-200 leading-snug">{item.text}</p>
                      <span className="text-[9px] font-semibold text-slate-400 mt-0.5 block">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-xs text-slate-400">No new notifications</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM CONTROL STACK */}
      <div className="absolute bottom-3 left-6 md:left-12 z-40 w-full max-w-md px-4 flex flex-col gap-3 transition-all duration-300">
        <div className="relative w-full">
          {showSuggestions && (
            <div className="absolute bottom-full mb-2 left-0 right-0 rounded-2xl border border-slate-800 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-xl">
              {displaySuggestions.length > 0 ? (
                displaySuggestions.map((place) => (
                  <button
                    key={place.id}
                    onMouseDown={() => handleSelectDestination(place)}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-slate-800/80 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-400 group-hover:text-cyan-400">🔍</span>
                      <div>
                        <div className="text-xs font-medium text-slate-200 group-hover:text-white">
                          {place.name}
                        </div>
                        <div className="text-[10px] text-slate-400">{place.category}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">{place.distance}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-slate-400">No matching places</div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 shadow-2xl backdrop-blur-md focus-within:border-cyan-500/50 transition-all">
            <span className="text-slate-400 text-sm">🔍</span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeRoute) setActiveRoute(null);
              }}
              onKeyDown={handleSearchSubmit}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              placeholder="Search destination or station..."
              className="w-full bg-transparent text-sm text-white placeholder-slate-400 outline-none"
            />
            {searchQuery && (
              <button 
                onClick={handleClearSearch}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {activeRoute && (
          <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-base">🏁</span>
                <div>
                  <h4 className="text-xs font-bold text-white leading-none">{activeRoute.name}</h4>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{activeRoute.category || 'Destination'}</span>
                </div>
              </div>
              
              <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 border ${trafficConfig[activeRoute.traffic || 'green'].bg} ${trafficConfig[activeRoute.traffic || 'green'].border}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${trafficConfig[activeRoute.traffic || 'green'].dot}`} />
                <span className={`text-[10px] font-bold ${trafficConfig[activeRoute.traffic || 'green'].text}`}>
                  {trafficConfig[activeRoute.traffic || 'green'].label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-800/40 p-2 border border-slate-800/60">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Remaining</span>
                <span className="text-sm font-extrabold text-cyan-400 mt-0.5 block">{activeRoute.eta || '10 mins'}</span>
              </div>
              <div className="rounded-xl bg-slate-800/40 p-2 border border-slate-800/60">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Distance</span>
                <span className="text-sm font-extrabold text-white mt-0.5 block">{activeRoute.distance || '2.5 km'}</span>
              </div>
              <div className="rounded-xl bg-slate-800/40 p-2 border border-slate-800/60">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Arrival Time</span>
                <span className="text-sm font-extrabold text-emerald-400 mt-0.5 block">{activeRoute.arrivalTime || '11:50 AM'}</span>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}