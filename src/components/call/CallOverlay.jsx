import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Phone, Volume2, Shield, Signal, Activity, AlertTriangle } from 'lucide-react';

/* ─── Animated waveform bars ─────────────────────────────────────────────── */
function WaveformBars({ active, color = 'bg-primary' }) {
  return (
    <div className="flex items-center gap-[4px] h-12">
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className={`w-[4px] rounded-full transition-all duration-300 ${active ? color : 'bg-muted'}`}
          style={{
            height: active ? `${Math.random() * 80 + 20}%` : '15%',
            animation: active ? `wave ${0.5 + Math.random() * 0.5}s ease-in-out infinite alternate` : 'none',
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          from { height: 15%; opacity: 0.5; }
          to   { height: 100%; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ─── Pulse rings ─────────────────────────────────────────────────────────── */
function PulseRings({ status }) {
  if (status !== 'connecting' && status !== 'ringing' && status !== 'live') return null;
  const colorClass = status === 'live' ? 'border-green-500/20' : 'border-primary/20';
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          className={`absolute rounded-full border ${colorClass}`}
          style={{
            width: `${120 + i * 80}px`,
            height: `${120 + i * 80}px`,
            animation: `ping-extra-slow ${3 + i * 0.5}s ease-out infinite`,
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes ping-extra-slow {
          0%   { transform: scale(0.7); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ─── Main Overlay ─────────────────────────────────────────────────────────── */
export function CallOverlay({ call, contact, script, onMuteToggle, onEndCall }) {
  const { status, duration, isMuted, error } = call;
  const [bars, setBars] = useState([]);

  useEffect(() => {
    if (status !== 'live') return;
    const interval = setInterval(() => {
      setBars(Array.from({ length: 20 }, () => Math.random() * 80 + 20));
    }, 120);
    return () => clearInterval(interval);
  }, [status]);

  const fmt = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const statusConfig = {
    connecting: { label: 'Securing Line...', color: 'text-yellow-500', bg: 'bg-yellow-500/10', dot: 'bg-yellow-500 animate-pulse', icon: Shield },
    ringing:    { label: 'Ringing...', color: 'text-blue-500', bg: 'bg-blue-500/10', dot: 'bg-blue-500 animate-pulse', icon: Signal },
    live:       { label: `Connected · ${fmt(duration)}`, color: 'text-green-500', bg: 'bg-green-500/10', dot: 'bg-green-500 animate-pulse', icon: Activity },
    ending:     { label: 'Ending...', color: 'text-orange-500', bg: 'bg-orange-500/10', dot: 'bg-orange-500', icon: PhoneOff },
    ended:      { label: 'Call Ended', color: 'text-muted-foreground', bg: 'bg-muted/30', dot: 'bg-muted-foreground', icon: PhoneOff },
  };
  const cfg = statusConfig[status] || statusConfig.ended;
  const StatusIcon = cfg.icon;

  const initials = contact?.name
    ? contact.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '#';

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 relative">
      {/* Immersive background glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] blur-[120px] rounded-full opacity-20 pointer-events-none transition-colors duration-1000 ${
        status === 'live' ? 'bg-green-500' : 'bg-primary'
      }`} />

      {/* ─── Central Call Card ─────────────────────────────── */}
      <div className="relative w-full max-w-lg flex flex-col items-center z-10">
        
        <div className="relative mb-12">
          <PulseRings status={status} />
          
          {/* Main Avatar Stage */}
          <div className="relative group">
            <div className={`
              w-32 h-32 rounded-[40px] flex items-center justify-center text-4xl font-black text-white shadow-2xl transition-all duration-700 transform group-hover:scale-105
              ${status === 'live' 
                ? 'bg-gradient-to-br from-green-400 to-emerald-600 shadow-green-500/40 rotate-3' 
                : 'bg-gradient-to-br from-primary to-purple-600 shadow-primary/40 -rotate-3'}
            `}>
              {initials}
            </div>
            
            {/* Live indicator badge on avatar */}
            {status === 'live' && (
              <div className="absolute -top-3 -right-3 w-10 h-10 rounded-2xl bg-white dark:bg-card border-4 border-background flex items-center justify-center shadow-lg animate-bounce">
                <Volume2 className="w-5 h-5 text-green-500" />
              </div>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-foreground">
            {contact?.name || 'Unknown Contact'}
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className="px-3 py-1 rounded-full bg-muted/50 text-xs font-mono font-bold text-muted-foreground tracking-widest uppercase">
              {contact?.number}
            </span>
          </div>
        </div>

        {/* Dynamic Status Badge */}
        <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border ${cfg.bg} border-white/5 backdrop-blur-xl transition-all duration-500 mb-10`}>
          <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
          <span className={`text-sm font-black uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
        </div>

        {/* Waveform Visualization */}
        <div className="w-full flex items-center justify-center gap-1.5 h-16 mb-12">
          {Array.from({ length: 32 }).map((_, i) => {
            const height = status === 'live'
              ? `${(bars[i % bars.length] || 20)}%`
              : (status === 'connecting' || status === 'ringing')
                ? `${Math.sin(Date.now() / 200 + i) * 20 + 30}%`
                : '10%';
            return (
              <div
                key={i}
                className={`w-[4px] rounded-full transition-all duration-150 ${
                  status === 'live' ? 'bg-green-500' : (status === 'connecting' || status === 'ringing') ? 'bg-primary/40' : 'bg-muted'
                }`}
                style={{ height, minHeight: '6px' }}
              />
            );
          })}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm font-bold flex items-center gap-3 animate-shake">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* ─── Control Actions ──────────────────────────────── */}
        {(status === 'live' || status === 'connecting' || status === 'ringing') && (
          <div className="flex items-center gap-8">
            {/* Mute Button */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={onMuteToggle}
                className={`
                  w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-300 transform active:scale-90
                  ${isMuted
                    ? 'bg-yellow-500 text-black shadow-xl shadow-yellow-500/30 ring-4 ring-yellow-500/20'
                    : 'bg-card border-2 border-border text-foreground hover:bg-muted hover:border-border/50'}
                `}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {isMuted ? 'Unmute' : 'Mute'}
              </span>
            </div>

            {/* End Call Button */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={onEndCall}
                className="w-24 h-24 rounded-[36px] bg-red-500 text-white flex items-center justify-center shadow-2xl shadow-red-500/40 hover:bg-red-600 hover:scale-110 active:scale-95 transition-all duration-300"
              >
                <PhoneOff className="w-10 h-10" />
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-500">
                End Call
              </span>
            </div>

            {/* Speaker Toggle (Placeholder UI) */}
            <div className="flex flex-col items-center gap-3">
              <button className="w-16 h-16 rounded-3xl bg-card border-2 border-border text-muted-foreground flex items-center justify-center opacity-50 cursor-not-allowed">
                <Volume2 className="w-6 h-6" />
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                Speaker
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Mini Script Hint (if available) */}
      {script && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-4 opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Quick Script Hint</p>
          <p className="text-xs line-clamp-2 italic">"{script}"</p>
        </div>
      )}

      <style>{`
        @keyframes wave {
          0% { height: 20%; }
          50% { height: 100%; }
          100% { height: 20%; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
}
