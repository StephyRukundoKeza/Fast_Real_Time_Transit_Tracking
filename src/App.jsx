import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import "./App.css";


import NavigatePage from "./pages/Navigate";
import Buses from "./pages/Buses";
import History from "./pages/History";
import Profile from "./pages/Profile";
import BottomNav from "./components/BottomNav";
import NotificationBanner from "./components/NotificationBanner";

import PhoneLogin from "./pages/PhoneLogin";
import OtpVerification from "./pages/OtpVerification";
import Payment from "./pages/Payment";
import Confirm from "./pages/Confirm";
import SeatSelection from "./pages/SeatSelection";
import { isValidRwandaPhone } from "./utils/validation";

function App() {
  const isSupabaseConfigured = Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  const [phone, setPhone] = useState("+250");
  const [token, setToken] = useState("");
  const [step, setStep] = useState(
    isSupabaseConfigured ? "phone" : "logged_in"
  );
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");

  // Live stop notifications state matching database schema
  const [activeNotification, setActiveNotification] = useState(null);

  // Fetch latest stop notification and listen for new ones
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const fetchLatestNotification = async () => {
      const { data, error } = await supabase
        .from("stop_notifications")
        .select("id, stop_name, bus_id, route_id")
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setActiveNotification({
          id: data.id,
          message: `Bus is approaching ${data.stop_name || "your stop"}`,
          timeAway: "5 min away",
          stopName: data.stop_name || "Bus Stop",
        });
      }
    };

    fetchLatestNotification();

    // Realtime subscription for newly inserted notifications
    const notificationSubscription = supabase
      .channel("public:stop_notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "stop_notifications" },
        (payload) => {
          if (payload.new) {
            setActiveNotification({
              id: payload.new.id,
              message: `Bus is approaching ${payload.new.stop_name || "your stop"}`,
              timeAway: "5 min away",
              stopName: payload.new.stop_name || "Bus Stop",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationSubscription);
    };
  }, [isSupabaseConfigured]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        setStep("logged_in");
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          setUser(null);
          setStep("phone");
        } else if (session?.user) {
          setUser(session.user);
          setStep("logged_in");
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [isSupabaseConfigured]);

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!isValidRwandaPhone(phone)) {
      setMessage("Enter a valid Rwanda phone number (e.g. +250791234567).");
      return;
    }

    setMessage("Sending code...");

    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Code sent!");
      setStep("otp");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (token.length !== 6) {
      setMessage("Please enter the 6-digit verification code.");
      return;
    }

    setMessage("Verifying code...");

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });

    if (error) {
      setMessage(`Verification failed: ${error.message}`);
    } else {
      setUser(data.user);
      setStep("logged_in");
      setMessage("");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setStep("phone");
    setPhone("+250");
    setToken("");
    setMessage("");
  };

  if (step === "phone") {
    return (
      <PhoneLogin
        phone={phone}
        setPhone={setPhone}
        onSubmit={handleSendOtp}
        message={message}
      />
    );
  }

  if (step === "otp") {
    return (
      <OtpVerification
        phone={phone}
        token={token}
        setToken={setToken}
        onSubmit={handleVerifyOtp}
        onBack={() => {
          setStep("phone");
          setToken("");
          setMessage("");
        }}
        message={message}
      />
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 pb-24 relative">
        {/* Floating Notification Banner */}
        <NotificationBanner
          notification={activeNotification}
          onDismiss={() => setActiveNotification(null)}
          onViewDetails={(notif) => {
            console.log("Viewing notification details:", notif);
          }}
        />

        <Routes>
          <Route path="/" element={<Navigate to="/navigate" replace />} />

          <Route path="/navigate" element={<NavigatePage user={user} />} />

          <Route path="/buses" element={<Buses />} />

          <Route path="/payment" element={<Payment user={user} />} />
          <Route path="/seat-selection/:busId" element={<SeatSelection user={user} />} />
          
          <Route path="/confirm" element={<Confirm />} />

          <Route path="/history" element={<History user={user} />} />

          <Route
            path="/profile"
            element={<Profile user={user} onLogout={handleLogout} />}
          />

          <Route
            path="*"
            element={<Navigate to="/navigate" replace />}
          />
        </Routes>

        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;