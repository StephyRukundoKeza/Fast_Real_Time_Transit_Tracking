import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import "./App.css";

import NavigatePage from "./pages/Navigate";
import Buses from "./pages/Buses";
import History from "./pages/History";
import Profile from "./pages/Profile";
import BottomNav from "./components/BottomNav";

function App() {
  const [phone, setPhone] = useState("+1234567890");
  const [token, setToken] = useState("");
  const [step, setStep] = useState("phone");
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        setStep("logged_in");
      }
    });
  }, []);

  // Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setMessage("Sending code...");

    const { error } = await supabase.auth.signInWithOtp({ phone });

    if (error) {
      setMessage(`❌ Error: ${error.message}`);
    } else {
      setMessage("✅ Code sent! Enter your test OTP.");
      setStep("otp");
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setMessage("Verifying code...");

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });

    if (error) {
      setMessage(`❌ Verification failed: ${error.message}`);
    } else {
      setUser(data.user);
      setStep("logged_in");
      setMessage("🎉 Successfully logged in!");
    }
  };

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setStep("phone");
    setToken("");
    setMessage("Logged out.");
  };

  // Authentication screen
  if (step !== "logged_in") {
    return (
      <div
        style={{
          maxWidth: 400,
          margin: "50px auto",
          padding: 24,
          border: "1px solid #333",
          borderRadius: 12,
          textAlign: "center",
          fontFamily: "sans-serif",
        }}
      >
        <h2>🚌 Transit Tracker Auth</h2>

        {message && (
          <p style={{ fontSize: 14, color: "#4ade80" }}>{message}</p>
        )}

        {step === "phone" && (
          <form onSubmit={handleSendOtp}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              style={{
                width: "100%",
                padding: 10,
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            />

            <button type="submit">Send OTP</button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp}>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter OTP"
              style={{
                width: "100%",
                padding: 10,
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            />

            <button type="submit">Verify OTP</button>
          </form>
        )}
      </div>
    );
  }

  // Main Siga application
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 pb-24">
        <Routes>
          <Route path="/" element={<Navigate to="/navigate" replace />} />
          <Route path="/navigate" element={<NavigatePage />} />
          <Route path="/buses" element={<Buses />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>

        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;