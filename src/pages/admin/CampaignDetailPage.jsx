import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Target, Download, Pause, Play, XCircle,
  Phone, CheckCircle, Clock, AlertCircle, FileText, Users
} from 'lucide-react';
import useStore, { api, API_BASE } from '../../store/useStore';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { toast } from '../../components/ui/Toast';
import axios from 'axios';

export default function CampaignDetailPage() {
  const { id } = useParams();
  const { campaignDetail, campaignDetailLoading, fetchCampaignDetail } = useStore();
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [controlling, setControlling] = useState(false);

  useEffect(() => {
    fetchCampaignDetail(id);
    loadLeads();
  }, [id]);

  const loadLeads = async () => {
    setLeadsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/campaigns/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads([...(res.data.leads || []), ...(res.data.recentLeads || [])]);
    } catch {
      // Try dialer leads endpoint as fallback
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  };

  const handleControl = async (action) => {
    setControlling(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/api/campaigns/${id}/control`, { action }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Campaign ${action}d successfully`);
      fetchCampaignDetail(id);
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${action} campaign`);
    } finally {
      setControlling(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/campaigns/${id}/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign_export.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Campaign exported as CSV');
    } catch {
      toast.error('Failed to export campaign');
    }
  };

  const campaign = campaignDetail;

  if (campaignDetailLoading && !campaign) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="text-foreground font-semibold">Campaign not found</p>
          <Link to="/admin/campaigns" className="text-primary text-sm mt-2 inline-block hover:underline">← Back to Campaigns</Link>
        </div>
      </div>
    );
  }

  const progress = campaign.totalLeads > 0
    ? Math.round(((campaign.completedLeads || 0) / campaign.totalLeads) * 100) : 0;

  const statusVariants = {
    pending: 'default', running: 'success', paused: 'warning',
    completed: 'primary', canceled: 'destructive'
  };

  const leadStatusIcons = {
    completed: <CheckCircle className="w-3.5 h-3.5 text-green-500" />,
    calling: <Phone className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />,
    pending: <Clock className="w-3.5 h-3.5 text-muted-foreground" />,
    failed: <XCircle className="w-3.5 h-3.5 text-red-500" />,
  };

  return (
    <div className="flex-1 overflow-auto bg-background/50 relative">
      <div className="absolute inset-0 bg-grid opacity-15 pointer-events-none" />
      <div className="p-4 md:p-8 relative z-10 max-w-7xl mx-auto">
        {/* Back link */}
        <Link
          to="/admin/campaigns"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Campaigns
        </Link>

        {/* Campaign header */}
        <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">{campaign.name}</h1>
                  <Badge variant={statusVariants[campaign.status] || 'default'} dot>
                    {campaign.status}
                  </Badge>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Created {new Date(campaign.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {campaign.status === 'running' && (
                <button
                  onClick={() => handleControl('pause')}
                  disabled={controlling}
                  className="px-3 py-2 rounded-lg text-xs md:text-sm font-semibold bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/20 transition flex items-center gap-1.5"
                >
                  <Pause className="w-3.5 h-3.5" /> Pause
                </button>
              )}
              {campaign.status === 'paused' && (
                <button
                  onClick={() => handleControl('resume')}
                  disabled={controlling}
                  className="px-3 py-2 rounded-lg text-xs md:text-sm font-semibold bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 transition flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Resume
                </button>
              )}
              {['running', 'paused'].includes(campaign.status) && (
                <button
                  onClick={() => handleControl('cancel')}
                  disabled={controlling}
                  className="px-3 py-2 rounded-lg text-xs md:text-sm font-semibold bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
              <button
                onClick={handleExport}
                className="px-3 py-2 rounded-lg text-xs md:text-sm font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-5">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground font-medium">Progress</span>
              <span className="text-foreground font-bold">{progress}% — {campaign.completedLeads || 0}/{campaign.totalLeads} leads</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-5">
            <div className="bg-muted/50 rounded-lg px-3 py-2.5 md:px-4 md:py-3 text-center">
              <p className="text-xl md:text-2xl font-black text-foreground">{campaign.totalLeads}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground font-medium">Total</p>
            </div>
            <div className="bg-green-500/5 rounded-lg px-3 py-2.5 md:px-4 md:py-3 text-center">
              <p className="text-xl md:text-2xl font-black text-green-600 dark:text-green-400">{campaign.completedLeads || 0}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground font-medium">Completed</p>
            </div>
            <div className="bg-red-500/5 rounded-lg px-3 py-2.5 md:px-4 md:py-3 text-center">
              <p className="text-xl md:text-2xl font-black text-red-600 dark:text-red-400">{campaign.failedLeads || 0}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground font-medium">Failed</p>
            </div>
            <div className="bg-primary/5 rounded-lg px-3 py-2.5 md:px-4 md:py-3 text-center">
              <p className="text-xl md:text-2xl font-black text-primary">{campaign.totalLeads - (campaign.completedLeads || 0) - (campaign.failedLeads || 0)}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground font-medium">Pending</p>
            </div>
          </div>
        </div>

        {/* Script section */}
        {campaign.script && (
          <div className="bg-card border border-border rounded-xl mb-6 overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center gap-2 text-muted-foreground text-sm font-medium">
              <FileText className="w-4 h-4" /> Campaign Script
            </div>
            <div className="p-5 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {campaign.script}
            </div>
          </div>
        )}

        {/* Leads table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <Users className="w-4 h-4" /> Leads ({leads.length})
          </div>

          {leadsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No leads data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outcome</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, idx) => (
                    <tr key={lead._id || idx} className="border-b border-border/50 hover:bg-muted/20 transition">
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-foreground">{lead.to}</td>
                      <td className="px-4 py-3 text-foreground">{lead.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          {leadStatusIcons[lead.status] || leadStatusIcons.pending}
                          <span className="capitalize text-xs font-medium">{lead.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground text-xs">{lead.statusClassification || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-[200px]">{lead.remark || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
