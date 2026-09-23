import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { initiatePayment, pollUntilFinal } from "../lib/payments/paymentService";
import Card from "../components/Card";
import Button from "../components/Button";

function formatTripTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const BANK_OPTIONS = [
  "Bank of Kigali (BK)",
  "I&M Bank Rwanda",
  "Equity Bank Rwanda",
  "Cogebanque",
  "Access Bank",
  "Ecobank Rwanda",
  "Unguka Bank",
];

export default function Payment({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { busId, tripId, routeName, departureTime, seats } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState("momo"); // momo | airtel | bank | applepay
  const [phoneNumber, setPhoneNumber] = useState("+250");
  const [selectedBank, setSelectedBank] = useState(BANK_OPTIONS[0]);
  const [accountNumber, setAccountNumber] = useState("");
  
  const [status, setStatus] = useState("idle"); // idle | processing | failed
  const [errorMessage, setErrorMessage] = useState("");

  const [farePerSeat, setFarePerSeat] = useState(null);
  const [fareLoading, setFareLoading] = useState(true);
  const [fareError, setFareError] = useState("");

  useEffect(() => {
    if (!tripId) {
      setFareLoading(false);
      return;
    }
    let cancelled = false;

    async function loadFare() {
      setFareLoading(true);
      setFareError("");
      const { data, error } = await supabase
        .from("trips")
        .select("route_id, routes(fare_rwf)")
        .eq("id", tripId)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data?.routes?.fare_rwf) {
        setFareError("Could not load fare for this route.");
        setFarePerSeat(null);
      } else {
        setFarePerSeat(data.routes.fare_rwf);
      }
      setFareLoading(false);
    }

    loadFare();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  if (!tripId || !seats || seats.length === 0) {
    return (
      <div className="min-h-screen bg-[#071426] px-5 py-6 text-white flex flex-col items-center justify-center">
        <p className="text-white/60 mb-4">No seats selected to pay for.</p>
        <Button onClick={() => navigate("/buses")}>Back to Buses</Button>
      </div>
    );
  }

  const amount = farePerSeat != null ? farePerSeat * seats.length : null;

  const handlePay = async () => {
    if ((paymentMethod === "momo" || paymentMethod === "airtel") && (!phoneNumber || phoneNumber.replace(/\s/g, "").length < 10)) {
      setErrorMessage("Enter a valid mobile phone number.");
      return;
    }
    if (paymentMethod === "bank" && !accountNumber) {
      setErrorMessage("Enter your bank account number.");
      return;
    }
    if (!user) {
      setErrorMessage("Please log in to pay.");
      return;
    }
    if (amount == null) {
      setErrorMessage("Fare isn't available for this route yet.");
      return;
    }

    setStatus("processing");
    setErrorMessage("");

    const txRef = `SIGA-${tripId.slice(0, 8)}-${Date.now()}`;

    try {
      const initiated = await initiatePayment({
        phoneNumber: paymentMethod === "momo" || paymentMethod === "airtel" ? phoneNumber : accountNumber,
        paymentMethod,
        bankName: paymentMethod === "bank" ? selectedBank : undefined,
        amount,
        currency: "RWF",
        email: user.email || "",
        txRef,
      });

      if (!initiated.success) {
        setStatus("failed");
        setErrorMessage(initiated.message || "Could not start payment.");
        return;
      }

      const final = await pollUntilFinal(initiated.transactionId, { phoneNumber });

      if (!final.success) {
        setStatus("failed");
        setErrorMessage(final.message || "Payment was not successful.");
        return;
      }

      const rows = seats.map((seat) => ({
        trip_id: tripId,
        seat_id: seat.id,
        passenger_id: user.id,
      }));

      const { data: bookingRows, error } = await supabase
        .from("bookings")
        .insert(rows)
        .select("id, seat_id, trip_id, status");

      if (error) {
        setStatus("failed");
        if (error.code === "23505") {
          setErrorMessage(
            `Payment succeeded, but one of those seats was just booked by someone else. Contact support with reference ${txRef} for a refund.`
          );
        } else {
          setErrorMessage(`Payment succeeded, but booking failed: ${error.message}`);
        }
        return;
      }

      const seatIds = seats.map((s) => s.id);
      await supabase
        .from("seats")
        .update({ status: "booked" })
        .in("id", seatIds);

      navigate("/confirm", {
        state: {
          busId,
          routeName,
          departureTime,
          seats,
          bookings: bookingRows,
          amount,
          txRef,
        },
      });
    } catch (err) {
      setStatus("failed");
      setErrorMessage(err.message || "Something went wrong processing payment.");
    }
  };

  return (
    <div className="min-h-screen bg-[#071426] px-5 py-6 text-white pb-24 font-sans">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-xs font-medium text-[#20d9c2] hover:underline"
      >
        ← Back to Seats
      </button>

      <h1 className="mt-1 mb-1 text-2xl font-bold">Payment</h1>
      <p className="mb-6 text-xs text-white/55">
        {routeName} ({busId}){departureTime ? ` · Departs ${formatTripTime(departureTime)}` : ""}
      </p>

      {/* Booking Summary Card */}
      <Card className="p-5 max-w-sm mx-auto mb-4 bg-[#0d1d2d] border border-slate-800 rounded-2xl">
        <p className="text-xs text-white/50 mb-1">Seats</p>
        <p className="mb-3 text-sm font-semibold text-white">
          {seats.map((s) => s.seat_number || s).join(", ")}
        </p>

        <p className="text-xs text-white/50 mb-1">Amount due</p>
        {fareLoading ? (
          <p className="text-sm text-white/50">Loading fare…</p>
        ) : fareError || amount == null ? (
          <p className="text-sm text-red-400">{fareError || "Fare unavailable"}</p>
        ) : (
          <p className="mb-1 text-2xl font-bold text-[#20d9c2]">{amount.toLocaleString()} RWF</p>
        )}
      </Card>

      {/* Payment Selector Card */}
      <Card className="p-5 max-w-sm mx-auto bg-[#0d1d2d] border border-slate-800 rounded-2xl">
        <label className="mb-2 block text-xs font-semibold text-white/70">Select Payment Method</label>
        
        {/* Payment Type Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setPaymentMethod("momo")}
            className={`p-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
              paymentMethod === "momo"
                ? "bg-[#20d9c2]/10 border-[#20d9c2] text-[#20d9c2]"
                : "bg-[#071426] border-white/10 text-white/70 hover:border-white/30"
            }`}
          >
            <span>🟡</span> MTN MoMo
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("airtel")}
            className={`p-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
              paymentMethod === "airtel"
                ? "bg-[#20d9c2]/10 border-[#20d9c2] text-[#20d9c2]"
                : "bg-[#071426] border-white/10 text-white/70 hover:border-white/30"
            }`}
          >
            <span>🔴</span> Airtel Money
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("bank")}
            className={`p-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
              paymentMethod === "bank"
                ? "bg-[#20d9c2]/10 border-[#20d9c2] text-[#20d9c2]"
                : "bg-[#071426] border-white/10 text-white/70 hover:border-white/30"
            }`}
          >
            <span>🏦</span> Bank Transfer
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("applepay")}
            className={`p-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
              paymentMethod === "applepay"
                ? "bg-[#20d9c2]/10 border-[#20d9c2] text-[#20d9c2]"
                : "bg-[#071426] border-white/10 text-white/70 hover:border-white/30"
            }`}
          >
            <span>🍏</span> Apple Pay
          </button>
        </div>

        {/* Dynamic Inputs Based on Selection */}
        {(paymentMethod === "momo" || paymentMethod === "airtel") && (
          <div>
            <label className="mb-1 block text-xs text-white/50">
              {paymentMethod === "momo" ? "MTN MoMo Number" : "Airtel Money Number"}
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={status === "processing"}
              className="mb-4 w-full rounded-lg border border-white/15 bg-[#071426] px-3 py-2 text-sm text-white focus:border-[#20d9c2] focus:outline-none"
              placeholder="+2507XXXXXXXX"
            />
          </div>
        )}

        {paymentMethod === "bank" && (
          <div className="space-y-3 mb-4">
            <div>
              <label className="mb-1 block text-xs text-white/50">Select Bank</label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                disabled={status === "processing"}
                className="w-full rounded-lg border border-white/15 bg-[#071426] px-3 py-2 text-sm text-white focus:border-[#20d9c2] focus:outline-none"
              >
                {BANK_OPTIONS.map((bank) => (
                  <option key={bank} value={bank} className="bg-[#071426] text-white">
                    {bank}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/50">Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                disabled={status === "processing"}
                className="w-full rounded-lg border border-white/15 bg-[#071426] px-3 py-2 text-sm text-white focus:border-[#20d9c2] focus:outline-none"
                placeholder="00010-XXXXXX-XX"
              />
            </div>
          </div>
        )}

        {paymentMethod === "applepay" && (
          <div className="p-3 bg-[#071426] rounded-xl border border-white/10 text-center mb-4 text-xs text-white/70">
            Apple Pay will confirm authorization using Touch ID / Face ID on submission.
          </div>
        )}

        {errorMessage && <p className="mb-3 text-xs text-red-400">{errorMessage}</p>}

        <Button
          onClick={handlePay}
          disabled={status === "processing" || fareLoading || amount == null}
          className="w-full"
        >
          {status === "processing"
            ? "Processing payment…"
            : amount != null
            ? `Pay ${amount.toLocaleString()} RWF`
            : "Fare unavailable"}
        </Button>

        <p className="mt-3 text-center text-[10px] text-white/30">
          Test mode: numbers ending in 0000 simulate a declined transaction.
        </p>
      </Card>
    </div>
  );
}