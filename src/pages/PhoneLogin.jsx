function PhoneLogin({ phone, setPhone, onSubmit, message }) {
  return (
    <div className="min-h-screen bg-[#071426] flex items-center justify-center px-6 text-white">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-[#20d9c2] flex items-center justify-center text-[#071426] text-2xl font-bold">
            S
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Welcome to Siga
          </h1>

          <p className="mt-3 text-white/55">
            Enter your phone number to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-white/70 mb-2"
            >
              Phone number
            </label>

            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+250 7XX XXX XXX"
              className="w-full rounded-xl border border-white/10 bg-[#10243c] px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-[#20d9c2] focus:ring-2 focus:ring-[#20d9c2]/20"
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
            className="w-full rounded-xl bg-[#20d9c2] py-3.5 text-[#071426] font-semibold hover:bg-[#18c5b0] transition"
          >
            Continue
          </button>
        </form>

        <p className="text-xs text-white/40 text-center mt-8">
          By continuing, you agree to use Siga responsibly.
        </p>
      </div>
    </div>
  );
}

export default PhoneLogin;