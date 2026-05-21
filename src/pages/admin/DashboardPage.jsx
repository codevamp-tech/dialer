import { useEffect } from 'react';
import {
  BarChart3, Phone, Users, Target, TrendingUp,
  Clock, CheckCircle, XCircle, Activity
} from 'lucide-react';
import useStore from '../../store/useStore';
import { Spinner } from '../../components/ui/Spinner';

function StatCard({ label, value, icon: Icon, trend, color = 'primary', delay = 0 }) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  };

  return (
    <div
      className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-border/80 transition-all duration-300 animate-slide-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-black mt-2 text-foreground tracking-tight">{value}</p>
          {trend && (
            <p className="text-xs mt-1.5 flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
              <TrendingUp className="w-3 h-3" /> {trend}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { dashboardStats, statsLoading, fetchDashboardStats, campaigns, fetchCampaigns } = useStore();

  useEffect(() => {
    fetchDashboardStats();
    fetchCampaigns();
  }, []);

  const formatDuration = (secs) => {
    if (!secs) return '0m';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (statsLoading && !dashboardStats) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const stats = dashboardStats || {};

  return (
    <div className="flex-1 overflow-auto bg-background/50 relative">
      <div className="absolute inset-0 bg-grid opacity-15 pointer-events-none" />
      <div className="p-4 md:p-8 relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">Overview of your call center performance.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Campaigns"
            value={stats.totalCampaigns ?? '—'}
            icon={Target}
            color="primary"
            delay={0}
          />
          <StatCard
            label="Active Campaigns"
            value={stats.activeCampaigns ?? '—'}
            icon={Activity}
            color="green"
            delay={50}
          />
          <StatCard
            label="Total Calls"
            value={stats.totalCalls ?? '—'}
            icon={Phone}
            color="blue"
            delay={100}
          />
          <StatCard
            label="Total Talk Time"
            value={formatDuration(stats.totalDuration)}
            icon={Clock}
            color="purple"
            delay={150}
          />
        </div>

        {/* Progress + Campaigns Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Completion overview */}
          <div className="lg:col-span-1 bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Lead Completion</h3>
            <div className="flex flex-col items-center">
              {/* Circular progress */}
              <div className="relative w-36 h-36 mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(stats.completionRate || 0) * 2.64} 264`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-foreground">{stats.completionRate ?? 0}%</span>
                  <span className="text-xs text-muted-foreground font-medium">Complete</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="text-center bg-muted/50 rounded-lg py-2">
                  <p className="text-lg font-bold text-foreground">{stats.completedLeads ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Done</p>
                </div>
                <div className="text-center bg-muted/50 rounded-lg py-2">
                  <p className="text-lg font-bold text-foreground">{(stats.totalLeads ?? 0) - (stats.completedLeads ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent campaigns */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Recent Campaigns</h3>
            {campaigns.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No campaigns yet</p>
                <p className="text-sm mt-1">Create your first campaign to get started.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto scrollbar-thin">
                {campaigns.slice(0, 8).map((campaign) => {
                  const progress = campaign.totalLeads > 0
                    ? Math.round((campaign.completedLeads / campaign.totalLeads) * 100) : 0;
                  const statusColors = {
                    running: 'bg-green-500/10 text-green-600 dark:text-green-400',
                    completed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                    paused: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
                    canceled: 'bg-red-500/10 text-red-600 dark:text-red-400',
                    pending: 'bg-muted text-muted-foreground',
                  };

                  return (
                    <div key={campaign._id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">{campaign.name}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusColors[campaign.status] || statusColors.pending}`}>
                            {campaign.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                            {campaign.completedLeads || 0}/{campaign.totalLeads} leads
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
