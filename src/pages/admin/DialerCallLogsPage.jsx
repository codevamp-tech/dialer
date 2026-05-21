import { useEffect, useState } from 'react';
import { Phone, Clock, User, Filter, Eye } from 'lucide-react';
import useStore from '../../store/useStore';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { DialerCallDetailModal } from '../../components/call/DialerCallDetailModal';

const DISPOSITIONS = ['All', 'Interested', 'Not Interested', 'Follow Up', 'No Answer', 'Busy', 'Wrong Number'];

const dispositionVariant = {
  'Interested': 'success',
  'Follow Up': 'warning',
  'Not Interested': 'error',
  'No Answer': 'default',
  'Busy': 'default',
  'Wrong Number': 'default',
  'Skipped': 'default',
};

export default function DialerCallLogsPage() {
  const { dialerCallLogs, dialerCallLogsTotal, dialerCallLogsLoading, fetchDialerCallLogs } = useStore();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ disposition: '' });
  const [selectedCallId, setSelectedCallId] = useState(null);
  const limit = 25;

  useEffect(() => {
    const f = {};
    if (filters.disposition && filters.disposition !== 'All') f.disposition = filters.disposition;
    fetchDialerCallLogs(page, limit, f);
  }, [page, filters]);

  const fmt = (secs) => {
    if (!secs || secs === 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const totalPages = Math.ceil(dialerCallLogsTotal / limit);

  return (
    <div className="flex-1 overflow-auto bg-background/50 relative">
      <div className="absolute inset-0 bg-grid opacity-15 pointer-events-none" />
      <div className="p-4 md:p-8 relative z-10 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Dialer Call Logs</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {dialerCallLogsTotal > 0
                ? `${dialerCallLogsTotal} total calls · click any row to view recording & transcript`
                : 'Calls made by human agents via the Dialer.'}
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filters.disposition}
              onChange={e => { setFilters(p => ({ ...p, disposition: e.target.value })); setPage(1); }}
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            >
              {DISPOSITIONS.map(d => <option key={d} value={d === 'All' ? '' : d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        {dialerCallLogsLoading && dialerCallLogs.length === 0 ? (
          <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
        ) : dialerCallLogs.length === 0 ? (
          <EmptyState icon={Phone} title="No calls yet" description="Once agents start making calls, they'll appear here." />
        ) : (
          <>
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agent</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">SIP Line</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Campaign</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Disposition</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dialerCallLogs.map((call, idx) => (
                    <tr
                      key={call._id || idx}
                      onClick={() => setSelectedCallId(call._id)}
                      className="hover:bg-muted/20 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-xs">{call.humanAgentId?.name || 'Unknown Agent'}</p>
                            <p className="text-[10px] text-muted-foreground">{call.humanAgentId?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-foreground">{call.customerName || '—'}</p>
                        <p className="text-xs font-mono text-muted-foreground">{call.to}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-medium text-foreground">{call.phoneNumberId?.name || '—'}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">{call.phoneNumberId?.number}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs text-foreground">
                          {call.campaignId?.name || <span className="text-muted-foreground">—</span>}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs font-mono text-foreground">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          {fmt(call.durationSeconds)}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {call.disposition ? (
                          <Badge variant={dispositionVariant[call.disposition] || 'default'}>
                            {call.disposition}
                          </Badge>
                        ) : (
                          <Badge variant="default">{call.status || 'unknown'}</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                        {fmtDate(call.startedAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-primary/10 text-primary">
                          <Eye className="w-3.5 h-3.5" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages} ({dialerCallLogsTotal} total)
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs font-bold bg-muted rounded-lg disabled:opacity-40 hover:bg-muted/80 transition">← Prev</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-xs font-bold bg-muted rounded-lg disabled:opacity-40 hover:bg-muted/80 transition">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Call Detail Slide-over */}
      {selectedCallId && (
        <DialerCallDetailModal
          callId={selectedCallId}
          onClose={() => setSelectedCallId(null)}
        />
      )}
    </div>
  );
}
