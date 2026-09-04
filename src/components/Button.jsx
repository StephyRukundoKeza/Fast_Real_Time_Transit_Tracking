function Button({
  children,
  onClick,
  variant = "primary",
  size = "medium",
  type = "button",
  disabled = false,
  className = "",
}) {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    outline:
      "border border-gray-200 bg-white text-gray-800 hover:bg-gray-50",
  };

  const sizes = {
    small: "px-3 py-2 text-sm",
    medium: "px-4 py-3 text-sm",
    large: "px-5 py-3.5 text-base",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-xl font-semibold transition ${variants[variant]} ${sizes[size]} ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;