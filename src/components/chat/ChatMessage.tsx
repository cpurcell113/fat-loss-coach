import { Volume2, VolumeX } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../../types';

export function ChatMessage({
  message,
  onSpeak,
  isActiveSpeaker,
}: {
  message: ChatMessageType;
  onSpeak?: () => void;
  isActiveSpeaker?: boolean;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-gold/90 text-surface-dark rounded-br-md'
            : 'bg-surface rounded-bl-md border border-gold/15'
        }`}
      >
        {message.content || (
          <span className="inline-flex gap-1">
            <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        )}
        {!isUser && message.content && onSpeak && (
          <div className="mt-2 flex justify-end">
            <button
              onClick={onSpeak}
              className="p-1 rounded-md transition-opacity"
              style={{ opacity: isActiveSpeaker ? 1 : 0.4 }}
              title={isActiveSpeaker ? 'Stop' : 'Play message'}
            >
              {isActiveSpeaker
                ? <VolumeX size={13} style={{ color: '#c9963a' }} />
                : <Volume2 size={13} style={{ color: '#c9963a' }} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
