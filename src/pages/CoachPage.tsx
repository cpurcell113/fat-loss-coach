import { useEffect, useRef, useState } from 'react';
import { useBodyComp } from '../hooks/useBodyComp';
import { useNutrition } from '../hooks/useNutrition';
import { useCheckIn } from '../hooks/useCheckIn';
import { usePerformance } from '../hooks/usePerformance';
import { useAlerts } from '../hooks/useAlerts';
import { useCoach } from '../hooks/useCoach';
import { useVoice } from '../hooks/useVoice';
import { getSettings } from '../data/storage';
import type { AppSettings } from '../types';
import { useNavigate } from 'react-router-dom';
import { Settings, Mic, MicOff, Volume2, VolumeX, Send } from 'lucide-react';
import { ChatWindow } from '../components/chat/ChatWindow';
import { QuickActions } from '../components/chat/QuickActions';

export function CoachPage() {
  const settings = getSettings<AppSettings>('settings');
  const navigate = useNavigate();

  const { entries: bodyComp } = useBodyComp();
  const { entries: nutrition } = useNutrition();
  const { entries: checkIns } = useCheckIn();
  const { sessions: sprints } = usePerformance();
  const alerts = useAlerts(bodyComp, checkIns, nutrition);
  const { messages, isStreaming, sendMessage } = useCoach(
    settings?.apiKey || '',
    bodyComp,
    nutrition,
    checkIns,
    sprints,
    alerts,
  );

  const {
    isListening, isSpeaking, transcript, voiceEnabled, isSupported,
    startListening, stopListening, clearTranscript, speak, stopSpeaking, toggleVoice,
  } = useVoice();

  const [textInput, setTextInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-speak Claude responses when voice is enabled
  const lastMsgRef = useRef('');
  useEffect(() => {
    if (!voiceEnabled || isStreaming) return;
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant' && last.content && last.content !== lastMsgRef.current) {
      lastMsgRef.current = last.content;
      speak(last.content);
    }
  }, [messages, isStreaming, voiceEnabled, speak]);

  const handleSendText = () => {
    const text = textInput.trim();
    if (!text || isStreaming) return;
    sendMessage(text);
    setTextInput('');
    inputRef.current?.focus();
  };

  const handleMicRelease = () => {
    const final = stopListening();
    if (final.trim()) {
      sendMessage(final.trim());
      clearTranscript();
    }
  };

  if (!settings?.onboardingComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="font-display text-3xl font-bold mb-2" style={{ color: '#c9963a' }}>All In</div>
        <div className="w-12 h-px mb-4" style={{ background: 'rgba(201,150,58,0.3)' }} />
        <p className="text-sm text-muted mb-8">Your personal AI coach is waiting.</p>
        <button
          onClick={() => navigate('/onboarding')}
          className="px-8 py-3 rounded-xl font-display font-bold text-lg tracking-wide text-black active:scale-95 transition-transform"
          style={{ background: '#c9963a' }}
        >
          GET STARTED
        </button>
      </div>
    );
  }

  if (!settings?.apiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <p className="font-display text-xl font-bold mb-2" style={{ color: '#c9963a' }}>API Key Needed</p>
        <p className="text-sm text-muted mb-6">Add your Anthropic API key in Settings to activate your coach.</p>
        <button
          onClick={() => navigate('/settings')}
          className="px-6 py-3 rounded-xl font-display font-bold text-black"
          style={{ background: '#c9963a' }}
        >
          OPEN SETTINGS
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 backdrop-blur-sm"
        style={{ background: 'rgba(20,20,20,0.9)', borderBottom: '1px solid rgba(201,150,58,0.15)' }}
      >
        <div>
          <h1 className="font-display font-bold text-base tracking-wide" style={{ color: '#c9963a' }}>COACH</h1>
          <p className="text-[10px] text-muted">claude-sonnet-4-6</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={isSpeaking ? stopSpeaking : toggleVoice}
            className="p-2 rounded-lg transition-colors"
            style={{ color: voiceEnabled ? '#c9963a' : '#4a4845' }}
            title={voiceEnabled ? 'Voice on' : 'Voice off'}
          >
            {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button onClick={() => navigate('/settings')} className="p-2 text-muted">
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <ChatWindow messages={messages} />

      {/* Quick actions */}
      <QuickActions onSelect={sendMessage} disabled={isStreaming} />

      {/* Input bar */}
      <div
        className="px-3 py-2.5"
        style={{ background: '#141414', borderTop: '1px solid rgba(201,150,58,0.15)' }}
      >
        {isListening && (
          <div className="mb-2 px-3 py-2 rounded-lg text-sm" style={{ background: '#2a2a2a', color: '#f0ece4' }}>
            {transcript || <span className="text-muted" style={{ fontStyle: 'italic' }}>Listening...</span>}
          </div>
        )}

        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText(); }
            }}
            placeholder="Message your coach..."
            rows={1}
            className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm outline-none max-h-32"
            style={{
              background: '#222',
              color: '#f0ece4',
              minHeight: '40px',
            }}
          />

          {isSupported && (
            <button
              onPointerDown={startListening}
              onPointerUp={handleMicRelease}
              onPointerLeave={handleMicRelease}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors select-none"
              style={{
                background: isListening ? '#c9963a' : '#2a2a2a',
                color: isListening ? '#000' : '#4a4845',
              }}
              title="Hold to speak"
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}

          <button
            onClick={handleSendText}
            disabled={!textInput.trim() || isStreaming}
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40 active:scale-95 transition-transform"
            style={{ background: '#c9963a', color: '#000' }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
