import { useEffect, useRef } from 'react';
import type { ChatMessage as ChatMessageType } from '../../types';
import { ChatMessage } from './ChatMessage';

export function ChatWindow({
  messages,
  onSpeak,
  speakingMsgId,
  isSpeaking,
}: {
  messages: ChatMessageType[];
  onSpeak?: (id: string, content: string) => void;
  speakingMsgId?: string | null;
  isSpeaking?: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, messages[messages.length - 1]?.content]);

  return (
    <div className="flex-1 overflow-y-auto chat-scroll px-3 py-4">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
          <h2 className="text-2xl font-bold text-gold mb-2">Your AI Coach</h2>
          <div className="w-12 h-px bg-gold/30 mx-auto mb-3" />
          <p className="text-sm text-muted">
            Ask me anything about your cut. What to eat today, how to handle a restaurant meal, whether to adjust your macros - I've got your data and I'll give you specific answers.
          </p>
        </div>
      )}
      {messages.map(msg => (
        <ChatMessage
          key={msg.id}
          message={msg}
          onSpeak={onSpeak && msg.role === 'assistant' ? () => onSpeak(msg.id, msg.content) : undefined}
          isActiveSpeaker={speakingMsgId === msg.id && !!isSpeaking}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
