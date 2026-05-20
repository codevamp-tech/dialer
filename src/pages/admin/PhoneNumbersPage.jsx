import { useEffect, useState } from 'react';
import { Phone, Plus, Trash2, Server, Shield, CheckCircle, XCircle } from 'lucide-react';
import useStore from '../../store/useStore';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { toast } from '../../components/ui/Toast';

export default function PhoneNumbersPage() {
  const { phoneNumbers, phoneNumbersLoading, fetchPhoneNumbers, createSipTrunk, deletePhoneNumber } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    serverIp: '',
    username: '',
    password: '',
    port: '5060',
    authUsername: '',
    authPassword: '',
  });

  useEffect(() => {
    fetchPhoneNumbers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createSipTrunk({
        name: formData.name,
        number: formData.number,
        serverIp: formData.serverIp,
        username: formData.username,
        password: formData.password,
        port: parseInt(formData.port) || 5060,
        authUsername: formData.authUsername || undefined,
        authPassword: formData.authPassword || undefined,
      });
      toast.success('SIP Trunk added successfully!');
      setIsModalOpen(false);
      setFormData({ name: '', number: '', serverIp: '', username: '', password: '', port: '5060', authUsername: '', authPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to add SIP trunk');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deletePhoneNumber(id);
      toast.success('Phone number deleted.');
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const field = (label, key, type = 'text', placeholder = '') => (
    <div className="space-y-1.5">
      <label className="text-sm font-bold text-foreground">{label}</label>
      <input
        type={type}
        value={formData[key]}
        onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm"
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="flex-1 overflow-auto bg-background/50 relative">
      <div className="absolute inset-0 bg-grid opacity-15 pointer-events-none" />
      <div className="p-8 relative z-10 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Phone Numbers</h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage SIP trunk lines used for outbound dialing.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition shadow-lg shadow-primary/25 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add SIP Trunk
          </button>
        </div>

        {/* Add SIP Trunk Modal */}
        <Modal isOpen={isModalOpen} title="Add SIP Trunk" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {field('Display Name', 'name', 'text', 'e.g. Twilio Main Line')}
              {field('Phone Number (E.164)', 'number', 'tel', '+918267818161')}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">{field('SIP Server / Host', 'serverIp', 'text', 'vani-outbound.pstn.twilio.com')}</div>
              {field('Port', 'port', 'number', '5060')}
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> SIP Identity Credentials
              </p>
              <div className="grid grid-cols-2 gap-4">
                {field('SIP Username', 'username', 'text', 'your-sip-username')}
                {field('SIP Password', 'password', 'password', '••••••••')}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Digest Auth Credentials <span className="text-[10px] normal-case font-normal">(Twilio Credential List — leave blank to reuse above)</span>
              </p>
              <div className="grid grid-cols-2 gap-4 mt-3">
                {field('Auth Username', 'authUsername', 'text', 'Optional')}
                {field('Auth Password', 'authPassword', 'password', 'Optional')}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-secondary text-secondary-foreground py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="flex-[2] bg-primary text-primary-foreground py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition shadow-lg shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2">
                {isSubmitting ? <Spinner size="sm" /> : <><Plus className="w-4 h-4" /> Add SIP Trunk</>}
              </button>
            </div>
          </form>
        </Modal>

        {/* List */}
        {phoneNumbersLoading && phoneNumbers.length === 0 ? (
          <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
        ) : phoneNumbers.length === 0 ? (
          <EmptyState
            icon={Phone}
            title="No phone numbers yet"
            description="Add a SIP trunk to start making outbound calls from the Dialer."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {phoneNumbers.map((pn, idx) => (
              <div
                key={pn.id}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200 animate-slide-in-up group"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-foreground truncate">{pn.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{pn.number}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(pn.id, pn.name)}
                    disabled={deletingId === pn.id}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
                  >
                    {deletingId === pn.id ? <Spinner size="sm" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Server className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-mono truncate">{pn.sipServerIp || '—'}:{pn.sipPort || 5060}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={pn.status === 'active' ? 'success' : 'default'} dot>
                      {pn.status}
                    </Badge>
                    <Badge variant="default">{pn.provider}</Badge>
                    {pn.hasSipCredentials && (
                      <span className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 font-medium">
                        <CheckCircle className="w-3 h-3" /> Creds OK
                      </span>
                    )}
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
