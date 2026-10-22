
import { useState } from "react";
import { Paperclip, Send } from "lucide-react";

export default function MessageInput({ onSend }) {
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) return;

    onSend(trimmedMessage);
    setMessage("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 border-t border-white/10 bg-[#0b1020] p-4"
    >
      <button
        type="button"
        aria-label="Attach a file"
        className="rounded-xl p-2.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
      >
        <Paperclip size={20} />
      </button>

      <input
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Message..."
        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500/60"
      />

      <button
        type="submit"
        disabled={!message.trim()}
        aria-label="Send message"
        className="rounded-xl bg-violet-500 p-3 text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Send size={18} />
      </button>
    </form>
  );
}
