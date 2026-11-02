
import { useEffect, useRef, useState } from "react";
import {
  Paperclip,
  Send,
  X,
  FileText,
} from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
];

export default function MessageInput({
  onSend,
  onSendAttachment,
  onTypingChange,
  disabled = false,
  theme = "dark",
}) {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const typingTimer = useRef(null);
  const fileInputRef = useRef(null);

  const isDark = theme === "dark";

  const panelStyle = isDark
    ? "border-white/10 bg-[#0b1020]"
    : "border-[#e8e4f5] bg-white";

  const inputStyle = isDark
    ? "border-white/10 bg-[#191e30] text-white placeholder:text-slate-500 focus:border-violet-500/60"
    : "border-[#e5e0f5] bg-[#f2effc] text-[#242447] placeholder:text-[#8989a8] focus:border-violet-400";

  const mutedStyle = isDark
    ? "text-slate-400 hover:bg-white/10 hover:text-white"
    : "text-[#777797] hover:bg-violet-100 hover:text-violet-700";

  const previewStyle = isDark
    ? "border-white/10 bg-white/5"
    : "border-[#e8e3f6] bg-[#f6f3ff]";

  const previewText = isDark
    ? "text-white"
    : "text-[#29294d]";

  const previewMuted = isDark
    ? "text-slate-400"
    : "text-[#8585a3]";

  // Clean up temporary image previews.
  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Clear typing timer when component unmounts.
  useEffect(() => {
    return () => {
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
      }
    };
  }, []);

  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function handleChange(event) {
    const value = event.target.value;

    setMessage(value);

    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }

    if (value.trim()) {
      onTypingChange?.(true);

      typingTimer.current = setTimeout(() => {
        onTypingChange?.(false);
      }, 1000);
    } else {
      onTypingChange?.(false);
    }
  }

  function handleFileSelect(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("This file type is not supported.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size cannot exceed 10 MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl("");
    }
  }

  function handleRemoveFile() {
    setSelectedFile(null);
    setPreviewUrl("");
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (disabled || uploading) return;

    if (!trimmedMessage && !selectedFile) return;

    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
      typingTimer.current = null;
    }

    onTypingChange?.(false);

    if (selectedFile) {
      if (!onSendAttachment) {
        setError("Attachment sending is not configured yet.");
        return;
      }

      try {
        setUploading(true);
        setError("");

        await onSendAttachment(selectedFile, trimmedMessage);

        setSelectedFile(null);
        setPreviewUrl("");
        setMessage("");

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (err) {
        setError(err.message || "Failed to send attachment.");
      } finally {
        setUploading(false);
      }

      return;
    }

    onSend(trimmedMessage);
    setMessage("");
  }

  const isImage = selectedFile?.type.startsWith("image/");

  return (
    <form
      onSubmit={handleSubmit}
      className={`border-t p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-colors duration-300 sm:p-4 ${panelStyle}`}
    >
      {/* Selected attachment preview */}
      {selectedFile && (
        <div
          className={`mb-2 flex min-w-0 items-center gap-2 rounded-xl border p-2 sm:mb-3 sm:gap-3 sm:p-3 ${previewStyle}`}
        >
          {isImage && previewUrl ? (
            <img
              src={previewUrl}
              alt="Selected attachment"
              className="h-12 w-12 shrink-0 rounded-lg object-cover sm:h-16 sm:w-16"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-500 sm:h-12 sm:w-12">
              <FileText size={22} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className={`truncate text-xs font-medium sm:text-sm ${previewText}`}>
              {selectedFile.name}
            </p>

            <p className={`mt-1 text-[11px] sm:text-xs ${previewMuted}`}>
              {formatFileSize(selectedFile.size)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRemoveFile}
            disabled={uploading}
            aria-label="Remove attachment"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition disabled:opacity-40 ${mutedStyle}`}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mb-2 px-1 text-xs text-red-500 sm:mb-3">
          {error}
        </p>
      )}

      {/* Input controls */}
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Attachment button */}
        <button
          type="button"
          aria-label="Attach a file"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || Boolean(selectedFile)}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition disabled:opacity-40 sm:h-12 sm:w-12 ${mutedStyle}`}
        >
          <Paperclip size={21} />
        </button>

        {/* Message input */}
        <input
          type="text"
          value={message}
          onChange={handleChange}
          placeholder={
            selectedFile ? "Add a caption..." : "Message..."
          }
          disabled={disabled || uploading}
          className={`h-11 min-w-0 flex-1 rounded-xl border px-3 text-base outline-none transition disabled:opacity-50 sm:h-12 sm:px-4 sm:text-sm ${inputStyle}`}
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={
            (!message.trim() && !selectedFile) ||
            disabled ||
            uploading
          }
          aria-label="Send message"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#7435f1] to-[#9229ed] text-white shadow-md shadow-violet-500/15 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:h-12 sm:w-12"
        >
          {uploading ? (
            <span className="block h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Send size={19} />
          )}
        </button>
      </div>

      {/* Upload status */}
      {uploading && (
        <p className="mt-2 text-center text-xs text-violet-500">
          Uploading attachment...
        </p>
      )}
    </form>
  );
}
