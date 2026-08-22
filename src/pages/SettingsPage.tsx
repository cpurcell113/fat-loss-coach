import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { getSettings, setSettings } from '../data/storage';
import { getCoachToken, setCoachToken } from '../lib/ai-access';
import { SUBSCRIPTION_TIERS } from '../constants/pricing';
import type { AppSettings } from '../types';
import { Download, Upload, Trash2, Check, Eye, EyeOff, Copy, ChevronDown } from 'lucide-react';

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
  const [showAdvanced, setShowAdvanced] = useState(false);
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
    a.download = `all-in-backup-${new Date().toISOString().split('T')[0]}.json`;
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
        <Card>
          <h3 className="text-sm font-medium mb-2">Walkthrough mode</h3>
          <p className="text-xs text-muted leading-relaxed">
            Run through the app and send feedback. No API keys needed on your phone —
            AI runs from the server. When you&apos;re ready for TestFlight / App Store,
            you&apos;ll handle keys while the Apple-ready build is set up.
          </p>
        </Card>

        <Card>
          <h3 className="text-sm font-medium mb-2">Plans (preview)</h3>
          <p className="text-xs text-muted mb-3 leading-relaxed">
            How client pricing will work when you open the roster — AI included in the subscription, not billed per chat.
          </p>
          <div className="space-y-2 mb-3">
            {SUBSCRIPTION_TIERS.map(t => (
              <div key={t.id} className="flex justify-between text-sm">
                <span style={{ color: '#f0ece4' }}>{t.name}</span>
                <span className="text-muted">
                  ${t.priceMonthly}/mo
                  {t.aiMessagesPerDay > 0 ? ` · ${t.aiMessagesPerDay} AI/day` : ' · coach chat only'}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/pricing')}
            className="w-full py-2.5 rounded-lg font-medium text-sm bg-gold text-surface-dark"
          >
            See full plan details
          </button>
        </Card>

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
          </Card>
        )}

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

        <button
          onClick={() => setShowAdvanced(s => !s)}
          className="flex items-center justify-between w-full px-1 py-2 text-xs text-muted"
        >
          <span>Advanced (not needed for walkthrough)</span>
          <ChevronDown size={14} style={{ transform: showAdvanced ? 'rotate(180deg)' : undefined }} />
        </button>

        {showAdvanced && (
          <>
            <Card>
              <h3 className="text-sm font-medium mb-2">Coach Access Token</h3>
              <p className="text-xs text-muted mb-3">
                Only for locking client AI later. Leave blank for now.
              </p>
              <input
                type="password"
                value={coachToken}
                onChange={e => setCoachTokenState(e.target.value)}
                placeholder="Optional"
                autoComplete="off"
                className="w-full bg-surface-alt rounded-lg px-4 py-2.5 text-sm outline-none border border-gold/10 mb-2"
              />
              <button
                onClick={handleSaveCoachToken}
                className={`w-full py-2.5 rounded-lg font-medium text-sm ${coachTokenSaved ? 'bg-success text-white' : 'bg-gold text-surface-dark'}`}
              >
                {coachTokenSaved ? '✓ Saved' : 'Save'}
              </button>
            </Card>

            {apiKey ? (
              <Card>
                <h3 className="text-sm font-medium mb-2">Legacy Local API Key</h3>
                <p className="text-xs text-muted mb-3">Unused — AI is server-side.</p>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    className="flex-1 bg-surface-alt rounded-lg px-4 py-2.5 text-sm outline-none border border-gold/10"
                  />
                  <button onClick={() => setShowKey(s => !s)} className="p-2.5 rounded-lg bg-surface-alt border border-gold/10 text-muted">
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="flex-1 py-2.5 rounded-lg text-sm bg-surface-alt border border-gold/10 text-muted flex items-center justify-center gap-1.5">
                    {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                  </button>
                  <button onClick={handleSaveKey} className={`flex-1 py-2.5 rounded-lg text-sm ${saved ? 'bg-success text-white' : 'bg-gold text-surface-dark'}`}>
                    {saved ? '✓ Saved' : 'Save'}
                  </button>
                </div>
              </Card>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
