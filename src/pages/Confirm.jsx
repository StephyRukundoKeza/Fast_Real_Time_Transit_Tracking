import { useNavigate, useLocation } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
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

function Confirm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { busId, routeName, departureTime, seats, bookings, amount, txRef } = location.state || {};

  if (!bookings || bookings.length === 0) {
    return (
      <div className="min-h-screen bg-[#071426] px-5 py-6 text-white flex flex-col items-center justify-center">
        <p className="text-white/60 mb-4">No booking to show.</p>
        <Button onClick={() => navigate("/navigate")}>Go Home</Button>
      </div>
    );
  }

  const qrValue = JSON.stringify({
    ref: txRef,
    bookingIds: bookings.map((b) => b.id),
  });

  return (
    <div className="min-h-screen bg-[#071426] px-5 py-6 text-white flex flex-col items-center pt-16">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#20d9c2]/15">
        <span className="text-3xl">✓</span>
      </div>
      <h1 className="mb-1 text-2xl font-bold">Booking Confirmed</h1>
      <p className="mb-6 text-xs text-white/55">
        {routeName} ({busId}){departureTime ? ` · Departs ${formatTripTime(departureTime)}` : ""}
      </p>

      <Card className="p-5 w-full max-w-sm mb-6">
        <div className="mb-3 flex justify-between text-sm">
          <span className="text-white/50">Seats</span>
          <span className="font-semibold">{seats?.map((s) => s.seat_number).join(", ")}</span>
        </div>
        <div className="mb-3 flex justify-between text-sm">
          <span className="text-white/50">Amount Paid</span>
          <span className="font-semibold text-[#20d9c2]">{amount?.toLocaleString()} RWF</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/50">Reference</span>
          <span className="font-mono text-xs">{txRef}</span>
        </div>
      </Card>

      <Card className="p-5 w-full max-w-sm mb-6 flex flex-col items-center">
        <p className="mb-3 text-xs uppercase tracking-wide text-white/40">
          Show this to the conductor
        </p>
        <div className="rounded-xl bg-white p-3">
          <QRCodeSVG value={qrValue} size={168} />
        </div>
      </Card>

      <div className="w-full max-w-sm space-y-2">
        <Button onClick={() => navigate("/history")} className="w-full">
          View My Bookings
        </Button>
        <button
          type="button"
          onClick={() => navigate("/navigate")}
          className="w-full rounded-xl border border-white/15 py-3 text-sm text-white/80 hover:border-[#20d9c2] transition"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default Confirm;