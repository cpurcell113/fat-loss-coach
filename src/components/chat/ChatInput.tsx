import { useState, useRef } from 'react';
import { Send } from 'lucide-react';

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 p-3 bg-surface border-t border-gold/15">
      <textarea
        ref={inputRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message your coach..."
        rows={1}
        className="flex-1 resize-none bg-surface-alt rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/30 max-h-32 min-h-[40px]"
        style={{ height: Math.min(128, Math.max(40, text.split('\n').length * 20)) }}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        className="w-10 h-10 rounded-xl bg-gold text-surface-dark flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform shrink-0"
      >
        <Send size={18} />
      </button>
    </div>
  );
}
