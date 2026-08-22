import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { getSettings, setSettings } from '../data/storage';
import { getCoachToken, setCoachToken } from '../lib/ai-access';
import { getSubscription } from '../lib/subscription';
import { SUBSCRIPTION_TIERS, aiCogsPercentOfPrice } from '../constants/pricing';
import type { AppSettings } from '../types';
import { Download, Upload, Trash2, Check, Eye, EyeOff, Copy } from 'lucide-react';

const VOICE_NAME_KEY = 'allin_voice_name';

export function SettingsPage() {
  const navigate = useNavigate();
  const settings = getSettings<AppSettings>('settings');
  const [apiKey, setApiKey] = useState(settings?.apiKey || '');
  const [coachToken, setCoachTokenState] = useState(getCoachToken());
  const [coachTokenSaved, setCoachTokenSaved] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState(localStorage.getItem(VOICE_NAME_KEY) || '');

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const load = () => {
      const v = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
      if (v.length) setVoices(v);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const handleSelectVoice = (name: string) => {
    localStorage.setItem(VOICE_NAME_KEY, name);
    setSelectedVoice(name);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("All in. Let's get to work.");
    const voice = voices.find(v => v.name === name);
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const handleSaveCoachToken = () => {
    setCoachToken(coachToken);
    setCoachTokenSaved(true);
    setTimeout(() => setCoachTokenSaved(false), 1500);
  };

  const handleSaveKey = () => {
    if (settings) {
      setSettings('settings', { ...settings, apiKey });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleExport = () => {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('fla_')) {
        data[key] = localStorage.getItem(key) || '';
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fat-loss-coach-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const data = JSON.parse(text);
      Object.entries(data).forEach(([key, value]) => {
        if (key.startsWith('fla_')) {
          localStorage.setItem(key, value as string);
        }
      });
      window.location.reload();
    };
    input.click();
  };

  const handleClearChat = () => {
    if (confirm('Clear all chat history?')) {
      localStorage.removeItem('fla_chat_history');
      window.location.reload();
    }
  };

  const handleReset = () => {
    if (confirm('This will delete ALL data. Are you sure?')) {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith('fla_')) localStorage.removeItem(key);
      }
      window.location.reload();
    }
  };

  const sortedVoices = [...voices].sort((a, b) => {
    const quality = (v: SpeechSynthesisVoice) =>
      v.name.includes('Enhanced') || v.name.includes('Premium') ? 0 : v.localService ? 1 : 2;
    return quality(a) - quality(b);
  });

  return (
    <div>
      <PageHeader
        title="Settings"
        right={
          <button onClick={() => navigate(-1)} className="text-sm text-gold">
            Done
          </button>
        }
      />
      <div className="px-4 py-4 space-y-4">
        {/* Subscription pricing — AI built into tiers */}
        <Card>
          <h3 className="text-sm font-medium mb-2">Subscription &amp; AI Pricing</h3>
          <p className="text-xs text-muted mb-3 leading-relaxed">
            Right now (solo): AI works with just your Vercel <code className="text-gold">ANTHROPIC_API_KEY</code> — no phone setup.
            When you add clients, set <code className="text-gold">AI_COACH_ACCESS_TOKEN</code> to lock AI behind paid plans.
            All In ($297/mo) includes 20 AI messages/day (~{aiCogsPercentOfPrice(SUBSCRIPTION_TIERS[1])}% of revenue).
          </p>
          {getSubscription() ? (
            <p className="text-xs text-success mb-3">
              Active: {getSubscription()?.tier.replace('_', ' ')} plan
            </p>
          ) : null}
          <button
            onClick={() => navigate('/pricing')}
            className="w-full py-2.5 rounded-lg font-medium text-sm bg-gold text-surface-dark"
          >
            View plans
          </button>
        </Card>

        {/* Coach token — only needed when locking clients out */}
        <Card>
          <h3 className="text-sm font-medium mb-2">Coach Access Token (optional)</h3>
          <p className="text-xs text-muted mb-3 leading-relaxed">
            Leave blank for solo use. When you&apos;re ready to gate client AI, set the matching
            {' '}<code className="text-gold">AI_COACH_ACCESS_TOKEN</code> in Vercel and paste it here on your device only.
          </p>
          <input
            type="password"
            value={coachToken}
            onChange={e => setCoachTokenState(e.target.value)}
            placeholder="Your coach access token"
            autoComplete="off"
            className="w-full bg-surface-alt rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/30 border border-gold/10 mb-2"
          />
          <button
            onClick={handleSaveCoachToken}
            className={`w-full py-2.5 rounded-lg font-medium text-sm ${coachTokenSaved ? 'bg-success text-white' : 'bg-gold text-surface-dark'}`}
          >
            {coachTokenSaved ? '✓ Coach token saved' : 'Save coach token'}
          </button>
          <p className="text-[10px] text-muted mt-2">
            Also set <code className="text-gold">SUBSCRIPTION_SIGNING_SECRET</code> in Vercel for tier activation.
            Optional: <code className="text-gold">AI_CHAT_DISABLED=true</code>, <code className="text-gold">AI_COACH_DAILY_LIMIT=100</code>.
          </p>
        </Card>

        {/* Optional local dev key — hidden unless already set */}
        {apiKey && (
          <Card>
            <h3 className="text-sm font-medium mb-2">Legacy Local API Key</h3>
            <p className="text-xs text-muted mb-3">No longer required. AI features use the server key above.</p>
            <div className="flex items-center gap-2 mb-2">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="flex-1 bg-surface-alt rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/30 border border-gold/10"
              />
              <button
                onClick={() => setShowKey(s => !s)}
                className="p-2.5 rounded-lg bg-surface-alt border border-gold/10 text-muted"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-1.5 bg-surface-alt border border-gold/10 text-muted"
              >
                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Key</>}
              </button>
              <button
                onClick={handleSaveKey}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm ${saved ? 'bg-success text-white' : 'bg-gold text-surface-dark'}`}
              >
                {saved ? '✓ Saved' : 'Save Key'}
              </button>
            </div>
          </Card>
        )}

        {/* Voice */}
        {'speechSynthesis' in window && sortedVoices.length > 0 && (
          <Card>
            <h3 className="text-sm font-medium mb-1">Voice</h3>
            <p className="text-xs text-muted mb-3">Tap a voice to select and preview it.</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {sortedVoices.map(v => {
                const isBest = v.name.includes('Enhanced') || v.name.includes('Premium');
                return (
                  <button
                    key={v.name}
                    onClick={() => handleSelectVoice(v.name)}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-left text-sm transition-colors"
                    style={{
                      background: selectedVoice === v.name ? 'rgba(201,150,58,0.15)' : '#1a1a1a',
                      border: `1px solid ${selectedVoice === v.name ? 'rgba(201,150,58,0.4)' : '#2a2a2a'}`,
                      color: selectedVoice === v.name ? '#c9963a' : '#f0ece4',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span>{v.name}</span>
                      {isBest && (
                        <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'rgba(201,150,58,0.15)', color: '#c9963a', fontWeight: 600 }}>
                          BEST
                        </span>
                      )}
                    </div>
                    {selectedVoice === v.name && <Check size={14} style={{ color: '#c9963a' }} />}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted mt-2">
              For better voices on iPhone: Settings → Accessibility → Spoken Content → Voices → English → download a Premium voice.
            </p>
          </Card>
        )}

        {/* Data Management */}
        <Card>
          <h3 className="text-sm font-medium mb-3">Data</h3>
          <div className="space-y-2">
            <button onClick={handleExport} className="flex items-center gap-3 w-full py-2.5 px-3 bg-surface-alt rounded-lg text-sm">
              <Download size={16} className="text-gold" />
              Export Full Backup
            </button>
            <button onClick={handleImport} className="flex items-center gap-3 w-full py-2.5 px-3 bg-surface-alt rounded-lg text-sm">
              <Upload size={16} className="text-gold" />
              Import Backup
            </button>
            <button onClick={handleClearChat} className="flex items-center gap-3 w-full py-2.5 px-3 bg-surface-alt rounded-lg text-sm">
              <Trash2 size={16} className="text-warning" />
              Clear Chat History
            </button>
            <button onClick={handleReset} className="flex items-center gap-3 w-full py-2.5 px-3 bg-surface-alt rounded-lg text-sm text-danger">
              <Trash2 size={16} />
              Reset All Data
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
