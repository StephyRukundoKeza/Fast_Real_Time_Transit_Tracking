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
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
          disabled ? "cursor-not-allowed bg-gray-100 opacity-60" : ""
        } ${className}`}
      />
    </div>
  );
}

export default Input;