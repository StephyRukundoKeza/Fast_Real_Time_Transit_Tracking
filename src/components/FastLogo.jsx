export function FastLogo({ className = "h-10 w-auto" }) {
  return (
    <img 
      src="/fast-logo.png" 
      alt="FAST Logo" 
      className={className}
      onError={(e) => {
        console.error("Image failed to load:", e.target.src);
      }}
    />
  );
}