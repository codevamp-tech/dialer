import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import useStore from '../../store/useStore';
import { X } from 'lucide-react';

export function AdminSidebar({ navItems, title, icon: Icon, isOpen, onClose }) {
  const location = useLocation();
  const { logout } = useStore();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`fixed inset-y-0 left-0 w-[260px] h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 z-50 md:z-10 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-5 border-b border-sidebar-border flex justify-between items-center">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2.5">
            {Icon && <Icon className="w-5 h-5" />}
            {title}
          </h2>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <button
              type="button"
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
                onClick={() => { if (onClose) onClose(); }}
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
            onClick={() => { if (onClose) onClose(); }}
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
    </>
  );
}
