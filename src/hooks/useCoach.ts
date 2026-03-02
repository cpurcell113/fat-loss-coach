import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, BodyCompEntry, NutritionEntry, DailyCheckIn, SprintSession, Alert } from '../types';
import { COACH_SYSTEM_PROMPT } from '../constants/coach-prompt';
import { buildCoachContext } from '../utils/context-builder';
import { getCollection, setCollection } from '../data/storage';

const MAX_HISTORY = 50;
const STORAGE_KEY = 'chat_history';

function loadHistory(): ChatMessage[] {
  return getCollection<ChatMessage>(STORAGE_KEY);
}
function saveHistory(messages: ChatMessage[]) {
  setCollection(STORAGE_KEY, messages.slice(-MAX_HISTORY));
}

export type PendingAction = {
  toolUseId: string;
  tool: string;
  input: Record<string, unknown>;
  displayText: string;
  apiContext: Array<{ role: 'user' | 'assistant'; content: string | unknown[] }>;
};

const COACH_TOOLS = [
  {
    name: 'log_nutrition',
    description: "Log or update today's nutrition macros in the app. Use when user tells you their macros or asks you to log food intake.",
    input_schema: {
      type: 'object' as const,
      properties: {
        protein: { type: 'number', description: 'Protein in grams' },
        carbs: { type: 'number', description: 'Carbohydrates in grams' },
        fats: { type: 'number', description: 'Fat in grams' },
      },
      required: ['protein', 'carbs', 'fats'],
    },
  },
  {
    name: 'log_checkin',
    description: "Log today's morning check-in wellness metrics. Use when user shares mood, energy, sleep, or stress scores.",
    input_schema: {
      type: 'object' as const,
      properties: {
        mood: { type: 'number', description: 'Mood score 1-10' },
        energyLevel: { type: 'number', description: 'Energy level 1-10' },
        sleepHours: { type: 'number', description: 'Hours of sleep' },
        sleepQuality: { type: 'number', description: 'Sleep quality 1-5' },
        soreness: { type: 'number', description: 'Muscle soreness 1-10' },
        hunger: { type: 'number', description: 'Hunger level 1-10' },
        stressLevel: { type: 'number', description: 'Stress level 1-10' },
        notes: { type: 'string', description: 'Additional notes' },
      },
      required: [],
    },
  },
  {
    name: 'log_sprint',
    description: 'Log a completed echo sprint session. Use when user reports finishing sprints.',
    input_schema: {
      type: 'object' as const,
      properties: {
        rounds: { type: 'number', description: 'Number of rounds completed (max 20)' },
        distance: { type: 'number', description: 'Distance in miles (optional)' },
        rpe: { type: 'number', description: 'Rating of perceived exertion 1-10' },
      },
      required: ['rounds', 'rpe'],
    },
  },
  {
    name: 'update_goal',
    description: 'Update a body composition target in app settings.',
    input_schema: {
      type: 'object' as const,
      properties: {
        field: {
          type: 'string',
          enum: ['targetWeight', 'targetBfPercent'],
          description: 'Which goal to update',
        },
        value: { type: 'number', description: 'New target value' },
      },
      required: ['field', 'value'],
    },
  },
];

async function callApi(body: object): Promise<any> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${res.status}`);
  }
  return res.json();
}

function formatActionDisplay(tool: string, input: Record<string, unknown>): string {
  if (tool === 'log_nutrition') {
    const p = input.protein as number;
    const c = input.carbs as number;
    const f = input.fats as number;
    const cal = Math.round(p * 4 + c * 4 + f * 9);
    return `Log Today's Nutrition\nProtein: ${p}g · Carbs: ${c}g · Fats: ${f}g\nCalories: ~${cal}`;
  }
  if (tool === 'log_checkin') {
    const parts: string[] = [];
    if (input.mood) parts.push(`Mood ${input.mood}/10`);
    if (input.energyLevel) parts.push(`Energy ${input.energyLevel}/10`);
    if (input.sleepHours) parts.push(`Sleep ${input.sleepHours}h`);
    if (input.sleepQuality) parts.push(`Quality ${input.sleepQuality}/5`);
    if (input.stressLevel) parts.push(`Stress ${input.stressLevel}/10`);
    if (input.notes) parts.push(`"${input.notes}"`);
    return `Log Today's Check-in\n${parts.length ? parts.join(' · ') : 'Update wellness metrics'}`;
  }
  if (tool === 'log_sprint') {
    const dist = input.distance ? ` · ${input.distance} miles` : '';
    return `Log Sprint Session\n${input.rounds} rounds${dist} · RPE ${input.rpe}/10`;
  }
  if (tool === 'update_goal') {
    const labels: Record<string, string> = {
      targetWeight: 'Target Weight (lbs)',
      targetBfPercent: 'Target Body Fat %',
    };
    return `Update Goal\n${labels[input.field as string] || input.field}: ${input.value}`;
  }
  return `App Update: ${tool}`;
}

