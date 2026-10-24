import { Search, Plus, MessageCircle } from "lucide-react";



export default function Sidebar({ conversations, selectedChatId, onSelectChat }) {
  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-r border-white/10 bg-[#101426] text-white">
      <div className="flex items-center justify-between border-b border-white/10 p-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            KNOT<span className="text-violet-400">.</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">Stay connected.</p>
        </div>
        <button className="rounded-xl bg-violet-500/15 p-2 text-violet-300 transition hover:bg-violet-500/25">
          <Plus size={20} />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="px-4 pb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
        Messages
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-3">
        {conversations.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
              selectedChatId === chat.id
                ? "bg-violet-500/15"
                : "hover:bg-white/5"
            }`}
          >
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-500/20 font-semibold text-violet-300">
              {chat.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
              {chat.online && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#101426] bg-emerald-400" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">
                  {chat.name}
                </span>
                <span className="shrink-0 text-xs text-slate-500">
                  {chat.time}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-slate-400">
                {chat.message}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500 font-semibold">
            Y
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">Your Profile</p>
            <p className="text-xs text-emerald-400">Online</p>
          </div>
          <MessageCircle size={18} className="text-slate-400" />
        </div>
      </div>
    </aside>
  );
}
