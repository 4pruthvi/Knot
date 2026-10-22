
import { useState } from "react";
import { Phone, Video, MoreVertical } from "lucide-react";
import MessageInput from "./MessageInput";

const initialMessages = [
  { id: 1, sender: "Alex", text: "Hey! How's the new project going?", time: "10:42 AM", mine: false },
  { id: 2, sender: "You", text: "Pretty good! I'm building KNOT from scratch.", time: "10:43 AM", mine: true },
  { id: 3, sender: "Alex", text: "Nice! The UI is going to look great 🔥", time: "10:43 AM", mine: false },
];

export default function ChatWindow() {
  const [messages, setMessages] = useState(initialMessages);

  function sendMessage(text) {
    setMessages((previous) => [
      ...previous,
      {
        id: Date.now(),
        sender: "You",
        text,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        mine: true,
      },
    ]);
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[#0b1020] text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-500/20 font-semibold text-violet-300">
            AM
          </div>
          <div>
            <h2 className="font-semibold">Alex Morgan</h2>
            <p className="mt-1 text-xs text-emerald-400">Online</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <button aria-label="Voice call" className="rounded-xl p-2.5 hover:bg-white/5 hover:text-white">
            <Phone size={19} />
          </button>
          <button aria-label="Video call" className="rounded-xl p-2.5 hover:bg-white/5 hover:text-white">
            <Video size={19} />
          </button>
          <button aria-label="More options" className="rounded-xl p-2.5 hover:bg-white/5 hover:text-white">
            <MoreVertical size={19} />
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        <div className="my-4 text-center text-xs text-slate-500">
          TODAY
        </div>

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.mine ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[75%] ${message.mine ? "items-end" : "items-start"} flex flex-col`}>
              <div
                className={`mb-1 flex gap-2 text-xs ${
                  message.mine ? "flex-row-reverse" : ""
                }`}
              >
                <span className="font-medium text-slate-300">{message.sender}</span>
                <span className="text-slate-500">{message.time}</span>
              </div>

              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.mine
                    ? "rounded-br-md bg-violet-500 text-white"
                    : "rounded-bl-md border border-white/10 bg-white/5 text-slate-200"
                }`}
              >
                {message.text}
              </div>
            </div>
          </div>
        ))}
      </div>

      <MessageInput onSend={sendMessage} />
    </section>
  );
}
