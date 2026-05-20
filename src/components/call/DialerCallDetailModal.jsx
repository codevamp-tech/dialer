import { useEffect, useState, useRef } from 'react';
import {
  X, Phone, Clock, User, Mic, FileText, Play, Pause,
  Volume2, Download, MessageSquare, Star, Calendar, AlertCircle
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import useStore from '../../store/useStore';

const dispositionVariant = {
  'Interested':     'success',
  'Follow Up':      'warning',
  'Not Interested': 'error',
  'No Answer':      'default',
  'Busy':           'default',
  'Wrong Number':   'default',
  'Skipped':        'default',
  'Call Back':      'warning',
};

/* ─── Audio Player ─────────────────────────────────────────────────────────── */
function AudioPlayer({ url }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); } else { a.play(); }
    setPlaying(!playing);
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  return (
    <div className="bg-muted/30 border border-border rounded-2xl p-4">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={e => setProgress(e.target.currentTime)}
        onDurationChange={e => setDuration(e.target.duration)}
        onEnded={() => setPlaying(false)}
      />
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:opacity-90 transition shrink-0"
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={progress}
            onChange={e => {
              audioRef.current.currentTime = e.target.value;
              setProgress(Number(e.target.value));
            }}
            className="w-full h-1.5 accent-primary cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
            <span>{fmt(progress)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
        <a
          href={url}
          download
          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition text-muted-foreground"
        >
          <Download className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

/* ─── Transcript Bubble ────────────────────────────────────────────────────── */
function TranscriptBubble({ speaker, text }) {
  const isAgent = speaker === 'Agent';
  return (
    <div className={`flex gap-3 ${isAgent ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
        isAgent ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
      }`}>
        {isAgent ? 'A' : 'C'}
      </div>
      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
        isAgent
          ? 'bg-primary/10 text-foreground rounded-tr-sm'
          : 'bg-muted/60 text-foreground rounded-tl-sm'
      }`}>
        <p className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${isAgent ? 'text-primary' : 'text-muted-foreground'}`}>
          {speaker}
        </p>
        {text}
      </div>
    </div>
  );
}

/* ─── Main Modal ───────────────────────────────────────────────────────────── */
export function DialerCallDetailModal({ callId, onClose }) {
  const { fetchDialerCallDetail } = useStore();
  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'transcript'

  useEffect(() => {
    if (!callId) return;
    setLoading(true);
    fetchDialerCallDetail(callId).then(data => {
      setCall(data);
      setLoading(false);
    });
  }, [callId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const fmt = (secs) => {
    if (!secs) return '0:00';
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  };
  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-card border-l border-border z-50 flex flex-col shadow-2xl animate-slide-in-right">

        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center gap-4 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-lg tracking-tight truncate">
              {loading ? 'Loading…' : (call?.customerName || call?.to || 'Unknown')}
            </h2>
            {call && (
              <p className="text-xs font-mono text-muted-foreground">{call.to}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : !call ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <AlertCircle className="w-10 h-10" />
            <p className="font-bold">Call record not found</p>
          </div>
        ) : (
          <>
            {/* Tab Bar */}
            <div className="flex gap-1 px-6 py-3 border-b border-border shrink-0">
              {[
                { id: 'overview', label: 'Overview', icon: Star },
                { id: 'transcript', label: 'Transcript', icon: MessageSquare },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeTab === id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  {id === 'transcript' && call.transcript?.length > 0 && (
                    <span className="bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      {call.transcript.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">

              {activeTab === 'overview' && (
                <>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted/30 rounded-2xl p-4 text-center">
                      <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                      <p className="text-lg font-black">{fmt(call.durationSeconds)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Duration</p>
                    </div>
                    <div className="bg-muted/30 rounded-2xl p-4 text-center">
                      <div className="flex justify-center mb-1">
                        {call.disposition
                          ? <Badge variant={dispositionVariant[call.disposition] || 'default'}>{call.disposition}</Badge>
                          : <Badge variant="default">{call.status}</Badge>
                        }
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Outcome</p>
                    </div>
                    <div className="bg-muted/30 rounded-2xl p-4 text-center">
                      <Calendar className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs font-bold">{fmtDate(call.startedAt).split(',')[0]}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Date</p>
                    </div>
                  </div>

                  {/* Agent + Line */}
                  <div className="bg-muted/20 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs font-bold">{call.humanAgentId?.name || '—'}</p>
                        <p className="text-[10px] text-muted-foreground">{call.humanAgentId?.email}</p>
                      </div>
                    </div>
                    {call.phoneNumberId && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs font-bold">{call.phoneNumberId.name}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">{call.phoneNumberId.number}</p>
                        </div>
                      </div>
                    )}
                    {call.campaignId && (
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <p className="text-xs font-bold">{call.campaignId.name}</p>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {call.notes && (
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4">
                      <p className="text-[10px] font-black text-yellow-600 uppercase tracking-wider mb-2">Agent Notes</p>
                      <p className="text-sm text-foreground/80 leading-relaxed">{call.notes}</p>
                    </div>
                  )}

                  {/* AI Summary */}
                  {call.summary && (
                    <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-3.5 h-3.5 text-primary" />
                        <p className="text-[10px] font-black text-primary uppercase tracking-wider">AI Summary</p>
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed italic">"{call.summary}"</p>
                    </div>
                  )}

                  {/* Recording */}
                  {call.recordingUrl ? (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Mic className="w-4 h-4 text-primary" />
                        <p className="text-sm font-black">Call Recording</p>
                      </div>
                      <AudioPlayer url={call.recordingUrl} />
                    </div>
                  ) : (
                    <div className="bg-muted/20 border border-dashed border-border rounded-2xl p-4 text-center text-muted-foreground">
                      <Volume2 className="w-6 h-6 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">No recording available</p>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'transcript' && (
                <div>
                  {call.transcript && call.transcript.length > 0 ? (
                    <div className="space-y-4">
                      {call.transcript.map((msg, i) => (
                        <TranscriptBubble key={i} speaker={msg.speaker} text={msg.text} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                      <MessageSquare className="w-10 h-10 opacity-20" />
                      <p className="text-sm font-medium">No transcript available</p>
                      <p className="text-xs opacity-60">Transcripts are generated after the call ends</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </>
  );
}
