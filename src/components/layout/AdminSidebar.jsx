import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import useStore from '../../store/useStore';

export function AdminSidebar({ navItems, title, icon: Icon }) {
  const location = useLocation();
  const { logout } = useStore();

  return (
    <div className="w-[260px] h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 z-10">
      {/* Header */}
      <div className="px-5 py-5 border-b border-sidebar-border flex justify-between items-center">
        <h2 className="text-lg font-bold text-primary flex items-center gap-2.5">
          {Icon && <Icon className="w-5 h-5" />}
          {title}
        </h2>
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const ItemIcon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <ItemIcon className="w-[18px] h-[18px]" />
              {item.label}
              {item.badge && (
                <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border flex justify-between items-center">
        <Link
          to="/"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
        >
          ← Home
        </Link>
        <button
          onClick={logout}
          className="text-sm font-medium text-red-500 hover:text-red-400 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
