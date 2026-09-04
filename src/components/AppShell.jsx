import { NavLink, Outlet } from 'react-router-dom';

function AppShell() {
  const navItems = [
    {
      name: 'Navigate',
      path: '/navigate',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-6 h-6"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M15 9l-2 5-5 2 2-5 5-2z" />
        </svg>
      ),
    },
    {
      name: 'Buses',
      path: '/buses',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-6 h-6"
        >
          <path d="M6 17h12" />
          <path d="M5 17V7c0-2 2-3 7-3s7 1 7 3v10" />
          <path d="M5 10h14" />
          <circle cx="8" cy="17" r="1.5" />
          <circle cx="16" cy="17" r="1.5" />
        </svg>
      ),
    },
    {
      name: 'History',
      path: '/history',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-6 h-6"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      ),
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-6 h-6"
        >
          <circle cx="12" cy="8" r="3" />
          <path d="M5 20c1.5-4 4-6 7-6s5.5 2 7 6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="border-t border-slate-700 bg-brand-dark px-4 py-3">
        <div className="flex justify-around">

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-xs transition-colors ${
                  isActive
                    ? 'font-semibold text-brand-accent'
                    : 'text-gray-400'
                }`
              }
            >
              {item.icon}

              <span>
                {item.name}
              </span>
            </NavLink>
          ))}

        </div>
      </nav>

    </div>
  );
}

export default AppShell;