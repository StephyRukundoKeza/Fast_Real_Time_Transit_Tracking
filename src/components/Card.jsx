// src/components/Card.jsx
import React from 'react';

function Card({ children, className = "", onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-white/5 bg-[#10243c] p-4 text-white shadow-none ${
        onClick ? "cursor-pointer transition hover:border-white/15 hover:bg-[#142d4a]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;