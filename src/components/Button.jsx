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
    primary: "bg-[#20d9c2] text-[#071426] hover:bg-[#18c5b0]",
    secondary: "bg-white/10 text-white hover:bg-white/15",
    outline: "border border-white/20 text-white hover:bg-white/5",
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