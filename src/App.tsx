import React, { useState, useEffect, useRef } from 'react';
import { ChatSession, Message } from './types';
import ChatSidebar from './components/ChatSidebar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import EmptyState from './components/EmptyState';
import { Menu, Plus, Sparkles, AlertCircle } from 'lucide-react';

const STORAGE_KEY = 'aus_ai_sessions_v1';

function createNewSession(): ChatSession {
  const timestamp = Date.now();
  return {
    id: `session_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
    title: 'New Chat',
    messages: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load sessions from storage', e);
    }
    return [createNewSession()];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || '';
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions to storage', e);
    }
  }, [sessions]);

  // Scroll to bottom when messages update or streaming
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom(isStreaming ? 'auto' : 'smooth');
  }, [activeSession?.messages, isStreaming]);

  // Check health on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (!data.hasKey) {
          setConnectionError(
            'GEMINI_API_KEY is not configured in the server environment. Please set it in Settings > Secrets.'
          );
        } else {
          setConnectionError(null);
        }
      })
      .catch((err) => {
        console.warn('Health check failed', err);
      });
  }, []);

  const handleNewChat = () => {
    if (isLoading && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setIsStreaming(false);
    }
    const newSession = createNewSession();
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInput('');
  };

  const handleSelectSession = (id: string) => {
    if (isLoading && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setIsStreaming(false);
    }
    setActiveSessionId(id);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fresh = createNewSession();
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (id === activeSessionId) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsStreaming(false);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || isLoading) return;

    setInput('');

    const userMessage: Message = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const targetSessionId = activeSession.id;

    // Build updated messages array
    const updatedMessages = [...activeSession.messages, userMessage];

    // Determine title if this is the first message
    const newTitle =
      activeSession.messages.length === 0
        ? text.slice(0, 36) + (text.length > 36 ? '...' : '')
        : activeSession.title;

    // Placeholder model message
    const aiMessageId = `msg_ai_${Date.now()}`;
    const initialAiMessage: Message = {
      id: aiMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === targetSessionId) {
          return {
            ...s,
            title: newTitle,
            messages: [...updatedMessages, initialAiMessage],
            updatedAt: Date.now(),
          };
        }
        return s;
      })
    );

    setIsLoading(true);
    setIsStreaming(false);

    // Prepare history payload for server
    const historyPayload = updatedMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          messages: historyPayload,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errDetails = 'Request failed';
        try {
          const errJson = await response.json();
          errDetails = errJson.error || errDetails;
        } catch {
          errDetails = `Server error ${response.status}`;
        }
        throw new Error(errDetails);
      }

      if (!response.body) {
        throw new Error('Response body is unavailable');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      setIsStreaming(true);

      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last incomplete line in buffer
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const dataPayload = trimmed.replace(/^data:\s*/, '');
          if (dataPayload === '[DONE]') {
            break;
          }

          try {
            const parsed = JSON.parse(dataPayload);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              accumulatedText += parsed.text;
              setSessions((prev) =>
                prev.map((s) => {
                  if (s.id === targetSessionId) {
                    return {
                      ...s,
                      messages: s.messages.map((m) =>
                        m.id === aiMessageId ? { ...m, content: accumulatedText } : m
                      ),
                    };
                  }
                  return s;
                })
              );
            }
          } catch (jsonErr: any) {
            if (jsonErr.message && !jsonErr.message.includes('JSON')) {
              throw jsonErr;
            }
          }
        }
      }

      // If finished with empty text, provide fallback
      if (!accumulatedText.trim()) {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === targetSessionId) {
              return {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === aiMessageId
                    ? {
                        ...m,
                        content: 'No response received from the model. Please try again.',
                        isError: true,
                      }
                    : m
                ),
              };
            }
            return s;
          })
        );
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // User aborted generation
        console.log('Generation stopped by user');
      } else {
        console.error('Chat error:', error);
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === targetSessionId) {
              return {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === aiMessageId
                    ? {
                        ...m,
                        content: error?.message || 'Unable to connect to Gemini. Please try again.',
                        isError: true,
                      }
                    : m
                ),
              };
            }
            return s;
          })
        );
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleRetry = (failedMessageId: string) => {
    // Find the message index
    const msgIndex = activeSession.messages.findIndex((m) => m.id === failedMessageId);
    if (msgIndex <= 0) return;

    const precedingUserMessage = activeSession.messages[msgIndex - 1];
    if (!precedingUserMessage || precedingUserMessage.role !== 'user') return;

    // Remove the failed message and user message from session, then resend
    const cleanedMessages = activeSession.messages.slice(0, msgIndex - 1);
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id ? { ...s, messages: cleanedMessages } : s
      )
    );

    handleSendMessage(precedingUserMessage.content);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 antialiased font-sans">
      {/* Sidebar navigation */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSession.id}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Chat View */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative bg-zinc-950">
        {/* Top Navbar */}
        <header className="h-14 sm:h-16 border-b border-zinc-800/80 px-3 sm:px-6 flex items-center justify-between shrink-0 bg-zinc-950/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              id="btn-open-sidebar"
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 md:hidden cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-sm sm:text-base text-zinc-100 truncate">
                {activeSession.title}
              </span>
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Gemini 3.8 Flash</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-header-new-chat"
              type="button"
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 text-xs sm:text-sm font-medium transition cursor-pointer"
              title="Start a new chat"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* Global Connection/API Key Warning if missing */}
        {connectionError && (
          <div className="bg-amber-950/40 border-b border-amber-800/50 px-4 py-2 text-xs sm:text-sm text-amber-200 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{connectionError}</span>
          </div>
        )}

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {activeSession.messages.length === 0 ? (
            <EmptyState onSelectPrompt={(prompt) => handleSendMessage(prompt)} />
          ) : (
            <div className="flex-1 py-4">
              {activeSession.messages.map((message, index) => {
                const isLast = index === activeSession.messages.length - 1;
                const isCurrentStreaming = isLast && isStreaming && message.role === 'model';
                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isStreaming={isCurrentStreaming}
                    onRetry={handleRetry}
                  />
                );
              })}

              {/* Thinking indicator while waiting for the first token */}
              {isLoading && !isStreaming && (
                <div className="w-full py-4 px-3 sm:px-6 bg-zinc-900/40 border-y border-zinc-800/40">
                  <div className="max-w-3xl mx-auto flex gap-3 sm:gap-4 items-center">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-medium shadow-sm">
                      <Sparkles className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400 text-xs sm:text-sm">
                      <span>AUS AI is thinking</span>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Fixed Input Bar */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={() => handleSendMessage()}
          isLoading={isLoading}
          onStop={handleStop}
        />
      </main>
    </div>
  );
}
