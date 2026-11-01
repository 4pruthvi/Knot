
import { useEffect, useRef, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  X,
  Save,
  User,
  Camera,
  Upload,
} from "lucide-react";

import { updateProfile, uploadAvatar } from "../services/api";

export default function Sidebar({
  conversations,
  selectedChatId,
  onSelectChat,
  currentUser,
  onProfileUpdated,
}) {
  const [search, setSearch] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  const [name, setName] = useState(currentUser?.name || "");
  const [avatar, setAvatar] = useState(currentUser?.avatar || "");

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const userName = currentUser?.name || "Your Profile";
  const userEmail = currentUser?.email || "";
  const userAvatar = currentUser?.avatar || "";

  const initials = userName
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Revoke temporary preview URLs to avoid memory leaks.
  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Filter conversations.
  const filteredConversations = conversations.filter((chat) =>
    chat.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  // Open profile editor.
  function openProfileEditor() {
    setName(userName);
    setAvatar(userAvatar);
    setSelectedFile(null);
    setPreviewUrl("");
    setError("");
    setSuccess("");
    setShowProfile(true);
  }

  // Close profile editor.
  function closeProfileEditor() {
    if (saving || uploadingAvatar) return;

    setShowProfile(false);
    setSelectedFile(null);
    setPreviewUrl("");
    setError("");
    setSuccess("");
  }

  // Select and validate an image.
  function handleAvatarSelect(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  // Upload profile picture to Cloudinary.
  async function handleAvatarUpload() {
    if (!selectedFile) {
      setError("Please select an image first.");
      return;
    }

    setUploadingAvatar(true);
    setError("");
    setSuccess("");

    try {
      const updatedUser = await uploadAvatar(selectedFile);

      setAvatar(updatedUser.avatar || "");
      onProfileUpdated?.(updatedUser);

      setSelectedFile(null);
      setPreviewUrl("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setSuccess("Profile picture uploaded successfully.");
    } catch (err) {
      console.error("Avatar upload error:", err);
      setError(err.message || "Failed to upload profile picture.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  // Save profile name.
  async function handleProfileSave(event) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updatedUser = await updateProfile({
        name: name.trim(),
      });

      onProfileUpdated?.(updatedUser);

      setSuccess("Profile updated successfully.");

      setTimeout(() => {
        setShowProfile(false);
        setSuccess("");
      }, 1000);
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-r border-white/10 bg-[#101426] text-white">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 p-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            KNOT<span className="text-violet-400">.</span>
          </h1>

          <p className="mt-1 text-xs text-slate-400">
            Stay connected.
          </p>
        </div>

        <button
          type="button"
          aria-label="Start a new conversation"
          className="rounded-xl bg-violet-500/15 p-2 text-violet-300 transition hover:bg-violet-500/25"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
          <Search size={18} className="text-slate-400" />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search conversations..."
            aria-label="Search conversations"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Section heading */}
      <div className="px-4 pb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
        Messages
      </div>

      {/* Conversation list */}
      <div className="flex-1 space-y-1 overflow-y-auto px-3">

        {filteredConversations.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-slate-500">
            No conversations found.
          </p>
        )}

        {filteredConversations.map((chat) => {
          const unreadCount = Number(chat.unreadCount) || 0;
          const isSelected = selectedChatId === chat.id;

          const chatInitials = chat.name
            .trim()
            .split(/\s+/)
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <button
              type="button"
              key={chat.id}
              onClick={() => onSelectChat(chat)}
              className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                isSelected
                  ? "bg-violet-500/15"
                  : "hover:bg-white/5"
              }`}
            >
              {/* User avatar */}
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-500/20 font-semibold text-violet-300">
                {chat.avatar ? (
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  chatInitials
                )}

                {chat.online && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#101426] bg-emerald-400" />
                )}
              </div>

              {/* Conversation details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`truncate text-sm ${
                      unreadCount > 0
                        ? "font-bold text-white"
                        : "font-medium text-white"
                    }`}
                  >
                    {chat.name}
                  </span>

                  {chat.time && (
                    <span className="shrink-0 text-xs text-slate-500">
                      {chat.time}
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center justify-between gap-2">
                  <p
                    className={`min-w-0 flex-1 truncate text-xs ${
                      unreadCount > 0
                        ? "font-medium text-slate-200"
                        : "text-slate-400"
                    }`}
                  >
                    {chat.message}
                  </p>

                  {unreadCount > 0 && (
                    <span
                      aria-label={`${unreadCount} unread messages`}
                      className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-violet-500 px-1.5 text-[11px] font-bold text-white"
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Logged-in user profile */}
      <div className="border-t border-white/10 p-4">
        <button
          type="button"
          onClick={openProfileEditor}
          className="flex w-full items-center gap-3 rounded-xl bg-white/5 p-3 text-left transition hover:bg-white/10"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-500 font-semibold">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="h-full w-full object-cover"
              />
            ) : (
              initials || "U"
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {userName}
            </p>

            <p className="truncate text-xs text-slate-400">
              {userEmail || "Account"}
            </p>
          </div>

          <Pencil size={16} className="shrink-0 text-slate-400" />
        </button>
      </div>

      {/* Profile Edit Modal */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#151c30] p-6 shadow-2xl">

            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Edit Profile
              </h2>

              <button
                type="button"
                onClick={closeProfileEditor}
                disabled={saving || uploadingAvatar}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-5">

              {/* Avatar preview */}
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-violet-400/50 bg-violet-500/20 text-2xl font-semibold text-violet-300">
                  {previewUrl || avatar ? (
                    <img
                      src={previewUrl || avatar}
                      alt="Profile preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={36} />
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
                >
                  <Camera size={16} />
                  Choose Image
                </button>

                <p className="text-xs text-slate-500">
                  JPG, PNG or other image formats. Maximum 5 MB.
                </p>

                {selectedFile && (
                  <div className="w-full space-y-2">
                    <p className="truncate text-center text-xs text-slate-400">
                      Selected: {selectedFile.name}
                    </p>

                    <button
                      type="button"
                      onClick={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-600 disabled:opacity-50"
                    >
                      <Upload size={16} />
                      {uploadingAvatar ? "Uploading..." : "Upload Photo"}
                    </button>
                  </div>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Display Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={50}
                  placeholder="Enter your name"
                  className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none focus:border-violet-400"
                />
              </div>

              {/* Error and success messages */}
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              {success && (
                <p className="text-sm text-emerald-400">{success}</p>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeProfileEditor}
                  disabled={saving || uploadingAvatar}
                  className="rounded-xl px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || uploadingAvatar || !name.trim()}
                  className="flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-600 disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
