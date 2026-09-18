import { Plus, MessageSquare, Trash2, X, Sparkles, ShieldCheck } from 'lucide-react';
import { ChatSession } from '../types';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isOpen,
  onClose,
}: ChatSidebarProps) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-800/80 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="p-4 flex items-center justify-between border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-zinc-100 text-base tracking-tight">AUS AI</span>
                <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                  CHAT
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Powered by Gemini</p>
            </div>
          </div>

          <button
            id="btn-close-sidebar-mobile"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 md:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            id="btn-new-chat-sidebar"
            type="button"
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) {
                onClose();
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-800 hover:border-zinc-700 transition-all text-sm font-medium shadow-sm hover:shadow active:scale-[0.99] cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Recent Conversations
          </div>

          {sessions.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-zinc-400">
              No previous chats yet
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  id={`session-item-${session.id}`}
                  onClick={() => {
                    onSelectSession(session.id);
                    if (window.innerWidth < 768) {
                      onClose();
                    }
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-sm cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-zinc-800/90 text-zinc-100 font-medium border border-zinc-700/60'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <MessageSquare
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-400'
                      }`}
                    />
                    <span className="truncate text-xs sm:text-sm">{session.title}</span>
                  </div>

                  <button
                    id={`btn-delete-session-${session.id}`}
                    type="button"
                    onClick={(e) => onDeleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded hover:bg-zinc-700/60 text-zinc-500 hover:text-rose-400 transition-all cursor-pointer"
                    title="Delete chat"
                    aria-label={`Delete chat ${session.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info: Server-Side Security badge */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60 text-[11px] text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Server-side secured API</span>
          </div>
        </div>
      </aside>
    </>
  );
}
