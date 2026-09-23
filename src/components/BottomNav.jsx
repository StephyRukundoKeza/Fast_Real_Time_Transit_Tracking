import { NavLink } from "react-router-dom";

function BottomNav() {
  const navItems = [
    {
      name: "Navigate",
      path: "/navigate",
      icon: "🧭",
    },
    {
      name: "Buses",
      path: "/buses",
      icon: "🚌",
    },
    {
      name: "History",
      path: "/history",
      icon: "◷",
    },
    {
      name: "Profile",
      path: "/profile",
      icon: "♙",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#102c4b]">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex min-w-[70px] flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-medium transition ${
                isActive
                  ? "text-[#20d9c2]"
                  : "text-white/45 hover:text-white/70"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`text-lg leading-none transition ${
                    isActive ? "scale-105" : ""
                  }`}
                >
                  {item.icon}
                </span>

                <span>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default BottomNav;