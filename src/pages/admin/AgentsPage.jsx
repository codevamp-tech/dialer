import { useEffect, useState } from 'react';
import { User, UserPlus, Mail, Phone, Lock, CheckCircle, XCircle, Clock } from 'lucide-react';
import useStore from '../../store/useStore';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { toast } from '../../components/ui/Toast';

export default function AgentsPage() {
  const { agents, agentsLoading, fetchAgents, createHumanAgent } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createHumanAgent(formData);
      toast.success('Human agent created successfully!');
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', phone: '' });
      fetchAgents(); // Refresh list
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fmtDate = (d) => {
    if (!d) return 'Never';
    return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="flex-1 overflow-auto bg-background/50 relative">
      <div className="absolute inset-0 bg-grid opacity-15 pointer-events-none" />
      <div className="p-8 relative z-10 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Human Agents</h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage human agent accounts that can log into the dialer.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition shadow-lg shadow-primary/25 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Add Human Agent
          </button>
        </div>

        {/* Add Agent Modal */}
        <Modal isOpen={isModalOpen} title="Create Human Agent" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleCreateAgent} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-foreground">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" required value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm"
                  placeholder="Enter full name" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" required value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm"
                  placeholder="agent@example.com" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-foreground">Initial Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="password" required value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm"
                  placeholder="Minimum 6 characters" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-foreground">Phone Number <span className="text-muted-foreground font-normal">(Optional)</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="tel" value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm"
                  placeholder="+91..." />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-secondary text-secondary-foreground py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting}
                className="flex-[2] bg-primary text-primary-foreground py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition shadow-lg shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2">
                {isSubmitting ? <Spinner size="sm" /> : <><UserPlus className="w-4 h-4" /> Create Agent</>}
              </button>
            </div>
          </form>
        </Modal>

        {/* Agent list */}
        {agentsLoading && agents.length === 0 ? (
          <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
        ) : agents.length === 0 ? (
          <EmptyState
            icon={User}
            title="No agents yet"
            description="Create your first human agent to let them log in and start dialing."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent, idx) => (
              <div
                key={agent._id}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200 animate-slide-in-up"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-lg font-bold text-primary">
                    {(agent.name || 'A')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-foreground truncate">{agent.name}</h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{agent.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant={agent.isActive !== false ? 'success' : 'error'} dot>
                        {agent.isActive !== false ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="default">Agent</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
                  {agent.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 shrink-0" />
                      <span className="font-mono">{agent.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>Last login: {fmtDate(agent.lastLoginAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 shrink-0" />
                    <span>Created: {fmtDate(agent.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
