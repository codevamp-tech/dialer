import { Moon, Sun } from 'lucide-react';
import useStore from '../../store/useStore';

export function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useStore();

  return (
    <button
      id="theme-toggle"
      onClick={toggleTheme}
      className={`relative p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 ${className}`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-5 h-5">
        <Sun className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
        <Moon className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${theme === 'light' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`} />
      </div>
    </button>
  );
}
