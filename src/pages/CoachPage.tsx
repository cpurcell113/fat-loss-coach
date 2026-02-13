import { ChatWindow } from '../components/chat/ChatWindow';
import { ChatInput } from '../components/chat/ChatInput';
import { QuickActions } from '../components/chat/QuickActions';
import { useCoach } from '../hooks/useCoach';
import { useBodyComp } from '../hooks/useBodyComp';
import { useNutrition } from '../hooks/useNutrition';
import { useCheckIn } from '../hooks/useCheckIn';
import { usePerformance } from '../hooks/usePerformance';
import { useAlerts } from '../hooks/useAlerts';
import { getSettings } from '../data/storage';
import type { AppSettings } from '../types';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';

export function CoachPage() {
  const settings = getSettings<AppSettings>('settings');
  const apiKey = settings?.apiKey || '';
  const navigate = useNavigate();

  const { entries: bodyComp } = useBodyComp();
  const { entries: nutrition } = useNutrition();
  const { entries: checkIns } = useCheckIn();
  const { sessions: sprints } = usePerformance();
  const alerts = useAlerts(bodyComp, checkIns, nutrition);

  const { messages, isStreaming, sendMessage } = useCoach(
    apiKey, bodyComp, nutrition, checkIns, sprints, alerts
  );

  if (!settings?.onboardingComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="text-5xl mb-4">🏋️</div>
        <h1 className="text-xl font-bold mb-2">Fat Loss Coach</h1>
        <p className="text-sm text-muted mb-6">AI-powered body recomposition coaching for your 12-week cut</p>
        <button
          onClick={() => navigate('/onboarding')}
          className="px-6 py-3 bg-primary rounded-xl font-semibold active:scale-95 transition-transform"
        >
          Get Started
        </button>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <p className="text-sm text-muted mb-4">Set your Anthropic API key to start chatting with your coach</p>
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 px-4 py-2 bg-surface-alt rounded-lg"
        >
          <Settings size={16} /> Open Settings
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 bg-surface/80 backdrop-blur-sm border-b border-white/5">
        <div>
          <h1 className="text-base font-semibold">Coach</h1>
          <p className="text-[10px] text-muted">Powered by Claude</p>
        </div>
        <button onClick={() => navigate('/settings')} className="p-2 text-muted">
          <Settings size={18} />
        </button>
      </div>
      <ChatWindow messages={messages} />
      <QuickActions onSelect={sendMessage} disabled={isStreaming} />
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
