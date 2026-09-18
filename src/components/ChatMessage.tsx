import { useState } from 'react';
import { Message } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { Bot, User, Copy, Check, RotateCcw, AlertTriangle } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onRetry?: (messageId: string) => void;
}

export default function ChatMessage({ message, isStreaming, onRetry }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      id={`message-${message.id}`}
      className={`group w-full py-4 px-3 sm:px-6 transition-colors duration-200 ${
        isUser ? 'bg-transparent' : 'bg-zinc-900/40 border-y border-zinc-800/40'
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-3 sm:gap-4 items-start">
        {/* Avatar */}
        <div
          className={`shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-medium shadow-sm select-none ${
            isUser
              ? 'bg-zinc-800 text-zinc-300 border border-zinc-700/60'
              : message.isError
              ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
              : 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30'
          }`}
        >
          {isUser ? (
            <User className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          ) : message.isError ? (
            <AlertTriangle className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-rose-400" />
          ) : (
            <Bot className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-zinc-300">
                {isUser ? 'You' : 'AUS AI'}
              </span>
              {!isUser && !message.isError && (
                <span className="px-1.5 py-0.2 text-[10px] tracking-wide rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Gemini 3.8
                </span>
              )}
              <span className="text-[11px] text-zinc-500 font-mono">{formattedTime}</span>
            </div>

            {/* Quick Action Tools */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
              {!message.isError && (
                <button
                  id={`btn-copy-msg-${message.id}`}
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors cursor-pointer"
                  title="Copy message"
                  aria-label="Copy message text"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
              {message.isError && onRetry && (
                <button
                  id={`btn-retry-msg-${message.id}`}
                  type="button"
                  onClick={() => onRetry(message.id)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-rose-300 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 transition-colors cursor-pointer"
                  title="Retry generating response"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          </div>

          {/* Message Text / Markdown */}
          {message.isError ? (
            <div className="rounded-lg bg-rose-950/40 border border-rose-800/50 p-3 text-rose-200 text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-rose-300">Generation Failed</p>
                <p className="text-xs text-rose-300/80 leading-relaxed">{message.content}</p>
                {onRetry && (
                  <button
                    type="button"
                    onClick={() => onRetry(message.id)}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Try Again
                  </button>
                )}
              </div>
            </div>
          ) : isUser ? (
            <div className="text-zinc-200 text-sm md:text-base whitespace-pre-wrap leading-relaxed">
              {message.content}
            </div>
          ) : (
            <div className="relative">
              <MarkdownRenderer content={message.content} />
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-emerald-400 animate-pulse align-middle" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
