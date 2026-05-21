import { useEffect, useState } from 'react';
import {
  Phone, Search, Clock, ArrowUpDown,
  ChevronLeft, ChevronRight, ExternalLink
} from 'lucide-react';
import useStore from '../../store/useStore';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';

export default function CallLogsPage() {
  const { callLogs, callLogsTotal, callLogsLoading, fetchCallLogs } = useStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 20;

  useEffect(() => {
    fetchCallLogs(page, limit, { q: search, status: statusFilter });
  }, [page, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCallLogs(1, limit, { q: search, status: statusFilter });
  };

  const formatDuration = (secs) => {
    if (!secs) return '—';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const formatTime = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(callLogsTotal / limit);

  const statusVariants = {
    completed: 'success',
    ended: 'success',
    'in-progress': 'warning',
    initiated: 'primary',
    ringing: 'primary',
    failed: 'destructive',
  };

  return (
    <div className="flex-1 overflow-auto bg-background/50 relative">
      <div className="absolute inset-0 bg-grid opacity-15 pointer-events-none" />
      <div className="p-4 md:p-8 relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Call Logs</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            View all call records. {callLogsTotal > 0 && `(${callLogsTotal} total)`}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          <form onSubmit={handleSearch} className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              id="input-search-calls"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by phone number..."
              className="w-full bg-card border border-border pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground text-sm transition"
            />
          </form>
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full sm:w-auto bg-card border border-border px-4 py-2.5 rounded-xl outline-none focus:border-primary text-foreground text-sm font-medium"
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="ended">Ended</option>
            <option value="in-progress">In Progress</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Call logs table */}
        {callLogsLoading && callLogs.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : callLogs.length === 0 ? (
          <EmptyState
            icon={Phone}
            title="No call logs found"
            description={search || statusFilter ? 'Try different filters.' : 'Calls will appear here once agents start making calls.'}
          />
        ) : (
          <>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agent</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Campaign</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {callLogs.map((call, idx) => (
                      <tr
                        key={call._id}
                        className="border-b border-border/50 hover:bg-muted/20 transition animate-slide-in-up"
                        style={{ animationDelay: `${idx * 20}ms` }}
                      >
                        <td className="px-4 py-3 font-mono text-foreground font-medium">
                          {call.customer?.number || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={call.type === 'outbound' ? 'primary' : 'default'}>
                            {call.type || '—'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusVariants[call.status] || 'default'} dot>
                            {call.status || '—'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(call.durationSeconds)}
                        </td>
                        <td className="px-4 py-3 text-foreground text-xs">{call.agentName || '—'}</td>
                        <td className="px-4 py-3 text-foreground text-xs truncate max-w-[150px]">{call.campaignName || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                          {formatTime(call.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} ({callLogsTotal} calls)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-2 rounded-lg bg-card border border-border text-sm font-medium hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-2 rounded-lg bg-card border border-border text-sm font-medium hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
