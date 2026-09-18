import { Sparkles, Code2, Compass, PenTool, Lightbulb } from 'lucide-react';

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

const STARTER_PROMPTS = [
  {
    icon: Lightbulb,
    title: 'Explain a Concept',
    description: 'Explain quantum computing in simple terms with everyday analogies',
    prompt: 'Can you explain quantum computing in simple terms using everyday analogies?',
  },
  {
    icon: Code2,
    title: 'Code & Debug',
    description: 'Help write a TypeScript utility to debounce an asynchronous function',
    prompt: 'Write a clean TypeScript utility function to debounce an async API call with proper types.',
  },
  {
    icon: PenTool,
    title: 'Writing & Editing',
    description: 'Draft a polite and professional follow-up email after an interview',
    prompt: 'Draft a warm, polite, and professional follow-up email after a great job interview.',
  },
  {
    icon: Compass,
    title: 'Brainstorm Ideas',
    description: 'Brainstorm unique modern ideas for a personal portfolio project',
    prompt: 'Give me 4 creative, modern web application ideas that stand out on a portfolio.',
  },
];

export default function EmptyState({ onSelectPrompt }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-3xl mx-auto text-center">
      {/* Brand Icon */}
      <div className="relative mb-5">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-zinc-800 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950/40">
          <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-zinc-950 text-[10px] font-bold uppercase tracking-wider">
          AI
        </div>
      </div>

      {/* Greeting */}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 mb-2">
        How can I help you today?
      </h1>
      <p className="text-zinc-400 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
        I'm <span className="text-emerald-400 font-medium">AUS AI</span>, your intelligent assistant powered by Gemini. Ask me anything from code and writing to explanations and brainstorming.
      </p>

      {/* Quick Prompts Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        {STARTER_PROMPTS.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              id={`starter-prompt-${index}`}
              type="button"
              onClick={() => onSelectPrompt(item.prompt)}
              className="group p-3.5 sm:p-4 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 transition-all duration-150 cursor-pointer text-left flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-zinc-200 group-hover:text-emerald-300 transition-colors">
                  {item.title}
                </span>
              </div>
              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
