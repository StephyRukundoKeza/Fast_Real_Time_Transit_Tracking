function Input({
  value,
  onChange,
  placeholder = "",
  type = "text",
  label,
  disabled = false,
  className = "",
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-medium text-white/70">
          {label}
        </label>
      )}

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-xl border border-white/10 bg-[#10243c] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-[#20d9c2] focus:ring-2 focus:ring-[#20d9c2]/20 ${
          disabled ? "cursor-not-allowed bg-white/5 opacity-60" : ""
        } ${className}`}
      />
    </div>
  );
}

export default Input;