export function useCoach(
  bodyComp: BodyCompEntry[],
  nutrition: NutritionEntry[],
  checkIns: DailyCheckIn[],
  sprints: SprintSession[],
  alerts: Alert[],
) {
  const [messages, setMessages] = useState<ChatMessage[]>(loadHistory);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const contextRef = useRef({ bodyComp, nutrition, checkIns, sprints, alerts });
  contextRef.current = { bodyComp, nutrition, checkIns, sprints, alerts };

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => {
      const updated = [...prev, userMsg];
      saveHistory(updated);
      return updated;
    });

    setIsLoading(true);
    const assistantId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: assistantId, role: 'assistant', content: '', timestamp: new Date().toISOString(),
    }]);

    try {
      const { bodyComp, nutrition, checkIns, sprints, alerts } = contextRef.current;
      const context = buildCoachContext(bodyComp, nutrition, checkIns, sprints, alerts);
      const systemPrompt = `${COACH_SYSTEM_PROMPT}\n\n---\n${context}`;

      const apiMessages = [
        ...loadHistory().slice(-18),
        userMsg,
      ].map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const res = await callApi({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: apiMessages,
        tools: COACH_TOOLS,
      });

      if (res.stop_reason === 'tool_use') {
        const textBlock = res.content.find((b: any) => b.type === 'text');
        const toolBlock = res.content.find((b: any) => b.type === 'tool_use');

        const replyText = textBlock?.text || "I'll update that for you — confirm below.";
        setMessages(prev => {
          const updated = prev.map(m => m.id === assistantId ? { ...m, content: replyText } : m);
          saveHistory(updated);
          return updated;
        });

        if (toolBlock) {
          setPendingAction({
            toolUseId: toolBlock.id,
            tool: toolBlock.name,
            input: toolBlock.input,
            displayText: formatActionDisplay(toolBlock.name, toolBlock.input),
            apiContext: [
              ...apiMessages,
              { role: 'assistant' as const, content: res.content },
            ],
          });
        }
      } else {
        const textBlock = res.content.find((b: any) => b.type === 'text');
        const fullText = textBlock?.text ?? '';
        setMessages(prev => {
          const updated = prev.map(m => m.id === assistantId ? { ...m, content: fullText } : m);
          saveHistory(updated);
          return updated;
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setMessages(prev => {
        const updated = prev.map(m =>
          m.id === assistantId
            ? { ...m, content: `Error: ${errorMsg}` }
            : m
        );
        saveHistory(updated);
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resolveAction = useCallback(async (success: boolean, resultMessage: string) => {
    if (!pendingAction) return;
    const action = pendingAction;
    setPendingAction(null);
    setIsLoading(true);

    const assistantId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: assistantId, role: 'assistant', content: '', timestamp: new Date().toISOString(),
    }]);

    try {
      const { bodyComp, nutrition, checkIns, sprints, alerts } = contextRef.current;
      const context = buildCoachContext(bodyComp, nutrition, checkIns, sprints, alerts);
      const systemPrompt = `${COACH_SYSTEM_PROMPT}\n\n---\n${context}`;

      const continuationMessages = [
        ...action.apiContext,
        {
          role: 'user' as const,
          content: [{
            type: 'tool_result',
            tool_use_id: action.toolUseId,
            content: success ? resultMessage : 'User cancelled this action.',
          }],
        },
      ];

      const res = await callApi({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system: systemPrompt,
        messages: continuationMessages,
        tools: COACH_TOOLS,
      });

      const textBlock = res.content.find((b: any) => b.type === 'text');
      const fullText = textBlock?.text ?? (success ? 'Done.' : 'No problem, nothing was changed.');

      setMessages(prev => {
        const updated = prev.map(m => m.id === assistantId ? { ...m, content: fullText } : m);
        saveHistory(updated);
        return updated;
      });
    } catch {
      setMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  }, [pendingAction]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    saveHistory([]);
  }, []);

  return { messages, isStreaming: isLoading, pendingAction, sendMessage, resolveAction, clearHistory };
}
