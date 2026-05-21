import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LayoutDashboard, Phone, Target, Bot, Settings, PhoneCall, FileText, Menu } from 'lucide-react';
import { AdminSidebar } from '../../components/layout/AdminSidebar';

const navItems = [
  { href: '/admin',                  icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/campaigns',        icon: Target,          label: 'Campaigns' },
  { href: '/admin/agents',           icon: Bot,             label: 'Agents' },
  { href: '/admin/phone-numbers',    icon: Phone,           label: 'Phone Numbers' },
  { href: '/admin/dialer-call-logs', icon: PhoneCall,       label: 'Dialer Logs' },
  { href: '/admin/call-logs',        icon: FileText,        label: 'AI Call Logs' },
  { href: '/admin/settings',         icon: Settings,        label: 'Settings' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden">
      {/* Mobile Top Header */}
      <header className="md:hidden flex h-16 items-center justify-between px-6 border-b border-border bg-card/30 backdrop-blur-xl z-30 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl bg-card border border-border text-foreground hover:bg-muted transition shadow-sm"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-black text-lg tracking-tight">Admin Portal</span>
        </div>
      </header>

      <AdminSidebar
        navItems={navItems}
        title="Admin Portal"
        icon={LayoutDashboard}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
