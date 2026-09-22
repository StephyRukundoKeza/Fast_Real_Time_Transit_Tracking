import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { initiatePayment, pollUntilFinal } from "../lib/payments/paymentService";
import Card from "../components/Card";
import Button from "../components/Button";
import { isValidRwandaPhone, isValidPaymentAmount, isValidSeatSelection, MAX_SEATS_PER_TRIP } from "../utils/validation";

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

function Payment({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { busId, tripId, routeName, departureTime, seats } = location.state || {};

  const [phoneNumber, setPhoneNumber] = useState("+250");
  const [status, setStatus] = useState("idle"); // idle | processing | failed
  const [errorMessage, setErrorMessage] = useState("");

  // Real fare comes from routes.fare_rwf (set via a researched estimate based
  // on real 2026 Kigali distance-based fare reporting — see tracker note).
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
    if (!isValidRwandaPhone(phoneNumber)) {
      setErrorMessage("Enter a valid Rwanda mobile money number (e.g. +250788123456).");
      return;
    }
    if (!user) {
      setErrorMessage("Please log in to pay.");
      return;
    }
    if (!isValidPaymentAmount(amount)) {
      setErrorMessage("Fare isn't available for this route yet.");
      return;
    }
    if (!isValidSeatSelection(seats.length, MAX_SEATS_PER_TRIP)) {
      setErrorMessage(`You can only book between 1 and ${MAX_SEATS_PER_TRIP} seats at a time.`);
      return;
    }

    setStatus("processing");
    setErrorMessage("");

    const txRef = `SIGA-${tripId.slice(0, 8)}-${Date.now()}`;

    try {
      const initiated = await initiatePayment({
        phoneNumber,
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

      // Payment succeeded — only now do we actually book the seats.
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
    <div className="min-h-screen bg-[#071426] px-5 py-6 text-white pb-24">
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

      <Card className="p-5 max-w-sm mx-auto mb-4">
        <p className="text-xs text-white/50 mb-1">Seats</p>
        <p className="mb-3 text-sm font-semibold">
          {seats.map((s) => s.seat_number).join(", ")}
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

      <Card className="p-5 max-w-sm mx-auto">
        <label className="mb-1 block text-xs text-white/50">Mobile Money Number</label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          disabled={status === "processing"}
          className="mb-4 w-full rounded-lg border border-white/15 bg-[#071426] px-3 py-2 text-sm text-white focus:border-[#20d9c2] focus:outline-none"
          placeholder="+2507XXXXXXXX"
        />

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
          Test mode: a phone number ending in 0000 simulates a declined payment.
        </p>
      </Card>
    </div>
  );
}

export default Payment;