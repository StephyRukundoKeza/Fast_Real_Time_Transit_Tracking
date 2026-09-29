import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function NotificationBanner({ onViewDetails }) {
  const [notification, setNotification] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 1. Fetch latest stop notification on mount
    async function fetchLatestNotification() {
      const { data, error } = await supabase
        .from("stop_notifications")
        .select("id, stop_name, distance_meters, triggered_at")
        .order("triggered_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setNotification(data);
        setVisible(true);
      }
    }

    fetchLatestNotification();

    // 2. Realtime subscription (.on comes BEFORE .subscribe)
    const channel = supabase
      .channel("stop_notifications_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "stop_notifications" },
        (payload) => {
          setNotification(payload.new);
          setVisible(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!notification || !visible) return null;

  const handleDismiss = (e) => {
    e.stopPropagation();
    setVisible(false);
  };

  const handleView = () => {
    if (onViewDetails) onViewDetails(notification);
  };

  // Convert distance in meters to a readable string (e.g. 40m or 1.2km)
  const formattedDistance =
    notification.distance_meters != null
      ? notification.distance_meters < 1000
        ? `${Math.round(notification.distance_meters)}m away`
        : `${(notification.distance_meters / 1000).toFixed(1)}km away`
      : null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-in slide-in-from-top duration-300">
      <div
        onClick={handleView}
        className="cursor-pointer bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-3 transition-transform hover:scale-[1.01] active:scale-[0.99]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            {/* Bus Icon */}
            <svg
              className="w-5 h-5 text-amber-400 animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h8m-8 4h8m-9 5h10M4 11V6a2 2 0 012-2h12a2 2 0 012 2v5m-16 0v6a2 2 0 002 2h1a2 2 0 002-2v-1h6v1a2 2 0 002 2h1a2 2 0 002-2v-6m-16 0h16"
              />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Bus Approaching
              </span>
              {formattedDistance && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full font-medium border border-amber-500/20">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {formattedDistance}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-slate-100 truncate mt-0.5">
              Bus is arriving at{" "}
              <span className="font-semibold text-amber-300">
                {notification.stop_name}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Dismiss"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}