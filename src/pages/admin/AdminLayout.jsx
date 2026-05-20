import { Outlet } from 'react-router-dom';
import { LayoutDashboard, Phone, Target, Bot, Settings, PhoneCall, FileText } from 'lucide-react';
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
  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar
        navItems={navItems}
        title="Admin Portal"
        icon={LayoutDashboard}
      />
      <Outlet />
    </div>
  );
}
