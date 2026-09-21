function OtpVerification({
  phone,
  token,
  setToken,
  onSubmit,
  onBack,
  message,
}) {
  return (
    <div className="min-h-screen bg-[#071426] flex items-center justify-center px-6 text-white">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="mb-10 text-sm font-medium text-white/60 hover:text-white"
        >
          ← Change phone number
        </button>

        {/* Heading */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-[#20d9c2] flex items-center justify-center text-[#071426] text-2xl font-bold">
            S
          </div>

          <h1 className="text-3xl font-bold text-white">
            Verify your number
          </h1>

          <p className="mt-3 text-white/55">
            Enter the verification code sent to
          </p>

          <p className="mt-1 font-semibold text-white">
            {phone}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="otp"
              className="block text-sm font-medium text-white/70 mb-2"
            >
              Verification code
            </label>

            <input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={token}
              onChange={(e) =>
                setToken(e.target.value.replace(/\D/g, ""))
              }
              placeholder="000000"
              className="w-full rounded-xl border border-white/10 bg-[#10243c] px-4 py-3 text-center text-2xl tracking-[0.5em] text-white outline-none focus:border-[#20d9c2] focus:ring-2 focus:ring-[#20d9c2]/20"
              required
            />
          </div>

          {message && (
            <p className="text-sm text-center text-white/70">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={token.length !== 6}
            className="w-full rounded-xl bg-[#20d9c2] py-3.5 text-[#071426] font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#18c5b0] transition"
          >
            Verify code
          </button>
        </form>

        <p className="text-sm text-center text-white/40 mt-6">
          Didn't receive a code? You can request another one later.
        </p>
      </div>
    </div>
  );
}

export default OtpVerification;