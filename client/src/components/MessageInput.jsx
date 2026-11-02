
import { useEffect, useRef, useState } from "react";
import {
  Paperclip,
  Send,
  X,
  FileText,
  Image as ImageIcon,
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
}) {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const typingTimer = useRef(null);
  const fileInputRef = useRef(null);

  // Clean up temporary image preview.
  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Format file size.
  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  // Handle text changes and typing indicator.
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

  // Select an attachment.
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

  // Remove selected attachment.
  function handleRemoveFile() {
    setSelectedFile(null);
    setPreviewUrl("");
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Send text or attachment.
  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (disabled || uploading) return;

    if (!trimmedMessage && !selectedFile) return;

    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }

    onTypingChange?.(false);

    // Send attachment with optional caption.
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

    // Send normal text message.
    onSend(trimmedMessage);
    setMessage("");
  }

  const isImage = selectedFile?.type.startsWith("image/");

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-white/10 bg-[#0b1020] p-4"
    >
      {/* Selected attachment preview */}
      {selectedFile && (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">

          {isImage && previewUrl ? (
            <img
              src={previewUrl}
              alt="Selected attachment"
              className="h-16 w-16 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
              <FileText size={24} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {selectedFile.name}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRemoveFile}
            disabled={uploading}
            aria-label="Remove attachment"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mb-3 text-xs text-red-400">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">

        {/* Hidden file input */}
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
          className="rounded-xl p-2.5 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
        >
          <Paperclip size={20} />
        </button>

        {/* Message input */}
        <input
          value={message}
          onChange={handleChange}
          placeholder={
            selectedFile ? "Add a caption..." : "Message..."
          }
          disabled={disabled || uploading}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500/60 disabled:opacity-50"
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
          className="rounded-xl bg-violet-500 p-3 text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {uploading ? (
            <span className="block h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>

      {uploading && (
        <p className="mt-2 text-center text-xs text-violet-300">
          Uploading attachment...
        </p>
      )}
    </form>
  );
}
