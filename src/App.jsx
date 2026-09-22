import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import "./App.css";

import NavigatePage from "./pages/Navigate";
import Buses from "./pages/Buses";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import BottomNav from "./components/BottomNav";

import PhoneLogin from "./pages/PhoneLogin";
import OtpVerification from "./pages/OtpVerification";
import Payment from "./pages/Payment";
import Confirm from "./pages/Confirm";

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

    if (!phone || phone.length < 10) {
      setMessage("Please enter a valid phone number.");
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
      <div className="min-h-screen bg-gray-50 pb-24">
        <Routes>
          <Route path="/" element={<Navigate to="/navigate" replace />} />

          <Route path="/navigate" element={<NavigatePage />} />

          <Route path="/search" element={<Search />} />

          <Route path="/buses" element={<Buses />} />

          <Route path="/payment" element={<Payment user={user} />} />

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