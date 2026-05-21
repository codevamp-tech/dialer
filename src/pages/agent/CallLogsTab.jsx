import { useEffect, useState } from 'react';
import useStore from '../../store/useStore';
import { Spinner } from '../../components/ui/Spinner';
import { Clock, PhoneOutgoing, Calendar, Search, FileText, Filter, Download, ChevronRight } from 'lucide-react';
import CallDetailModal from '../../components/call/CallDetailModal';
import { format } from 'date-fns';

export default function CallLogsTab() {
  const { dialerCallLogs, fetchDialerCallLogs, dialerCallLogsLoading, user } = useStore();
  const [selectedCall, setSelectedCall] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?._id) {
      fetchDialerCallLogs(1, 50, { humanAgentId: user._id });
    } else {
      fetchDialerCallLogs(1, 50);
    }
  }, [user]);

  const formatDuration = (secs) => {
    if (!secs) return '00:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getDispositionStyles = (disp) => {
    switch (disp) {
      case 'Interested': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Not Interested': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Follow Up':
      case 'Call Back': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'No Answer': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-muted/50 text-muted-foreground border-border/50';
    }
  };

  const filteredLogs = dialerCallLogs.filter(log => {
    const term = searchTerm.toLowerCase();
    const customer = (log.customerName || '').toLowerCase();
    const phone = (log.to || '').toLowerCase();
    return customer.includes(term) || phone.includes(term);
  });

  return (
    <div className="h-full flex flex-col bg-background p-4 md:p-8 overflow-hidden relative">
      <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none" />
      
      <div className="max-w-7xl w-full mx-auto flex flex-col h-full z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 md:mb-8 animate-slide-in-up">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground">Call Archives</h1>
            <p className="text-muted-foreground font-medium mt-1 text-sm md:text-base">Review and manage your telecalling performance</p>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative group flex-1 md:flex-none">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search by name or number..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-6 py-3 bg-card border border-border rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary/50 outline-none transition-all w-full md:w-80 shadow-premium"
              />
            </div>
            <button className="p-3 bg-card border border-border rounded-2xl hover:bg-muted transition-colors shadow-premium shrink-0">
              <Filter className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="p-3 bg-primary text-white rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-primary/20 shrink-0">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Table Container */}
        <div className="flex-1 bg-card/60 backdrop-blur-xl border border-border rounded-2xl md:rounded-[32px] overflow-hidden flex flex-col shadow-premium animate-fade-in delay-75">
          <div className="flex-1 overflow-auto scrollbar-thin relative">
            {dialerCallLogsLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 rounded-[32px] bg-muted/30 flex items-center justify-center mb-6">
                  <FileText className="w-10 h-10 text-muted-foreground opacity-20" />
                </div>
                <h3 className="text-xl font-bold">No calls found</h3>
                <p className="text-muted-foreground max-w-xs mt-2 font-medium">Try adjusting your search terms or start a new calling session.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-4 md:px-8 py-3 md:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Customer</th>
                    <th className="px-4 md:px-8 py-3 md:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Contact</th>
                    <th className="px-4 md:px-8 py-3 md:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hidden md:table-cell">Timestamp</th>
                    <th className="px-4 md:px-8 py-3 md:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hidden sm:table-cell">Duration</th>
                    <th className="px-4 md:px-8 py-3 md:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Outcome</th>
                    <th className="px-4 md:px-8 py-3 md:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hidden sm:table-cell"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredLogs.map((log) => (
                    <tr 
                      key={log._id} 
                      onClick={() => setSelectedCall(log)}
                      className="group hover:bg-primary/[0.02] cursor-pointer transition-all duration-300"
                    >
                      <td className="px-4 md:px-8 py-3 md:py-5">
                        <div className="flex items-center gap-2 md:gap-4">
                          <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-muted to-border border-2 border-background flex items-center justify-center text-foreground font-black text-sm md:text-lg shadow-sm group-hover:scale-110 transition-transform shrink-0">
                            {(log.customerName || log.to).charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-foreground group-hover:text-primary transition-colors text-xs md:text-base truncate max-w-[100px] md:max-w-none">{log.customerName || 'Unknown Lead'}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-8 py-3 md:py-5">
                        <div className="flex flex-col">
                          <span className="text-xs md:text-sm font-bold font-mono tracking-tighter text-foreground/80">{log.to}</span>
                          <span className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Outbound</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-8 py-3 md:py-5 hidden md:table-cell">
                        <div className="flex flex-col">
                          <span className="text-xs md:text-sm font-bold text-foreground/80">{format(new Date(log.createdAt), 'MMM d, yyyy')}</span>
                          <span className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{format(new Date(log.createdAt), 'h:mm a')}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-8 py-3 md:py-5 hidden sm:table-cell">
                        <div className="flex items-center gap-2 text-xs md:text-sm font-black text-foreground/70">
                          <Clock className="w-3.5 h-3.5 text-primary/60" />
                          {formatDuration(log.durationSeconds)}
                        </div>
                      </td>
                      <td className="px-4 md:px-8 py-3 md:py-5">
                        <div className="flex justify-center">
                          <span className={`px-2 md:px-4 py-1 md:py-1.5 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest border shadow-sm ${getDispositionStyles(log.disposition || log.status)}`}>
                            {log.disposition || log.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 md:px-8 py-3 md:py-5 text-right hidden sm:table-cell">
                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <ChevronRight className="w-5 h-5" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Footer Stats */}
          {!dialerCallLogsLoading && filteredLogs.length > 0 && (
            <div className="px-4 md:px-8 py-4 bg-muted/20 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <span>Showing {filteredLogs.length} recent interactions</span>
              <div className="flex gap-4 sm:gap-6">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" /> 
                  {filteredLogs.filter(l => l.disposition === 'Interested').length} Hot Leads
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" /> 
                  {Math.round(filteredLogs.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0) / 60)} Mins Total
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedCall && (
        <CallDetailModal call={selectedCall} onClose={() => setSelectedCall(null)} />
      )}
    </div>
  );
}
