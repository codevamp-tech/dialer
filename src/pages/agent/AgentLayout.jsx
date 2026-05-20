import { Outlet, useLocation, Link } from 'react-router-dom';
import { Phone, List, LogOut, Moon, Sun, User, Bell, Command } from 'lucide-react';
import useStore from '../../store/useStore';

export default function AgentLayout() {
  const { theme, toggleTheme, user, logout } = useStore();
  const location = useLocation();

  const isLogs = location.pathname.includes('/logs');

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Top Nav - Premium Glass Effect */}
      <header className="h-20 flex items-center justify-between px-8 border-b border-border bg-card/30 backdrop-blur-xl z-50 shrink-0 relative">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        
        <div className="flex items-center gap-12">
          {/* Logo Section */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <img src="/logo.png" alt="Vani Logo" className="w-11 h-11 object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-xl" />
            <div className="flex flex-col">
              <span className="font-black text-2xl tracking-tighter leading-none">Vani</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Voice AI</span>
            </div>
          </div>

          {/* Navigation - Segmented Control Style */}
          <nav className="flex items-center gap-1 bg-muted/30 p-1.5 rounded-2xl border border-border/50">
            <Link
              to="/agent"
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                !isLogs 
                  ? 'bg-card shadow-premium text-primary scale-[1.02]' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Phone className={`w-4 h-4 ${!isLogs ? 'animate-pulse' : ''}`} />
              Dialer
            </Link>
            <Link
              to="/agent/logs"
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                isLogs 
                  ? 'bg-card shadow-premium text-primary scale-[1.02]' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <List className="w-4 h-4" />
              Call Logs
            </Link>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button className="p-3 rounded-2xl hover:bg-muted transition-colors text-muted-foreground relative">
              <Bell className="w-5 h-5" />
              <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-3 rounded-2xl hover:bg-muted text-muted-foreground transition-all active:scale-90"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="h-10 w-px bg-border/60" />

          {/* User Profile */}
          <div className="flex items-center gap-4 group">
            <div className="flex flex-col items-end">
              <span className="text-sm font-black leading-none mb-1 group-hover:text-primary transition-colors">{user?.name || 'Agent'}</span>
              <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                <Command className="w-2.5 h-2.5 text-primary" />
                <span className="text-[9px] text-primary uppercase font-black tracking-widest">
                  {user?.role || 'Agent'}
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-muted to-border border-2 border-background flex items-center justify-center text-foreground font-black shadow-lg overflow-hidden group-hover:border-primary/30 transition-all">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-background" />
            </div>
            
            <button
              onClick={logout}
              className="p-3 rounded-2xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all active:scale-90"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Stage */}
      <main className="flex-1 overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  );
}
