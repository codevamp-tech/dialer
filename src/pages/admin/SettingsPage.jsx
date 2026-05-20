import { useState } from 'react';
import { Globe, Key, Bell, Shield, Save, Server } from 'lucide-react';
import useStore, { API_BASE } from '../../store/useStore';
import { toast } from '../../components/ui/Toast';

export default function SettingsPage() {
  const { theme, toggleTheme } = useStore();
  const [apiBase, setApiBase] = useState(API_BASE);

  return (
    <div className="flex-1 overflow-auto bg-background/50 relative">
      <div className="absolute inset-0 bg-grid opacity-15 pointer-events-none" />
      <div className="p-8 relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">Configure your dialer application preferences.</p>
        </div>

        <div className="space-y-6">
          {/* Appearance */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-primary" />
              Appearance
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground mt-0.5">Toggle between light and dark theme.</p>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                  theme === 'dark' ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Server Connection */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
              <Server className="w-4 h-4 text-primary" />
              Server Connection
            </h3>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">API Base URL</label>
              <input
                type="text"
                value={apiBase}
                onChange={(e) => setApiBase(e.target.value)}
                className="w-full bg-background border border-border px-4 py-2.5 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground text-sm font-mono transition"
              />
              <p className="text-xs text-muted-foreground mt-1">The backend agent-server URL configured in your environment.</p>
            </div>
          </div>

          {/* Security */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-primary" />
              Security
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Auth Token</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Your current session token.</p>
                </div>
                <span className="text-xs font-mono text-muted-foreground bg-muted px-3 py-1 rounded-lg">
                  {localStorage.getItem('token') ? '••••••••' + localStorage.getItem('token').slice(-8) : 'Not logged in'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">WebSocket</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Manual call audio bridge endpoint.</p>
                </div>
                <span className="text-xs font-mono text-muted-foreground bg-muted px-3 py-1 rounded-lg">
                  ws://localhost:3000/ws/manual-call
                </span>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
              <Key className="w-4 h-4 text-primary" />
              About
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">App Version</span>
                <span className="text-foreground font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stack</span>
                <span className="text-foreground font-medium">Vite + React + Tailwind</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Backend</span>
                <span className="text-foreground font-medium">Node.js + Express + MongoDB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
