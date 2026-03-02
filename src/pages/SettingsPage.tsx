import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { getSettings, setSettings } from '../data/storage';
import type { AppSettings } from '../types';
import { Download, Upload, Trash2, Check } from 'lucide-react';

const VOICE_NAME_KEY = 'allin_voice_name';

export function SettingsPage() {
  const navigate = useNavigate();
  const settings = getSettings<AppSettings>('settings');
  const [apiKey, setApiKey] = useState(settings?.apiKey || '');
  const [saved, setSaved] = useState(false);
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
    // Preview
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("All in. Let's get to work.");
    const voice = voices.find(v => v.name === name);
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const handleSaveKey = () => {
    if (settings) {
      setSettings('settings', { ...settings, apiKey });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
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
        {/* API Key */}
        <Card>
          <h3 className="text-sm font-medium mb-2">Anthropic API Key</h3>
          <p className="text-xs text-muted mb-3">Powers your AI coach. Stored locally on this device only.</p>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full bg-surface-alt rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/30 border border-gold/10 mb-2"
          />
          <button
            onClick={handleSaveKey}
            className={`w-full py-2.5 rounded-lg font-medium text-sm ${saved ? 'bg-success' : 'bg-gold text-surface-dark'}`}
          >
            {saved ? '✓ Saved' : 'Save API Key'}
          </button>
        </Card>

        {/* Voice */}
        {'speechSynthesis' in window && voices.length > 0 && (
          <Card>
            <h3 className="text-sm font-medium mb-1">Voice</h3>
            <p className="text-xs text-muted mb-3">Tap a voice to select and preview it.</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {voices.map(v => (
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
                  <span>{v.name}</span>
                  {selectedVoice === v.name && <Check size={14} style={{ color: '#c9963a' }} />}
                </button>
              ))}
            </div>
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
