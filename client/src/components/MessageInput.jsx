
import { useRef, useState } from "react";
import { Paperclip, Send } from "lucide-react";

export default function MessageInput({
  onSend,
  onTypingChange,
  disabled = false,
}) {
  const [message, setMessage] = useState("");
  const typingTimer = useRef(null);

  function handleChange(event) {
    const value = event.target.value;

    setMessage(value);

    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }

    if (value.trim()) {
      // Notify that the user is typing.
      onTypingChange?.(true);

      // Stop typing after 1 second of inactivity.
      typingTimer.current = setTimeout(() => {
        onTypingChange?.(false);
      }, 1000);
    } else {
      onTypingChange?.(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || disabled) return;

    // Stop the typing indicator when sending.
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }

    onTypingChange?.(false);

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
        disabled={disabled}
        className="rounded-xl p-2.5 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
      >
        <Paperclip size={20} />
      </button>

      <input
        value={message}
        onChange={handleChange}
        placeholder="Message..."
        disabled={disabled}
        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500/60 disabled:opacity-50"
      />

      <button
        type="submit"
        disabled={!message.trim() || disabled}
        aria-label="Send message"
        className="rounded-xl bg-violet-500 p-3 text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Send size={18} />
      </button>
    </form>
  );
}
