import { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, Download, Copy, Check, FileText, User, Headphones } from 'lucide-react';
import { format } from 'date-fns';

export default function CallDetailModal({ call, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const percentage = x / bounds.width;
    audioRef.current.currentTime = percentage * audioRef.current.duration;
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyTranscript = () => {
    if (!call.transcript || call.transcript.length === 0) return;
    const text = call.transcript.map(t => `${t.speaker}: ${t.text}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasTranscript = call.transcript && call.transcript.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-card border border-border shadow-2xl rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-in-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
              {(call.customerName || call.to).charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg leading-tight">{call.customerName || call.to}</h3>
              <p className="text-sm text-muted-foreground font-mono">{format(new Date(call.createdAt), 'MMM d, yyyy h:mm a')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left Sidebar: Metadata & Summary */}
          <div className="w-full md:w-1/3 border-r border-border bg-muted/10 p-6 overflow-y-auto scrollbar-thin">
            <div className="space-y-6">
              
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Call Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-mono font-semibold">{formatTime(call.durationSeconds)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-mono font-semibold">{call.to}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">Outcome</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      call.disposition === 'Interested' ? 'bg-green-500/15 text-green-600' :
                      call.disposition === 'Not Interested' ? 'bg-red-500/15 text-red-600' :
                      'bg-muted text-foreground'
                    }`}>
                      {call.disposition || call.status}
                    </span>
                  </div>
                </div>
              </div>

              {call.summary && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">AI Summary</h4>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <p className="text-sm text-foreground leading-relaxed">{call.summary}</p>
                  </div>
                </div>
              )}

              {call.notes && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Agent Notes</h4>
                  <div className="bg-background border border-border rounded-xl p-4">
                    <p className="text-sm text-foreground leading-relaxed">{call.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Area: Player & Transcript */}
          <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
            
            {/* Audio Player */}
            {call.recordingUrl ? (
              <div className="p-5 border-b border-border bg-card shadow-sm z-10 shrink-0">
                <audio 
                  ref={audioRef} 
                  src={call.recordingUrl} 
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                />
                <div className="flex items-center gap-4">
                  <button 
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-all shadow-lg shadow-primary/20 shrink-0"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                  </button>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-xs font-mono text-muted-foreground font-medium mb-1">
                      <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                    <div 
                      className="h-2.5 bg-muted rounded-full cursor-pointer relative overflow-hidden group"
                      onClick={handleSeek}
                    >
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-75"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <a 
                    href={call.recordingUrl} 
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-full hover:bg-muted text-muted-foreground transition-colors shrink-0"
                    title="Download Recording"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 border-b border-border bg-yellow-500/10 text-yellow-600 text-sm font-medium flex items-center gap-2 justify-center shrink-0">
                <Volume2 className="w-4 h-4" /> No recording available for this call
              </div>
            )}

            {/* Transcript */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-muted/5">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Full Transcript
                </h4>
                {hasTranscript && (
                  <button 
                    onClick={handleCopyTranscript}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-background border border-border hover:bg-muted transition-colors text-foreground"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>

              {!hasTranscript ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <FileText className="w-10 h-10 mb-3 opacity-20" />
                  <p>No transcript available.</p>
                </div>
              ) : (
                <div className="space-y-4 max-w-2xl mx-auto pb-4">
                  {call.transcript.map((msg, idx) => {
                    const isAgent = msg.speaker === 'Agent';
                    return (
                      <div key={idx} className={`flex gap-3 ${isAgent ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                          isAgent ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                        }`}>
                          {isAgent ? <Headphones className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div className={`px-4 py-3 rounded-2xl max-w-[85%] ${
                          isAgent 
                            ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                            : 'bg-card border border-border text-foreground rounded-tl-sm shadow-sm'
                        }`}>
                          <p className="text-[10px] uppercase tracking-wider font-bold opacity-70 mb-1">
                            {msg.speaker}
                          </p>
                          <p className="text-sm leading-relaxed">{msg.text}</p>
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
    </div>
  );
}
