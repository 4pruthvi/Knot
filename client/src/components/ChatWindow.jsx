import { useEffect, useRef, useState } from "react";
import {
  MoreVertical,
  Check,
  CheckCheck,
  Pencil,
  Trash2,
  X,
  Check as Save,
  FileText,
  Download,
  ArrowLeft,
  Forward,
  Search,
} from "lucide-react";

import MessageInput from "./MessageInput";

function MessageStatus({ status, isDark }) {
  if (status === "read") {
    return <CheckCheck size={15} className="text-sky-400" />;
  }

  if (status === "delivered") {
    return (
      <CheckCheck
        size={15}
        className={isDark ? "text-slate-300" : "text-slate-500"}
      />
    );
  }

  return (
    <Check size={15} className={isDark ? "text-slate-300" : "text-slate-500"} />
  );
}

function formatFileSize(bytes) {
  if (!bytes) return "";

  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getDownloadUrl(url) {
  if (!url) return "";
  return url.replace("/upload/", "/upload/fl_attachment/");
}

function MessageAttachment({ attachment, onImageClick }) {
  if (!attachment?.url) return null;

  if (attachment.type === "image") {
    return (
      <button
        type="button"
        onClick={() => onImageClick(attachment)}
        className="mb-2 block max-w-full overflow-hidden rounded-xl text-left"
        aria-label="Preview image"
      >
        <img
          src={attachment.url}
          alt={attachment.filename || "Shared image"}
          loading="lazy"
          className="max-h-72 max-w-full rounded-xl object-cover transition hover:opacity-90"
        />
      </button>
    );
  }

  return (
    <div className="mb-2 flex min-w-[200px] max-w-full items-center gap-2 rounded-xl border border-white/10 bg-black/10 p-2 sm:min-w-[220px] sm:gap-3 sm:p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-violet-400 sm:h-11 sm:w-11">
        <FileText size={23} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium sm:text-sm">
          {attachment.filename || "Shared file"}
        </p>

        <p className="mt-1 text-xs opacity-70">
          {formatFileSize(attachment.size)}
        </p>
      </div>

      <a
        href={getDownloadUrl(attachment.url)}
        download={attachment.filename || true}
        aria-label="Download attachment"
        title="Download file"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition hover:bg-white/10"
      >
        <Download size={18} />
      </a>
    </div>
  );
}

export default function ChatWindow({
  selectedChat,
  messages,
  availableUsers = [],
  onForwardMessage,
  onSendMessage,
  onSendAttachment,
  onTypingChange,
  onEditMessage,
  onDeleteForEveryone,
  onDeleteForMe,
  onBack,
  sending = false,
  isTyping = false,
  typingUserName = "",
  theme = "dark",
}) {
  const messagesEndRef = useRef(null);

  const isDark = theme === "dark";

  const [activeMenu, setActiveMenu] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Forwarding state.
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [forwardLoading, setForwardLoading] = useState(false);
  const [forwardError, setForwardError] = useState("");
  const [forwardSuccess, setForwardSuccess] = useState("");

  // Automatically scroll to the latest message.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isTyping]);

  // Close overlays with Escape.
  useEffect(() => {
    if (!previewImage && !forwardingMessage) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        if (!forwardLoading) {
          setPreviewImage(null);
          setForwardingMessage(null);
          setForwardError("");
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [previewImage, forwardingMessage, forwardLoading]);

  // Reset temporary UI when switching chats.
  useEffect(() => {
    setActiveMenu(null);
    setForwardingMessage(null);
    setForwardSuccess("");
    setForwardError("");
    setEditingMessageId(null);
  }, [selectedChat?._id]);

  function startEditing(message) {
    setEditingMessageId(message.id);
    setEditText(message.text);
    setActiveMenu(null);
  }

  function cancelEditing() {
    setEditingMessageId(null);
    setEditText("");
  }

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

  function openForwardModal(message) {
    setForwardingMessage(message);
    setRecipientSearch("");
    setForwardError("");
    setForwardSuccess("");
    setActiveMenu(null);
  }

  function closeForwardModal() {
    if (forwardLoading) return;

    setForwardingMessage(null);
    setRecipientSearch("");
    setForwardError("");
  }

  async function handleForward(receiver) {
    if (!forwardingMessage || forwardLoading) return;

    setForwardLoading(true);
    setForwardError("");

    try {
      await onForwardMessage(forwardingMessage.id, receiver._id);

      setForwardingMessage(null);
      setRecipientSearch("");
      setForwardSuccess(`Message forwarded to ${receiver.name}`);
    } catch (err) {
      setForwardError(err.message || "Failed to forward message.");
    } finally {
      setForwardLoading(false);
    }
  }

  const filteredRecipients = availableUsers.filter((user) =>
    user.name.toLowerCase().includes(recipientSearch.trim().toLowerCase())
  );

  const headerClass = isDark
    ? "border-white/10 bg-[#11182b] text-white"
    : "border-slate-200 bg-white text-slate-800";

  const secondaryTextClass = isDark ? "text-slate-400" : "text-slate-500";

  const iconButtonClass = isDark
    ? "text-slate-400 hover:bg-white/10 hover:text-white"
    : "text-slate-500 hover:bg-slate-100 hover:text-violet-600";

  const menuClass = isDark
    ? "border-white/10 bg-[#151c30] text-slate-200"
    : "border-slate-200 bg-white text-slate-700";

  const inputPanelClass = isDark
    ? "border-white/10 bg-[#151c30] text-white"
    : "border-slate-200 bg-white text-slate-800";

  return (
    <section
      className={`relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden transition-colors duration-300 ${
        isDark ? "bg-[#0b1020] text-white" : "bg-[#f8f7ff] text-slate-800"
      }`}
    >
      {/* Chat Header */}
      <header
        className={`flex shrink-0 items-center justify-between border-b px-3 py-3 transition-colors duration-300 sm:px-6 sm:py-4 ${headerClass}`}
      >
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to conversations"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition md:hidden ${iconButtonClass}`}
          >
            <ArrowLeft size={21} />
          </button>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-500/20 font-semibold text-violet-500 sm:h-11 sm:w-11">
            {selectedChat.avatar ? (
              <img
                src={selectedChat.avatar}
                alt={selectedChat.name}
                className="h-full w-full object-cover"
              />
            ) : (
              selectedChat.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
            )}
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold sm:text-base">
              {selectedChat.name}
            </h2>

            <p
              className={`mt-1 text-xs ${
                isTyping
                  ? "text-violet-500"
                  : selectedChat.online
                    ? "text-emerald-500"
                    : secondaryTextClass
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

        {/* Header Actions: only the three-dot menu */}
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            aria-label="More options"
            className={`rounded-xl p-2 transition sm:p-2.5 ${iconButtonClass}`}
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </header>

      {/* Forward Success Notification */}
      {forwardSuccess && (
        <div
          role="status"
          className="flex shrink-0 items-center justify-between gap-3 border-b border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-600"
        >
          <span>{forwardSuccess}</span>

          <button
            type="button"
            onClick={() => setForwardSuccess("")}
            aria-label="Dismiss notification"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Messages Area with Wallpaper */}
      <div
        className="relative min-h-0 flex-1 space-y-6 overflow-y-auto bg-cover bg-center bg-no-repeat p-3 transition-colors duration-300 sm:p-6"
        style={{
          backgroundImage: isDark
            ? "url('/chat-bg-dark.png')"
            : "url('/chat-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        onClick={() => {
          if (activeMenu !== null) setActiveMenu(null);
        }}
      >
        <div
          className={`my-4 text-center text-xs ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          TODAY
        </div>

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.mine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex max-w-[88%] flex-col sm:max-w-[75%] ${
                message.mine ? "items-end" : "items-start"
              }`}
            >
              {/* Sender and Time */}
              <div
                className={`mb-1 flex items-center gap-2 text-xs ${
                  message.mine ? "flex-row-reverse" : ""
                }`}
              >
                <span
                  className={`font-medium ${
                    isDark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {message.sender}
                </span>

                <span className={secondaryTextClass}>{message.time}</span>
              </div>

              {/* Editing Message */}
              {editingMessageId === message.id ? (
                <div
                  className={`w-full min-w-[220px] rounded-xl border p-3 ${
                    isDark
                      ? "border-violet-400/30 bg-[#151c30]"
                      : "border-violet-200 bg-white shadow-lg"
                  }`}
                >
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    maxLength={5000}
                    rows={3}
                    autoFocus
                    className={`w-full resize-none rounded-lg border p-2 text-sm outline-none focus:border-violet-400 ${
                      isDark
                        ? "border-white/10 bg-[#0b1020] text-white"
                        : "border-slate-200 bg-slate-50 text-slate-800"
                    }`}
                  />

                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={actionLoading}
                      className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs ${
                        isDark
                          ? "text-slate-300 hover:bg-white/10"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
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
                  <div className="group relative flex max-w-full items-center gap-2">
                    {/* Message Bubble */}
                    <div
                      className={`min-w-0 max-w-full break-words rounded-2xl px-3 py-3 text-sm leading-relaxed shadow-sm sm:px-4 ${
                        message.mine
                          ? "rounded-br-md bg-violet-500 text-white"
                          : isDark
                            ? "rounded-bl-md border border-white/10 bg-[#202a40]/95 text-slate-100"
                            : "rounded-bl-md border border-white/70 bg-white/95 text-slate-700"
                      }`}
                    >
                      {message.isForwarded && (
                        <div className="mb-2 flex items-center gap-1.5 text-xs italic opacity-75">
                          <Forward size={13} />
                          <span>Forwarded</span>
                        </div>
                      )}

                      {message.attachment?.url && (
                        <MessageAttachment
                          attachment={message.attachment}
                          onImageClick={setPreviewImage}
                        />
                      )}

                      {message.text && (
                        <p className="whitespace-pre-wrap break-words">
                          {message.text}
                        </p>
                      )}
                    </div>

                    {/* Message Action Menu */}
                    <div
                      className="relative shrink-0"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        aria-label="Message actions"
                        onClick={() =>
                          setActiveMenu(
                            activeMenu === message.id ? null : message.id
                          )
                        }
                        className={`rounded-lg p-1.5 transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 ${
                          isDark
                            ? "text-slate-400 hover:bg-white/10 hover:text-white"
                            : "text-slate-500 hover:bg-white hover:text-violet-600"
                        }`}
                      >
                        <MoreVertical size={17} />
                      </button>

                      {activeMenu === message.id && (
                        <div
                          className={`absolute top-8 z-30 w-48 rounded-xl border p-1 shadow-xl ${menuClass} ${
                            message.mine ? "right-0" : "left-0"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => openForwardModal(message)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-violet-500/10"
                          >
                            <Forward size={15} />
                            Forward message
                          </button>

                          {message.mine && message.text && (
                            <button
                              type="button"
                              onClick={() => startEditing(message)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-violet-500/10"
                            >
                              <Pencil size={15} />
                              Edit message
                            </button>
                          )}

                          {message.mine && (
                            <button
                              type="button"
                              onClick={() => handleDeleteEveryone(message.id)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-500 transition hover:bg-red-500/10"
                            >
                              <Trash2 size={15} />
                              Delete for everyone
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteMe(message.id)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-red-500/10 hover:text-red-500"
                          >
                            <Trash2 size={15} />
                            Delete for me
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {message.isEdited && (
                    <span
                      className={`mt-1 text-[10px] ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Edited
                    </span>
                  )}
                </>
              )}

              {message.mine && (
                <div className="mt-1 flex items-center gap-1">
                  <MessageStatus status={message.status} isDark={isDark} />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div
              className={`flex items-center gap-2 rounded-2xl rounded-bl-md border px-4 py-3 ${
                isDark
                  ? "border-white/10 bg-[#202a40]/95"
                  : "border-white/70 bg-white/95"
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:300ms]" />
              </div>

              <span className={`text-xs ${secondaryTextClass}`}>
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
          onSendAttachment={onSendAttachment}
          onTypingChange={onTypingChange}
          disabled={sending}
          theme={theme}
        />
      </div>

      {/* Forward Message Modal */}
      {forwardingMessage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 sm:p-6"
          onClick={closeForwardModal}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Forward message"
            className={`flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border shadow-2xl ${
              isDark
                ? "border-white/10 bg-[#151c30] text-white"
                : "border-slate-200 bg-white text-slate-800"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className={`flex items-center justify-between border-b px-4 py-4 sm:px-5 ${
                isDark ? "border-white/10" : "border-slate-200"
              }`}
            >
              <div>
                <h3 className="text-lg font-semibold">Forward message</h3>
                <p className={`mt-1 text-xs ${secondaryTextClass}`}>
                  Choose who should receive this message.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForwardModal}
                disabled={forwardLoading}
                aria-label="Close forward modal"
                className={`rounded-lg p-2 transition ${
                  isDark
                    ? "text-slate-400 hover:bg-white/10 hover:text-white"
                    : "text-slate-500 hover:bg-slate-100"
                } disabled:opacity-50`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Message Preview */}
            <div
              className={`border-b px-4 py-3 sm:px-5 ${
                isDark ? "border-white/10" : "border-slate-200"
              }`}
            >
              <p className={`mb-2 text-xs font-medium ${secondaryTextClass}`}>
                Message preview
              </p>

              <div
                className={`max-h-28 overflow-y-auto rounded-xl p-3 text-sm ${
                  isDark
                    ? "bg-[#0b1020] text-slate-200"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {forwardingMessage.attachment?.url && (
                  <div className="mb-1 flex items-center gap-2 text-violet-500">
                    <FileText size={16} />
                    <span className="truncate">
                      {forwardingMessage.attachment.filename || "Attachment"}
                    </span>
                  </div>
                )}

                {forwardingMessage.text && (
                  <p className="whitespace-pre-wrap break-words">
                    {forwardingMessage.text}
                  </p>
                )}
              </div>
            </div>

            {/* Search Recipients */}
            <div className="px-4 pt-4 sm:px-5">
              <div
                className={`flex items-center gap-2 rounded-xl border px-3 ${
                  isDark
                    ? "border-white/10 bg-[#0b1020]"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <Search size={17} className={secondaryTextClass} />

                <input
                  type="text"
                  value={recipientSearch}
                  onChange={(event) => setRecipientSearch(event.target.value)}
                  placeholder="Search users..."
                  disabled={forwardLoading}
                  className={`w-full bg-transparent py-3 text-sm outline-none ${
                    isDark
                      ? "text-white placeholder:text-slate-500"
                      : "text-slate-800 placeholder:text-slate-400"
                  }`}
                />
              </div>
            </div>

            {forwardError && (
              <p role="alert" className="px-5 pt-3 text-sm text-red-500">
                {forwardError}
              </p>
            )}

            {/* Recipient List */}
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4">
              {filteredRecipients.length === 0 ? (
                <p className={`py-8 text-center text-sm ${secondaryTextClass}`}>
                  No users found.
                </p>
              ) : (
                filteredRecipients.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => handleForward(user)}
                    disabled={forwardLoading}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition disabled:cursor-wait disabled:opacity-50 ${
                      isDark ? "hover:bg-white/10" : "hover:bg-violet-50"
                    }`}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-semibold text-violet-500">
                        {user.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {user.name}
                      </p>

                      <p className={`truncate text-xs ${secondaryTextClass}`}>
                        {user.email}
                      </p>
                    </div>

                    <Forward size={17} className="text-violet-500" />
                  </button>
                ))
              )}
            </div>

            <div
              className={`border-t px-4 py-3 text-center text-xs ${
                isDark
                  ? "border-white/10 text-slate-500"
                  : "border-slate-200 text-slate-500"
              }`}
            >
              {forwardLoading
                ? "Forwarding message..."
                : "Select a user to forward"}
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Image Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-3 sm:p-6"
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            aria-label="Close image preview"
            className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-5 sm:top-5"
          >
            <X size={24} />
          </button>

          <img
            src={previewImage.url}
            alt={previewImage.filename || "Image preview"}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </section>
  );
}