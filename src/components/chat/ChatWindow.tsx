import { useEffect, useRef } from 'react';
import type { ChatMessage as ChatMessageType } from '../../types';
import { ChatMessage } from './ChatMessage';

export function ChatWindow({ messages }: { messages: ChatMessageType[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, messages[messages.length - 1]?.content]);

  return (
    <div className="flex-1 overflow-y-auto chat-scroll px-3 py-4">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
          <div className="text-4xl mb-4">💪</div>
          <h2 className="text-lg font-semibold mb-2">Your AI Coach</h2>
          <p className="text-sm text-muted">
            Ask me anything about your cut. What to eat today, how to handle a restaurant meal, whether to adjust your macros - I've got your data and I'll give you specific answers.
          </p>
        </div>
      )}
      {messages.map(msg => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
