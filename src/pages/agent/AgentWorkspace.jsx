import { useEffect, useState, useMemo } from 'react';
import {
  Phone, PhoneOff, CheckCircle, FileText, Mic, MicOff,
  Clock, SkipForward, ChevronDown, AlertTriangle, History,
  Settings, User, Layout, Activity, Info
} from 'lucide-react';
import useStore from '../../store/useStore';
import { useManualCall } from '../../hooks/useManualCall';
import { CallOverlay } from '../../components/call/CallOverlay';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { toast } from '../../components/ui/Toast';

export default function AgentWorkspace() {
  const {
    agentStatus, setAgentStatus,
    campaigns, fetchCampaigns, campaignsLoading,
    activeCampaign, setActiveCampaign,
    activeLead,
    pullNextLead, endCall: finishWrapUp, submitDisposition, skipLead,
    phoneNumbers, fetchPhoneNumbers, phoneNumbersLoading,
    dialerCallLogs, fetchDialerCallLogs, dialerCallLogsLoading,
  } = useStore();

  const manualCall = useManualCall();

  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('Interested');
  const [pulling, setPulling] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPhoneNumberId, setSelectedPhoneNumberId] = useState('');
  const [manualPhone, setManualPhone] = useState('+91');
  const [mode, setMode] = useState('campaign'); // 'campaign' or 'manual'
  const [callbackDateTime, setCallbackDateTime] = useState(''); // For 'Call Back' disposition
  const [autoNextCountdown, setAutoNextCountdown] = useState(null); // null or 0-3

  const sipNumbers = useMemo(() => phoneNumbers.filter(p => p.provider === 'sip-trunk' && p.status === 'active'), [phoneNumbers]);

  useEffect(() => {
    fetchCampaigns();
    fetchPhoneNumbers();
    fetchDialerCallLogs(1, 10);
  }, []);

  const handlePullNext = async () => {
    setPulling(true);
    try {
      await pullNextLead();
    } catch (err) {
      toast.error(err.message || 'Failed to pull next lead');
    } finally {
      setPulling(false);
    }
  };

  const handleDisposition = async () => {
    setSubmitting(true);
    try {
      const scheduledAt = outcome === 'Call Back' && callbackDateTime ? callbackDateTime : undefined;
      await submitDisposition(outcome, notes, manualCall.internalCallId, scheduledAt);
      toast.success('Disposition saved! Pulling next lead in 3s...');
      setNotes('');
      setOutcome('Interested');
      setCallbackDateTime('');
      fetchDialerCallLogs(1, 10);

      // Auto-pull next lead after 3 second countdown
      let count = 3;
      setAutoNextCountdown(count);
      const timer = setInterval(() => {
        count--;
        if (count <= 0) {
          clearInterval(timer);
          setAutoNextCountdown(null);
          handlePullNext();
        } else {
          setAutoNextCountdown(count);
        }
      }, 1000);
    } catch {
      toast.error('Failed to save disposition. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelAutoNext = () => setAutoNextCountdown(null);

  const handleSkip = async () => {
    await skipLead();
    toast.info('Lead skipped.');
  };

  const renderScript = () => {
    if (!activeCampaign || !activeCampaign.script) return "No script provided for this campaign.";
    if (!activeLead) return activeCampaign.script;

    let personalizedScript = activeCampaign.script.replace(/{Name}/gi, activeLead.name || 'Customer');

    if (activeLead.variables) {
      Object.keys(activeLead.variables).forEach(key => {
        const regex = new RegExp(`{${key}}`, 'gi');
        personalizedScript = personalizedScript.replace(regex, activeLead.variables[key]);
      });
    }

    return personalizedScript;
  };

  useEffect(() => {
    if (activeLead && manualCall.status === 'idle' && selectedPhoneNumberId) {
      manualCall.startCall(activeLead.to, selectedPhoneNumberId, {
        campaignId: activeCampaign?._id,
        leadId: activeLead._id,
        customerName: activeLead.name || '',
      });
    }
  }, [activeLead, selectedPhoneNumberId]);

  useEffect(() => {
    if (activeLead && manualCall.status === 'ended') {
      finishWrapUp();
    }
  }, [manualCall.status, activeLead]);

  const handleManualCall = async () => {
    if (!selectedPhoneNumberId) { toast.warning('Select a SIP phone number first'); return; }
    if (!/^\+[1-9]\d{1,14}$/.test(manualPhone.trim())) { toast.warning('Enter a valid E.164 phone number'); return; }
    manualCall.startCall(manualPhone.trim(), selectedPhoneNumberId);
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* ─── Top Control & Status Bar ────────────────────── */}
      <div className="h-16 border-b border-border bg-card/40 backdrop-blur-md flex items-center px-6 gap-6 z-20 shrink-0">
        {/* SIP Selector */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Phone className="w-4 h-4" />
          </div>
          <div className="min-w-[200px]">
            <select
              value={selectedPhoneNumberId}
              onChange={(e) => setSelectedPhoneNumberId(e.target.value)}
              className="w-full bg-transparent border-none text-sm font-bold focus:ring-0 outline-none cursor-pointer p-0"
              disabled={manualCall.status === 'live' || manualCall.status === 'connecting'}
            >
              <option value="">— Select SIP Line —</option>
              {sipNumbers.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.number})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-8 w-px bg-border" />

        {/* Mode Toggle */}
        <div className="flex p-1 bg-muted/50 rounded-xl">
          <button 
            onClick={() => setMode('campaign')} 
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'campaign' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Campaign
          </button>
          <button 
            onClick={() => setMode('manual')} 
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'manual' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Quick Dial
          </button>
        </div>

        <div className="h-8 w-px bg-border" />

        {/* Agent Status */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</span>
          <select
            value={agentStatus}
            onChange={(e) => setAgentStatus(e.target.value)}
            className={`text-sm font-bold bg-transparent border-none focus:ring-0 outline-none p-0 cursor-pointer ${
              agentStatus === 'Available' ? 'text-green-500' : agentStatus === 'Break' ? 'text-yellow-500' : 'text-red-500'
            }`}
          >
            <option value="Available">🟢 Available</option>
            <option value="Break">🟡 On Break</option>
            <option value="Offline">🔴 Offline</option>
          </select>
        </div>

        <div className="flex-1" />

        {/* Live Campaign Info */}
        {activeCampaign && (
          <div className="hidden lg:flex items-center gap-6 animate-fade-in">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Campaign</span>
              <span className="text-sm font-bold truncate max-w-[150px]">{activeCampaign.name}</span>
            </div>
            <div className="w-32">
              <div className="flex justify-between text-[10px] font-bold mb-1">
                <span className="text-muted-foreground uppercase">Progress</span>
                <span className="text-primary">{activeCampaign.completedLeads || 0}/{activeCampaign.totalLeads}</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500" 
                  style={{ width: `${(activeCampaign.completedLeads / activeCampaign.totalLeads) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Main Grid Layout ────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6 relative">
        <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none" />

        {/* Column 1: Script & Info (Left) */}
        <div className="w-[350px] flex flex-col gap-6 z-10 animate-slide-in-right">
          <div className="flex-1 bg-card/60 backdrop-blur border border-border rounded-3xl overflow-hidden flex flex-col shadow-xl shadow-primary/5">
            <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm">Campaign Script</span>
              </div>
              {activeLead && <Badge variant="primary" className="animate-pulse">Active</Badge>}
            </div>
            <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
              {activeCampaign ? (
                <div className="space-y-4">
                  {renderScript().split('\n').map((p, i) => (
                    <p key={i} className="text-sm text-foreground/80 leading-relaxed">{p}</p>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <FileText className="w-12 h-12 mb-4" />
                  <p className="text-sm font-medium">No campaign selected</p>
                </div>
              )}
            </div>
          </div>

          {/* Lead Details mini-card */}
          {activeLead && (
            <div className="bg-card/60 backdrop-blur border border-border rounded-3xl p-6 shadow-xl shadow-primary/5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                  {activeLead.name?.charAt(0) || <User className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{activeLead.name || 'Unknown Lead'}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{activeLead.to}</p>
                </div>
              </div>
              {activeLead.variables && Object.keys(activeLead.variables).length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(activeLead.variables).slice(0, 4).map(([k, v]) => (
                    <div key={k} className="bg-muted/30 rounded-lg p-2 overflow-hidden">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">{k}</p>
                      <p className="text-[11px] font-semibold truncate">{String(v)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Column 2: The Stage (Center) */}
        <div className="flex-1 flex flex-col items-center justify-center z-10 relative">
          
          {activeLead && manualCall.status === 'ended' ? (
            /* Disposition Stage */
            <div className="w-full max-w-xl bg-card border border-border rounded-[40px] p-10 shadow-2xl animate-slide-in-up">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Call Result</h2>
                  <p className="text-muted-foreground">Select an outcome for this interaction</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  {['Interested', 'Call Back', 'No Answer', 'Wrong Number', 'Not Interested', 'DND'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setOutcome(opt)}
                      className={`py-3 px-4 rounded-2xl text-sm font-bold border-2 transition-all ${
                        outcome === opt 
                          ? 'border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10 scale-[1.02]' 
                          : 'border-border bg-muted/10 hover:border-border/50 text-muted-foreground'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {/* Call Back — datetime picker */}
                {outcome === 'Call Back' && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-2 animate-fade-in">
                    <label className="text-xs font-black text-amber-600 uppercase tracking-wider">Schedule Callback At</label>
                    <input
                      type="datetime-local"
                      value={callbackDateTime}
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={e => setCallbackDateTime(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 transition"
                    />
                    {!callbackDateTime && (
                      <p className="text-[11px] text-amber-600/70">Without a date, the lead stays pending with no auto-retry.</p>
                    )}
                  </div>
                )}

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes about the call..."
                  className="w-full h-32 bg-muted/20 border border-border rounded-2xl p-4 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                />

                {/* Auto-next countdown */}
                {autoNextCountdown !== null && (
                  <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-2xl px-5 py-3 animate-fade-in">
                    <p className="text-sm font-bold text-primary">
                      Pulling next lead in <span className="text-lg">{autoNextCountdown}s</span>…
                    </p>
                    <button
                      onClick={cancelAutoNext}
                      className="text-xs font-bold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-xl bg-muted/50 hover:bg-muted transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={handleSkip}
                    className="flex-1 py-4 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <SkipForward className="w-4 h-4" /> Skip
                  </button>
                  <button
                    onClick={handleDisposition}
                    disabled={submitting || autoNextCountdown !== null}
                    className="flex-[2] py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {submitting ? <Spinner size="sm" className="border-white/20 border-t-white" /> : <CheckCircle className="w-5 h-5" />}
                    Save & Next
                  </button>
                </div>
              </div>
            </div>


          ) : manualCall.status === 'connecting' || manualCall.status === 'ringing' || manualCall.status === 'live' || manualCall.status === 'ending' ? (
            /* Active Call Stage */
            <div className="w-full max-w-2xl h-full animate-fade-in">
              <CallOverlay
                call={manualCall}
                contact={{
                  name: activeLead?.name || (mode === 'manual' ? 'Quick Dial' : 'Outbound'),
                  number: activeLead?.to || manualCall.toNumber,
                }}
                script={null} // We show script in the left panel now
                onMuteToggle={manualCall.toggleMute}
                onEndCall={manualCall.endCall}
              />
            </div>

          ) : (
            /* Idle Stage / Dialer */
            <div className="w-full max-w-lg animate-slide-in-up">
              <div className="bg-card border border-border rounded-[40px] p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors" />
                
                {mode === 'campaign' ? (
                  <div className="text-center space-y-8">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center relative">
                        <Phone className="w-10 h-10" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-4 border-card" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black tracking-tighter">Ready to Call?</h2>
                        <p className="text-muted-foreground mt-1">
                          {activeCampaign 
                            ? `Queue active for "${activeCampaign.name}"` 
                            : 'Select a campaign to begin the queue'}
                        </p>
                      </div>
                    </div>

                    {!activeCampaign ? (
                      <div className="p-6 bg-muted/30 rounded-3xl border border-dashed border-border text-sm font-medium">
                        <select
                          value={activeCampaign?._id || ''}
                          onChange={(e) => setActiveCampaign(campaigns.find(c => c._id === e.target.value))}
                          className="w-full bg-transparent text-center font-bold outline-none cursor-pointer"
                        >
                          <option value="" disabled>Choose a Campaign</option>
                          {campaigns.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <button
                        onClick={handlePullNext}
                        disabled={pulling || agentStatus !== 'Available' || !selectedPhoneNumberId}
                        className="w-full py-6 bg-primary text-white font-black text-xl rounded-3xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {pulling ? <Spinner size="md" className="border-white/20 border-t-white" /> : <Activity className="w-6 h-6 animate-pulse" />}
                        {pulling ? 'Pulling Lead...' : 'Start Next Call'}
                      </button>
                    )}
                    
                    <p className="text-xs text-muted-foreground font-medium">
                      {agentStatus !== 'Available' ? '⚠️ Set status to Available to start' : !selectedPhoneNumberId ? '⚠️ Select a SIP Line first' : 'Auto-pulling lead from queue'}
                    </p>
                  </div>
                ) : (
                  /* Quick Dial Pad Aesthetic */
                  <div className="space-y-8">
                    <div className="text-center">
                      <h2 className="text-2xl font-black tracking-tight">Quick Dial</h2>
                      <p className="text-sm text-muted-foreground">Enter number in E.164 format</p>
                    </div>

                    <div className="relative">
                      <input
                        type="tel"
                        value={manualPhone}
                        onChange={e => setManualPhone(e.target.value)}
                        placeholder="+91"
                        className="w-full bg-muted/20 border-2 border-border rounded-2xl py-6 px-6 text-2xl font-black tracking-widest text-center focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                      />
                      <div className="absolute inset-y-0 right-4 flex items-center">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Layout className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleManualCall}
                      disabled={!selectedPhoneNumberId || agentStatus !== 'Available'}
                      className="w-full py-6 bg-primary text-white font-black text-xl rounded-3xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      <Phone className="w-6 h-6" />
                      Call Number
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Column 3: Recent Activity (Right) */}
        <div className="w-[300px] flex flex-col gap-6 z-10 animate-slide-in-right delay-75">
          {/* Recent Calls */}
          <div className="flex-1 bg-card/60 backdrop-blur border border-border rounded-3xl overflow-hidden flex flex-col shadow-xl shadow-primary/5">
            <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm">Recent Calls</span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
              {dialerCallLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 italic p-6">
                  <p className="text-xs">No calls logged yet.</p>
                </div>
              ) : (
                dialerCallLogs.slice(0, 10).map((log, i) => (
                  <div key={log._id || i} className="p-3 rounded-2xl bg-muted/20 border border-transparent hover:border-border transition-all group">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        log.disposition === 'Interested' ? 'bg-green-500' :
                        log.disposition === 'Not Interested' ? 'bg-red-500' :
                        log.disposition === 'Follow Up' ? 'bg-yellow-500' : 'bg-muted-foreground/30'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">{log.customerName || log.to}</p>
                        <p className="text-[10px] text-muted-foreground flex justify-between">
                          <span>{log.disposition || 'No Result'}</span>
                          <span>{log.durationSeconds ? formatDuration(log.durationSeconds) : '—'}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Performance Mini-Stats */}
          <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm text-primary">Session Stats</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Calls</p>
                <p className="text-xl font-black">{dialerCallLogs.length}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Interested</p>
                <p className="text-xl font-black text-green-500">
                  {dialerCallLogs.filter(l => l.disposition === 'Interested').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
