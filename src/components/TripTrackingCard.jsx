// src/components/TripTrackingCard.jsx
import React, { useState, useEffect } from 'react';
import { calculateDistance, calculateArrivalTime } from '../utils/distance';

export default function TripTrackingCard({ destination, busPlate, userCoords, targetCoords }) {
  const [notifyThreshold, setNotifyThreshold] = useState('0.5');
  const [distance, setDistance] = useState(0);
  const [eta, setEta] = useState(0);
  const [arrivalTime, setArrivalTime] = useState('--:--');

  // Simulated live moving position
  const [currentBusCoords, setCurrentBusCoords] = useState(targetCoords);

  // Simulate bus moving toward the user every 3 seconds
  useEffect(() => {
    if (!targetCoords) return;

    const interval = setInterval(() => {
      setCurrentBusCoords((prev) => {
        if (!prev) return targetCoords;
        // Move slightly closer to user location
        const latStep = (userCoords.lat - prev.lat) * 0.05;
        const lngStep = (userCoords.lng - prev.lng) * 0.05;
        return {
          lat: prev.lat + latStep,
          lng: prev.lng + lngStep,
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [userCoords, targetCoords]);

  // Recalculate metrics whenever the bus position updates
  useEffect(() => {
    if (userCoords && currentBusCoords) {
      const dist = calculateDistance(
        userCoords.lat,
        userCoords.lng,
        currentBusCoords.lat,
        currentBusCoords.lng
      );
      const calculatedEta = (dist / 30) * 60; // Estimated travel time at 30 km/h

      setDistance(dist.toFixed(1));
      setEta(Math.ceil(calculatedEta));
      setArrivalTime(calculateArrivalTime(calculatedEta));
    }
  }, [userCoords, currentBusCoords]);

  return (
    <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-xl border border-gray-800 max-w-md w-full">
      {/* Header Info */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase">Heading To</span>
          <h3 className="text-base font-bold text-white">{destination || 'Kimironko Market'}</h3>
        </div>
        <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-500/30">
          {busPlate || 'RAD 456B'}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 bg-gray-800/60 rounded-xl p-3 text-center mb-3">
        <div>
          <p className="text-[10px] text-gray-400 font-medium">REMAINING</p>
          <p className="text-base font-extrabold text-white">{distance} <span className="text-xs font-normal text-gray-400">km</span></p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-medium">ETA</p>
          <p className="text-base font-extrabold text-teal-400">{eta} <span className="text-xs font-normal text-gray-400">min</span></p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-medium">ARRIVES</p>
          <p className="text-base font-extrabold text-white">{arrivalTime}</p>
        </div>
      </div>

      {/* Proximity Notification Alert Trigger */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-800 text-xs">
        <span className="text-gray-400 font-medium flex items-center gap-1">
          🔔 NOTIFY AT
        </span>
        <select
          value={notifyThreshold}
          onChange={(e) => setNotifyThreshold(e.target.value)}
          className="bg-gray-800 text-white font-semibold rounded-lg px-2 py-1 outline-none border border-gray-700"
        >
          <option value="0.2">0.2 km</option>
          <option value="0.5">0.5 km</option>
          <option value="1.0">1.0 km</option>
          <option value="2.0">2.0 km</option>
        </select>
      </div>
    </div>
  );
}