
import { useEffect, useRef, useState } from "react";
import {
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  Pencil,
  Trash2,
  X,
  Check as Save,
} from "lucide-react";

import MessageInput from "./MessageInput";

function MessageStatus({ status }) {
  if (status === "read") {
    return <CheckCheck size={15} className="text-sky-400" />;
  }

  if (status === "delivered") {
    return <CheckCheck size={15} className="text-slate-300" />;
  }

  return <Check size={15} className="text-slate-300" />;
}

export default function ChatWindow({
  selectedChat,
  messages,
  onSendMessage,
  onTypingChange,
  onEditMessage,
  onDeleteForEveryone,
  onDeleteForMe,
  sending = false,
  isTyping = false,
  typingUserName = "",
}) {
  const messagesEndRef = useRef(null);

  const [activeMenu, setActiveMenu] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Automatically scroll to the latest message.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isTyping]);

  // Start editing a message.
  function startEditing(message) {
    setEditingMessageId(message.id);
    setEditText(message.text);
    setActiveMenu(null);
  }

  // Cancel editing.
  function cancelEditing() {
    setEditingMessageId(null);
    setEditText("");
  }

  // Save edited message.
  async function saveEditedMessage(messageId) {
    const trimmedText = editText.trim();

    if (!trimmedText || actionLoading) return;

    setActionLoading(true);

    try {
      await onEditMessage(messageId, trimmedText);
      cancelEditing();
    } catch (err) {
      console.error("Could not save edited message:", err);
    } finally {
      setActionLoading(false);
    }
  }

  // Delete message for everyone.
  async function handleDeleteEveryone(messageId) {
    if (actionLoading) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this message for everyone?"
    );

    if (!confirmed) return;

    setActionLoading(true);
    setActiveMenu(null);

    try {
      await onDeleteForEveryone(messageId);
    } catch (err) {
      console.error("Could not delete message for everyone:", err);
    } finally {
      setActionLoading(false);
    }
  }

  // Delete message only for me.
  async function handleDeleteMe(messageId) {
    if (actionLoading) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this message for yourself?"
    );

    if (!confirmed) return;

    setActionLoading(true);
    setActiveMenu(null);

    try {
      await onDeleteForMe(messageId);
    } catch (err) {
      console.error("Could not delete message for yourself:", err);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#0b1020] text-white">

      {/* Chat Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-500/20 font-semibold text-violet-300">
            {selectedChat.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)}
          </div>

          <div>
            <h2 className="font-semibold">{selectedChat.name}</h2>

            <p
              className={`mt-1 text-xs ${
                isTyping
                  ? "text-violet-400"
                  : selectedChat.online
                    ? "text-emerald-400"
                    : "text-slate-400"
              }`}
            >
              {isTyping
                ? `${typingUserName} is typing...`
                : selectedChat.online
                  ? "Online"
                  : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <button
            type="button"
            aria-label="Voice call"
            className="rounded-xl p-2.5 transition hover:bg-white/5 hover:text-white"
          >
            <Phone size={19} />
          </button>

          <button
            type="button"
            aria-label="Video call"
            className="rounded-xl p-2.5 transition hover:bg-white/5 hover:text-white"
          >
            <Video size={19} />
          </button>

          <button
            type="button"
            aria-label="More options"
            className="rounded-xl p-2.5 transition hover:bg-white/5 hover:text-white"
          >
            <MoreVertical size={19} />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">

        <div className="my-4 text-center text-xs text-slate-500">
          TODAY
        </div>

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.mine ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`flex max-w-[75%] flex-col ${
                message.mine ? "items-end" : "items-start"
              }`}
            >
              {/* Sender and time */}
              <div
                className={`mb-1 flex items-center gap-2 text-xs ${
                  message.mine ? "flex-row-reverse" : ""
                }`}
              >
                <span className="font-medium text-slate-300">
                  {message.sender}
                </span>

                <span className="text-slate-500">
                  {message.time}
                </span>
              </div>

              {/* Editing interface */}
              {editingMessageId === message.id ? (
                <div className="w-full min-w-[220px] rounded-xl border border-violet-400/30 bg-[#151c30] p-3">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    maxLength={5000}
                    rows={3}
                    autoFocus
                    className="w-full resize-none rounded-lg border border-white/10 bg-[#0b1020] p-2 text-sm text-white outline-none focus:border-violet-400"
                  />

                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={actionLoading}
                      className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/10"
                    >
                      <X size={14} />
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => saveEditedMessage(message.id)}
                      disabled={!editText.trim() || actionLoading}
                      className="flex items-center gap-1 rounded-lg bg-violet-500 px-3 py-2 text-xs font-medium text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save size={14} />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Message bubble and actions */}
                  <div className="group relative flex max-w-full items-center gap-2">
                    <div
                      className={`break-words rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        message.mine
                          ? "rounded-br-md bg-violet-500 text-white"
                          : "rounded-bl-md border border-white/10 bg-white/5 text-slate-200"
                      }`}
                    >
                      {message.text}
                    </div>

                    {/* Message action menu */}
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        aria-label="Message actions"
                        onClick={() =>
                          setActiveMenu(
                            activeMenu === message.id ? null : message.id
                          )
                        }
                        className="rounded-lg p-1.5 text-slate-500 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100 focus:opacity-100"
                      >
                        <MoreVertical size={17} />
                      </button>

                      {activeMenu === message.id && (
                        <div
                          className={`absolute top-8 z-20 w-48 rounded-xl border border-white/10 bg-[#151c30] p-1 shadow-xl ${
                            message.mine ? "right-0" : "left-0"
                          }`}
                        >
                          {message.mine && (
                            <button
                              type="button"
                              onClick={() => startEditing(message)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
                            >
                              <Pencil size={15} />
                              Edit message
                            </button>
                          )}

                          {message.mine && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteEveryone(message.id)
                              }
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 size={15} />
                              Delete for everyone
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteMe(message.id)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
                          >
                            <Trash2 size={15} />
                            Delete for me
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Edited label */}
                  {message.isEdited && (
                    <span className="mt-1 text-[10px] text-slate-500">
                      Edited
                    </span>
                  )}
                </>
              )}

              {/* Message status */}
              {message.mine && (
                <div className="mt-1 flex items-center gap-1">
                  <MessageStatus status={message.status} />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:300ms]" />
              </div>

              <span className="text-xs text-slate-400">
                {typingUserName} is typing...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="shrink-0">
        <MessageInput
          onSend={onSendMessage}
          onTypingChange={onTypingChange}
          disabled={sending}
        />
      </div>
    </section>
  );
}
