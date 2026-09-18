import React, { useRef, useEffect } from 'react';
import { Send, Square, Sparkles } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  onStop?: () => void;
  placeholder?: string;
}

export default function ChatInput({
  input,
  setInput,
  onSend,
  isLoading,
  onStop,
  placeholder = 'Message AUS AI...',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize textarea height as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 160; // max ~6 lines
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="w-full bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent pt-4 pb-4 sm:pb-6 px-3 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all duration-150">
          <div className="flex items-end px-3 py-2.5 sm:px-4 sm:py-3 gap-2">
            <textarea
              ref={textareaRef}
              id="chat-input-textarea"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 max-h-40 resize-none bg-transparent text-zinc-100 placeholder-zinc-500 text-sm sm:text-base outline-none leading-relaxed py-1 px-0"
              disabled={isLoading && !onStop}
            />

            {isLoading && onStop ? (
              <button
                id="btn-stop-generating"
                type="button"
                onClick={onStop}
                className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center transition-colors cursor-pointer"
                title="Stop generation"
                aria-label="Stop generation"
              >
                <Square className="w-4 h-4 fill-current text-zinc-300" />
              </button>
            ) : (
              <button
                id="btn-send-message"
                type="button"
                onClick={onSend}
                disabled={!input.trim() || isLoading}
                className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  input.trim() && !isLoading
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/20 active:scale-95'
                    : 'bg-zinc-800/80 text-zinc-600 cursor-not-allowed'
                }`}
                title="Send message"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Footer Info inside input box */}
          <div className="flex items-center justify-between px-3.5 pb-2 pt-0.5 text-[11px] text-zinc-500 border-t border-zinc-800/60 select-none">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-400/80" />
              <span>AUS AI is powered by Gemini 3.8 Flash</span>
            </div>
            <span className="hidden sm:inline-block text-zinc-500 font-mono">
              ↵ Enter to send · Shift+↵ for new line
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
