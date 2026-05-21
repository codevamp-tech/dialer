import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Target, Search, Clock, ChevronRight, Upload } from 'lucide-react';
import useStore from '../../store/useStore';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { toast } from '../../components/ui/Toast';

function CreateCampaignModal({ isOpen, onClose }) {
  const { createCampaign, agents, fetchAgents } = useStore();
  const [name, setName] = useState('');
  const [script, setScript] = useState('');
  const [leadsText, setLeadsText] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) fetchAgents();
  }, [isOpen]);

  const handleCreate = async (e) => {
    e.preventDefault();

    // Parse leads from text (format: phone,name per line)
    const leads = leadsText
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const parts = line.split(',').map(p => p.trim());
        return {
          phone: parts[0],
          name: parts[1] || '',
        };
      })
      .filter(l => l.phone);

    if (!name.trim()) {
      toast.warning('Please enter a campaign name');
      return;
    }
    if (leads.length === 0) {
      toast.warning('Please add at least one lead (phone number per line)');
      return;
    }

    setCreating(true);
    try {
      await createCampaign({ name: name.trim(), script: script.trim(), leads });
      toast.success(`Campaign "${name}" created with ${leads.length} leads!`);
      setName('');
      setScript('');
      setLeadsText('');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      // Parse CSV - assume first column is phone, second is name
      const lines = text.split('\n').slice(1); // Skip header
      const parsed = lines
        .map(line => {
          const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          return cols[0] ? `${cols[0]},${cols[1] || ''}` : '';
        })
        .filter(Boolean)
        .join('\n');
      setLeadsText(parsed);
      toast.success(`Loaded ${lines.filter(l => l.trim()).length} leads from CSV`);
    };
    reader.readAsText(file);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Campaign" size="lg">
      <form onSubmit={handleCreate} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Campaign Name</label>
          <input
            id="input-campaign-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Spring Sales Outreach"
            className="w-full bg-background border border-border px-4 py-2.5 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground text-sm transition"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Agent Script</label>
          <textarea
            id="input-campaign-script"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder={"Hi {Name}, this is calling from...\nI wanted to talk to you about...\n\nUse {VariableName} for dynamic values."}
            className="w-full h-32 bg-background border border-border px-4 py-2.5 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground text-sm resize-none transition"
          />
          <p className="text-xs text-muted-foreground mt-1">Use {'{Name}'} to insert the lead's name dynamically.</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-foreground">
              Leads <span className="text-muted-foreground font-normal">({leadsText.split('\n').filter(l => l.trim()).length} leads)</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-primary font-semibold cursor-pointer hover:opacity-80 transition">
              <Upload className="w-3.5 h-3.5" />
              Import CSV
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
          <textarea
            id="input-campaign-leads"
            value={leadsText}
            onChange={(e) => setLeadsText(e.target.value)}
            placeholder={"Enter one lead per line:\n+919876543210,John Doe\n+919876543211,Jane Smith\n+919876543212"}
            className="w-full h-40 bg-background border border-border px-4 py-2.5 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground text-sm font-mono resize-none transition"
          />
          <p className="text-xs text-muted-foreground mt-1">Format: phone_number,name (one per line). Name is optional.</p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={creating}
            className="px-6 py-2.5 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition shadow-lg shadow-primary/25 flex items-center gap-2 disabled:opacity-50"
          >
            {creating ? <Spinner size="sm" className="border-white/20 border-t-white" /> : <Plus className="w-4 h-4" />}
            {creating ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function CampaignsPage() {
  const { campaigns, fetchCampaigns, campaignsLoading } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const statusConfig = {
    running: { variant: 'success', label: 'Running', dot: true },
    completed: { variant: 'primary', label: 'Completed' },
    paused: { variant: 'warning', label: 'Paused' },
    canceled: { variant: 'destructive', label: 'Canceled' },
    pending: { variant: 'default', label: 'Pending' },
  };

  return (
    <div className="flex-1 overflow-auto bg-background/50 relative">
      <div className="absolute inset-0 bg-grid opacity-15 pointer-events-none" />
      <div className="p-4 md:p-8 relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">Campaigns</h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage your outbound calling campaigns.</p>
          </div>
          <button
            id="btn-create-campaign"
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            id="input-search-campaigns"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="w-full bg-card border border-border pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground text-sm transition"
          />
        </div>

        {/* Campaign list */}
        {campaignsLoading && campaigns.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <EmptyState
            icon={Target}
            title={search ? 'No campaigns found' : 'No campaigns yet'}
            description={search ? 'Try a different search term.' : 'Create your first campaign to start making calls.'}
            action={!search && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create Campaign
              </button>
            )}
          />
        ) : (
          <div className="grid gap-3">
            {filteredCampaigns.map((campaign, idx) => {
              const progress = campaign.totalLeads > 0
                ? Math.round((campaign.completedLeads / campaign.totalLeads) * 100) : 0;
              const config = statusConfig[campaign.status] || statusConfig.pending;

              return (
                <Link
                  key={campaign._id}
                  to={`/admin/campaigns/${campaign._id}`}
                  className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200 group animate-slide-in-up"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-sm font-bold text-foreground truncate">{campaign.name}</h3>
                        <Badge variant={config.variant} dot={config.dot}>{config.label}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {campaign.completedLeads || 0}/{campaign.totalLeads} leads
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 hidden md:block">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 text-right font-medium">{progress}%</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <CreateCampaignModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
