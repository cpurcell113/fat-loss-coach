import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { getSettings, setSettings } from '../data/storage';
import type { AppSettings } from '../types';
import { Download, Upload, Trash2 } from 'lucide-react';

export function SettingsPage() {
  const navigate = useNavigate();
  const settings = getSettings<AppSettings>('settings');
  const [apiKey, setApiKey] = useState(settings?.apiKey || '');
  const [saved, setSaved] = useState(false);

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
          <button onClick={() => navigate(-1)} className="text-sm text-primary">
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
            className="w-full bg-surface-alt rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 mb-2"
          />
          <button
            onClick={handleSaveKey}
            className={`w-full py-2.5 rounded-lg font-medium text-sm ${saved ? 'bg-success' : 'bg-primary'}`}
          >
            {saved ? '✓ Saved' : 'Save API Key'}
          </button>
        </Card>

        {/* Data Management */}
        <Card>
          <h3 className="text-sm font-medium mb-3">Data</h3>
          <div className="space-y-2">
            <button onClick={handleExport} className="flex items-center gap-3 w-full py-2.5 px-3 bg-surface-alt rounded-lg text-sm">
              <Download size={16} className="text-primary" />
              Export Full Backup
            </button>
            <button onClick={handleImport} className="flex items-center gap-3 w-full py-2.5 px-3 bg-surface-alt rounded-lg text-sm">
              <Upload size={16} className="text-primary" />
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
