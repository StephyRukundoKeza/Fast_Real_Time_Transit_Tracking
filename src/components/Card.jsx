function Card({ children, className = "", onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-white p-4 shadow-sm ${onClick ? "cursor-pointer transition hover:shadow-md" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;