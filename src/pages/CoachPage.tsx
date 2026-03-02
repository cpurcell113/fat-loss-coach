import { useEffect, useRef } from 'react';
import { useBodyComp } from '../hooks/useBodyComp';
import { useNutrition } from '../hooks/useNutrition';
import { useCheckIn } from '../hooks/useCheckIn';
import { usePerformance } from '../hooks/usePerformance';
import { useAlerts } from '../hooks/useAlerts';
import { useCoach } from '../hooks/useCoach';
import { useVoice } from '../hooks/useVoice';
import { getSettings, setSettings } from '../data/storage';
import type { AppSettings, NutritionEntry, DailyCheckIn, SprintSession } from '../types';
import { useNavigate } from 'react-router-dom';
import { Settings, Mic, MicOff, Volume2, VolumeX, Send, Check, X } from 'lucide-react';
import { ChatWindow } from '../components/chat/ChatWindow';
import { QuickActions } from '../components/chat/QuickActions';
import { today } from '../utils/date-helpers';
import { autoCalories } from '../utils/calculations';

export function CoachPage() {
  const settings = getSettings<AppSettings>('settings');
  const navigate = useNavigate();

  const { entries: bodyComp } = useBodyComp();
  const { entries: nutrition, todayEntry: todayNutrition, add: addNutrition, update: updateNutrition } = useNutrition();
  const { entries: checkIns, todayEntry: todayCheckIn, add: addCheckIn, update: updateCheckIn } = useCheckIn();
  const { sessions: sprints, add: addSprint } = usePerformance();
  const alerts = useAlerts(bodyComp, checkIns, nutrition);

  const { messages, isStreaming, pendingAction, sendMessage, resolveAction } = useCoach(
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

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const textState = useRef('');

  // Auto-speak Claude responses when voice is enabled
  const lastMsgRef = useRef('');
  useEffect(() => {
    if (!voiceEnabled || isStreaming) return;
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant' && last.content && last.content !== lastMsgRef.current && !last.content.startsWith('Error:')) {
      lastMsgRef.current = last.content;
      speak(last.content);
    }
  }, [messages, isStreaming, voiceEnabled, speak]);

  const handleSendText = () => {
    const text = textState.current.trim();
    if (!text || isStreaming) return;
    sendMessage(text);
    textState.current = '';
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleMicRelease = () => {
    const final = stopListening();
    if (final.trim()) {
      sendMessage(final.trim());
      clearTranscript();
    }
  };

  // ─── Confirm / Cancel pending action ──────────────────────────────────────
  const handleConfirm = async () => {
    if (!pendingAction) return;
    const { tool, input } = pendingAction;
    try {
      if (tool === 'log_nutrition') {
        const p = input.protein as number;
        const c = input.carbs as number;
        const f = input.fats as number;
        const entry: NutritionEntry = {
          id: todayNutrition?.id || crypto.randomUUID(),
          date: today(), protein: p, carbs: c, fats: f,
          calories: autoCalories(p, c, f),
          fiber: todayNutrition?.fiber ?? null,
          water: todayNutrition?.water ?? null,
          notes: todayNutrition?.notes ?? '',
          createdAt: todayNutrition?.createdAt || new Date().toISOString(),
        };
        if (todayNutrition) updateNutrition(todayNutrition.id, entry); else addNutrition(entry);
        await resolveAction(true, 'Nutrition logged successfully.');

      } else if (tool === 'log_checkin') {
        const inp = input as Partial<DailyCheckIn>;
        const entry: DailyCheckIn = {
          id: todayCheckIn?.id || crypto.randomUUID(),
          date: today(),
          mood: inp.mood ?? todayCheckIn?.mood ?? 5,
          energyLevel: inp.energyLevel ?? todayCheckIn?.energyLevel ?? 5,
          sleepHours: inp.sleepHours ?? todayCheckIn?.sleepHours ?? 7,
          sleepQuality: inp.sleepQuality ?? todayCheckIn?.sleepQuality ?? 3,
          soreness: inp.soreness ?? todayCheckIn?.soreness ?? 3,
          hunger: inp.hunger ?? todayCheckIn?.hunger ?? 5,
          stressLevel: inp.stressLevel ?? todayCheckIn?.stressLevel ?? 3,
          stressSource: todayCheckIn?.stressSource ?? null,
          fastingStatus: todayCheckIn?.fastingStatus ?? 'fasting',
          oneWord: todayCheckIn?.oneWord ?? '',
          didCardio: todayCheckIn?.didCardio ?? false,
          didResistance: todayCheckIn?.didResistance ?? false,
          claudeDirective: todayCheckIn?.claudeDirective ?? null,
          notes: (inp.notes as string) ?? todayCheckIn?.notes ?? '',
          digestion: todayCheckIn?.digestion ?? 5,
          createdAt: todayCheckIn?.createdAt || new Date().toISOString(),
        };
        if (todayCheckIn) updateCheckIn(todayCheckIn.id, entry); else addCheckIn(entry);
        await resolveAction(true, 'Check-in logged successfully.');

      } else if (tool === 'log_sprint') {
        const session: SprintSession = {
          id: crypto.randomUUID(),
          date: today(),
          type: 'treadmill',
          rounds: input.rounds as number,
          distance: (input.distance as number | undefined) ?? null,
          rpe: input.rpe as number,
          workSeconds: 15,
          restSeconds: 45,
          avgCalPerRound: null,
          peakCalPerRound: null,
          totalCalories: null,
          avgHeartRate: null,
          peakHeartRate: null,
          notes: '',
          createdAt: new Date().toISOString(),
        };
        addSprint(session);
        await resolveAction(true, 'Sprint session logged.');

      } else if (tool === 'update_goal') {
        const currentSettings = getSettings<AppSettings>('settings');
        if (currentSettings) {
          setSettings('settings', { ...currentSettings, [input.field as string]: input.value });
        }
        await resolveAction(true, 'Goal updated.');
      } else {
        await resolveAction(true, 'Done.');
      }
    } catch {
      await resolveAction(false, 'Failed to save — please try again.');
    }
  };

  const handleCancel = () => resolveAction(false, 'User cancelled.');

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
          >
            {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button onClick={() => navigate('/settings')} className="p-2 text-muted">
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <ChatWindow
        messages={messages}
        onSpeak={(content) => { window.speechSynthesis?.cancel(); speak(content); }}
      />

      {/* Quick actions */}
      <QuickActions onSelect={sendMessage} disabled={isStreaming} />

      {/* Pending action confirmation card */}
      {pendingAction && (
        <div
          className="mx-3 mb-2 rounded-xl p-4"
          style={{ background: '#1a1a1a', border: '2px solid rgba(201,150,58,0.5)' }}
        >
          <p className="font-display font-bold text-[10px] tracking-widest mb-2" style={{ color: '#c9963a' }}>
            PROPOSED UPDATE
          </p>
          <p className="text-sm leading-snug mb-4 whitespace-pre-line" style={{ color: '#f0ece4' }}>
            {pendingAction.displayText}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 py-2.5 rounded-xl font-display font-bold text-sm tracking-wide text-muted flex items-center justify-center gap-1.5"
              style={{ background: '#2a2a2a' }}
            >
              <X size={14} /> CANCEL
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-2.5 rounded-xl font-display font-bold text-sm tracking-wide flex items-center justify-center gap-1.5"
              style={{ background: '#4a7c59', color: '#fff' }}
            >
              <Check size={14} /> CONFIRM
            </button>
          </div>
        </div>
      )}

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
            defaultValue=""
            onChange={e => { textState.current = e.target.value; }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText(); }
            }}
            placeholder="Message your coach..."
            rows={1}
            className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm outline-none max-h-32"
            style={{ background: '#222', color: '#f0ece4', minHeight: '40px' }}
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
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}

          <button
            onClick={handleSendText}
            disabled={isStreaming}
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
