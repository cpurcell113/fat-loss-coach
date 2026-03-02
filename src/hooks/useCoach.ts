import { useState, useCallback, useRef } from 'react';
import Anthropic from '@anthropic-ai/sdk';
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

export function useCoach(
  apiKey: string,
  bodyComp: BodyCompEntry[],
  nutrition: NutritionEntry[],
  checkIns: DailyCheckIn[],
  sprints: SprintSession[],
  alerts: Alert[],
) {
  const [messages, setMessages] = useState<ChatMessage[]>(loadHistory);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (userText: string) => {
    if (!apiKey || !userText.trim()) return;

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

    setIsStreaming(true);
    const assistantId = crypto.randomUUID();

    try {
      const context = buildCoachContext(bodyComp, nutrition, checkIns, sprints, alerts);
      const systemPrompt = `${COACH_SYSTEM_PROMPT}\n\n---\n${context}`;

      // Build conversation history for API (last 20 messages for context window)
      const recentMessages = [...loadHistory(), userMsg].slice(-20);
      const apiMessages = recentMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

      const stream = client.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: apiMessages,
      });

      let fullText = '';

      // Add placeholder assistant message
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      }]);

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          fullText += event.delta.text;
          setMessages(prev =>
            prev.map(m => m.id === assistantId ? { ...m, content: fullText } : m)
          );
        }
      }

      // Save final message
      setMessages(prev => {
        const final = prev.map(m =>
          m.id === assistantId ? { ...m, content: fullText } : m
        );
        saveHistory(final);
        return final;
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setMessages(prev => {
        const updated = [...prev, {
          id: assistantId,
          role: 'assistant' as const,
          content: `Error: ${errorMsg}. Check your API key in Settings.`,
          timestamp: new Date().toISOString(),
        }];
        saveHistory(updated);
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [apiKey, bodyComp, nutrition, checkIns, sprints, alerts]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    saveHistory([]);
  }, []);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { messages, isStreaming, sendMessage, clearHistory, stopStreaming };
}
