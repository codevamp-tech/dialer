import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, User, LayoutDashboard, Zap, Shield, BarChart3 } from 'lucide-react';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import useStore from '../store/useStore';

export default function HomePage() {
  const { isAuthenticated, user } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'agent') navigate('/agent');
    }
  }, [isAuthenticated, user, navigate]);
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top bar */}
      <div className="relative z-10 flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <Phone className="w-5 h-5" />
          Vani Dialer
        </div>
        <ThemeToggle />
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        <div className="text-center space-y-6 max-w-3xl mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase border border-primary/20">
            <Zap className="w-3.5 h-3.5" />
            Vani Dialer Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground leading-[1.05]">
            Smarter Calls.<br />
            <span className="gradient-text">Better Results.</span>
          </h1>

          <p className="text-lg text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed">
            Manage campaigns, connect with leads, and close deals faster with our intelligent call center platform.
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto animate-slide-in-up">
          <Link
            to="/agent"
            id="portal-agent"
            className="group relative flex flex-col items-center gap-5 p-8 bg-card/80 backdrop-blur-sm border border-border rounded-2xl hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300 rotate-3 group-hover:rotate-0">
              <User className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground">Agent Portal</h3>
              <p className="text-muted-foreground text-sm mt-1.5">View scripts, make calls, and log dispositions.</p>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition rounded-b-2xl" />
          </Link>

          <Link
            to="/admin"
            id="portal-admin"
            className="group relative flex flex-col items-center gap-5 p-8 bg-card/80 backdrop-blur-sm border border-border rounded-2xl hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300 -rotate-3 group-hover:rotate-0">
              <LayoutDashboard className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground">Admin Portal</h3>
              <p className="text-muted-foreground text-sm mt-1.5">Manage campaigns, agents, and analytics.</p>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition rounded-b-2xl" />
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-10 animate-fade-in">
          {[
            { icon: Shield, text: 'Atomic Lead Locking' },
            { icon: BarChart3, text: 'Real-time Analytics' },
            { icon: Zap, text: 'SIP Trunk Calling' },
          ].map(({ icon: FIcon, text }) => (
            <div key={text} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground text-xs font-medium border border-border/50">
              <FIcon className="w-3.5 h-3.5" />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-6 text-xs text-muted-foreground">
        © 2026 Vani Dialer. Built for scale.
      </div>
    </div>
  );
}
