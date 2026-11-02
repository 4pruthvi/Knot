
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
  Sun,
  Moon,
  MessageCircle,
  LogOut,
} from "lucide-react";

import { updateProfile, uploadAvatar } from "../services/api";

export default function Sidebar({
  conversations = [],
  selectedChatId,
  onSelectChat,
  currentUser,
  onProfileUpdated,
  theme = "dark",
  onToggleTheme,
  onLogout,
}) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showProfile, setShowProfile] = useState(false);

  const [name, setName] = useState(currentUser?.name || "");
  const [avatar, setAvatar] = useState(currentUser?.avatar || "");

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const fileInputRef = useRef(null);
  const searchInputRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isDark = theme === "dark";

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

  // Theme classes
  const panel = isDark
    ? "bg-[#090D2B] text-white border-white/10"
    : "bg-[#fbfaff] text-[#17183d] border-[#e8e4fa]";

  const mutedText = isDark ? "text-slate-400" : "text-[#777797]";
  const secondaryText = isDark ? "text-slate-300" : "text-[#4f5075]";

  const searchBox = isDark
    ? "border-white/10 bg-[#15183A] focus-within:border-violet-400/60"
    : "border-[#e5e0f5] bg-[#f0edfb] focus-within:border-violet-400";

  const inputText = isDark
    ? "text-white placeholder:text-slate-500"
    : "text-[#222344] placeholder:text-[#8989a8]";

  const modal = isDark
    ? "bg-[#111536] border-white/10 text-white"
    : "bg-white border-[#e8e4fa] text-[#17183d]";

  const modalInput = isDark
    ? "border-white/10 bg-[#090D2B] text-white placeholder:text-slate-500"
    : "border-[#e5e0f5] bg-[#f8f7ff] text-[#222344] placeholder:text-[#8989a8]";

  useEffect(() => {
    setName(currentUser?.name || "");
    setAvatar(currentUser?.avatar || "");
  }, [currentUser]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Search and filter conversations.
  const filteredConversations = conversations.filter((chat) => {
    const matchesSearch = (chat.name || "")
      .toLowerCase()
      .includes(search.toLowerCase().trim());

    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "unread" && Number(chat.unreadCount) > 0) ||
      (activeFilter === "online" && chat.online);

    return matchesSearch && matchesFilter;
  });

  const unreadTotal = conversations.filter(
    (chat) => Number(chat.unreadCount) > 0
  ).length;

  const onlineTotal = conversations.filter((chat) => chat.online).length;

  function handleNewConversation() {
    setActiveFilter("all");
    setSearch("");
    searchInputRef.current?.focus();
  }

  function handleLogout() {
    const confirmed = window.confirm(
      "Are you sure you want to log out of KNOT?"
    );

    if (confirmed) {
      onLogout?.();
    }
  }

  function openProfileEditor() {
    setName(userName);
    setAvatar(userAvatar);
    setSelectedFile(null);
    setPreviewUrl("");
    setError("");
    setSuccess("");
    setShowProfile(true);
  }

  function closeProfileEditor() {
    if (saving || uploadingAvatar) return;

    setShowProfile(false);
    setSelectedFile(null);
    setPreviewUrl("");
    setError("");
    setSuccess("");
  }

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

    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

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

      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }

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

  const filters = [
    { id: "all", label: "All", count: conversations.length },
    { id: "unread", label: "Unread", count: unreadTotal },
    { id: "online", label: "Online", count: onlineTotal },
  ];

  return (
    <aside
      className={`flex h-full w-full shrink-0 flex-col border-r transition-colors duration-300 md:w-80 ${panel}`}
    >
      {/* HEADER */}
      <div
        className={`flex items-center justify-between border-b px-5 py-4 ${
          isDark ? "border-white/10" : "border-[#ebe7f8]"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <img
            src="/knot-wordmark-reference.png"
            alt="KNOT"
            className="h-auto w-[112px] object-contain"
          />

          <div className="hidden">
            <h1 className="text-2xl font-bold tracking-tight">
              KNOT<span className="text-violet-500">.</span>
            </h1>
            <p className={`mt-0.5 text-[10px] ${mutedText}`}>
              Stay connected.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
            title={`Switch to ${isDark ? "light" : "dark"} theme`}
            className={`flex h-9 w-12 items-center justify-center gap-1 rounded-full border transition-all duration-200 ${
              isDark
                ? "border-white/10 bg-[#171A40] text-yellow-300 hover:bg-[#222650]"
                : "border-[#e5e0f5] bg-[#f0edfb] text-violet-600 hover:bg-[#e9e3ff]"
            }`}
          >
            <Sun size={14} />
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full transition ${
                isDark
                  ? "bg-violet-600 text-white"
                  : "bg-white text-violet-600 shadow-sm"
              }`}
            >
              {isDark ? <Moon size={13} /> : <Sun size={13} />}
            </span>
          </button>

          {/* New Conversation / Search Shortcut */}
          <button
            type="button"
            onClick={handleNewConversation}
            aria-label="Find a conversation"
            title="Find a conversation"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7435f1] to-[#9229ed] text-white shadow-md shadow-violet-500/20 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <Plus size={21} />
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="px-4 pb-3 pt-4">
        <div
          className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-200 focus-within:ring-2 focus-within:ring-violet-500/10 ${searchBox}`}
        >
          <Search size={18} className={mutedText} />

          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search conversations..."
            aria-label="Search conversations"
            className={`w-full bg-transparent text-sm outline-none ${inputText}`}
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className={mutedText}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* FILTERS */}
      <div className="px-4 pb-3">
        <div
          className={`grid grid-cols-3 gap-1 rounded-xl p-1 ${
            isDark ? "bg-[#15183A]" : "bg-[#f0edfb]"
          }`}
        >
          {filters.map((filter) => {
            const active = activeFilter === filter.id;

            return (
              <button
                type="button"
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`rounded-lg px-2 py-2 text-xs font-semibold transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-[#7435f1] to-[#9229ed] text-white shadow-md shadow-violet-500/20"
                    : isDark
                      ? "text-slate-400 hover:bg-[#222650] hover:text-white"
                      : "text-[#777797] hover:bg-white hover:text-violet-700"
                }`}
              >
                {filter.label}
                {filter.id === "unread" && filter.count > 0 && (
                  <span className="ml-1">{filter.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION TITLE */}
      <div className="flex items-center justify-between px-5 pb-2">
        <span
          className={`text-[11px] font-bold uppercase tracking-[0.14em] ${mutedText}`}
        >
          Messages
        </span>

        <span className={`text-[11px] ${mutedText}`}>
          {filteredConversations.length} chats
        </span>
      </div>

      {/* CONVERSATION LIST */}
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2.5 pb-3">
        {filteredConversations.length === 0 && (
          <div className="flex flex-col items-center px-4 py-12 text-center">
            <div
              className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${
                isDark
                  ? "bg-[#15183A] text-slate-500"
                  : "bg-[#f0edfb] text-violet-400"
              }`}
            >
              <MessageCircle size={23} />
            </div>

            <p className={`text-sm font-medium ${secondaryText}`}>
              {search
                ? "No conversations found"
                : activeFilter === "unread"
                  ? "No unread messages"
                  : activeFilter === "online"
                    ? "Nobody is online"
                    : "No conversations yet"}
            </p>

            <p className={`mt-1 text-xs ${mutedText}`}>
              {search
                ? "Try searching for another name."
                : "Your conversations will appear here."}
            </p>
          </div>
        )}

        {filteredConversations.map((chat) => {
          const unreadCount = Number(chat.unreadCount) || 0;

          const isSelected =
            String(selectedChatId || "") === String(chat.id || chat._id);

          const chatInitials = (chat.name || "U")
            .trim()
            .split(/\s+/)
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <button
              type="button"
              key={chat.id || chat._id}
              onClick={() => onSelectChat(chat)}
              className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all duration-200 ${
                isSelected
                  ? isDark
                    ? "bg-[#21194A] shadow-sm shadow-purple-950/20"
                    : "bg-[#eee8ff] shadow-sm"
                  : isDark
                    ? "hover:bg-[#171A3D]"
                    : "hover:bg-[#f1edfc]"
              }`}
            >
              {/* AVATAR */}
              <div
                className={`relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ${
                  isDark
                    ? "bg-gradient-to-br from-[#49318a] to-[#28235d] text-violet-200"
                    : "bg-gradient-to-br from-[#e5dcff] to-[#d8eaff] text-violet-700"
                }`}
              >
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
                  <span
                    className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-[2.5px] ${
                      isDark
                        ? "border-[#21194A] bg-emerald-400"
                        : "border-[#eee8ff] bg-emerald-500"
                    }`}
                  />
                )}
              </div>

              {/* CONVERSATION DETAILS */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`truncate text-[13px] ${
                      unreadCount > 0 ? "font-bold" : "font-semibold"
                    } ${isDark ? "text-white" : "text-[#202044]"}`}
                  >
                    {chat.name}
                  </span>

                  {chat.time && (
                    <span
                      className={`shrink-0 text-[10px] ${
                        unreadCount > 0 ? "text-violet-400" : mutedText
                      }`}
                    >
                      {chat.time}
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center justify-between gap-2">
                  <p
                    className={`min-w-0 flex-1 truncate text-[11px] ${
                      unreadCount > 0
                        ? isDark
                          ? "font-medium text-slate-200"
                          : "font-semibold text-[#45456b]"
                        : mutedText
                    }`}
                  >
                    {chat.online && !chat.message ? "Online" : chat.message}
                  </p>

                  {unreadCount > 0 && (
                    <span
                      aria-label={`${unreadCount} unread messages`}
                      className="flex h-[19px] min-w-[19px] shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#7435f1] to-[#9229ed] px-1 text-[10px] font-bold text-white"
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

      {/* LOGGED-IN USER PROFILE AND LOGOUT */}
      <div
        className={`border-t p-3 ${
          isDark ? "border-white/10" : "border-[#e8e4fa]"
        }`}
      >
        <button
          type="button"
          onClick={openProfileEditor}
          className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
            isDark
              ? "bg-[#15183A] hover:bg-[#1B1F49]"
              : "bg-[#f0edfb] hover:bg-[#e9e3ff]"
          }`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ${
              isDark
                ? "bg-violet-500/20 text-violet-200"
                : "bg-violet-100 text-violet-700"
            }`}
          >
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
            <p
              className={`truncate text-sm font-semibold ${
                isDark ? "text-white" : "text-[#202044]"
              }`}
            >
              {userName}
            </p>

            <p className={`truncate text-xs ${mutedText}`}>
              {userEmail || "Account"}
            </p>
          </div>

          <Pencil
            size={17}
            className={`shrink-0 ${
              isDark ? "text-slate-400" : "text-[#777797]"
            }`}
          />
        </button>

        {/* LOGOUT BUTTON */}
        <button
          type="button"
          onClick={handleLogout}
          className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
            isDark
              ? "border-red-400/20 text-red-300 hover:bg-red-500/10"
              : "border-red-200 text-red-600 hover:bg-red-50"
          }`}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      {/* PROFILE EDIT MODAL */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className={`max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border p-6 shadow-2xl ${modal}`}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Edit Profile</h2>
                <p className={`mt-1 text-xs ${mutedText}`}>
                  Update your KNOT profile.
                </p>
              </div>

              <button
                type="button"
                onClick={closeProfileEditor}
                disabled={saving || uploadingAvatar}
                aria-label="Close profile editor"
                className={`rounded-xl p-2 transition ${
                  isDark
                    ? "text-slate-400 hover:bg-white/10 hover:text-white"
                    : "text-slate-500 hover:bg-[#f0edfb] hover:text-violet-700"
                } disabled:opacity-50`}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-5">
              {/* Avatar Preview */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-violet-400/50 text-2xl font-semibold ${
                    isDark
                      ? "bg-violet-500/20 text-violet-300"
                      : "bg-violet-100 text-violet-700"
                  }`}
                >
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
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition ${
                    isDark
                      ? "border-white/10 text-slate-300 hover:bg-white/5"
                      : "border-[#e5e0f5] text-[#4f5075] hover:bg-[#f5f2ff]"
                  } disabled:opacity-50`}
                >
                  <Camera size={16} />
                  Choose Image
                </button>

                <p className={`text-xs ${mutedText}`}>
                  JPG, PNG or other image formats. Maximum 5 MB.
                </p>

                {selectedFile && (
                  <div className="w-full space-y-2">
                    <p className={`truncate text-center text-xs ${mutedText}`}>
                      Selected: {selectedFile.name}
                    </p>

                    <button
                      type="button"
                      onClick={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7435f1] to-[#9229ed] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      <Upload size={16} />
                      {uploadingAvatar ? "Uploading..." : "Upload Photo"}
                    </button>
                  </div>
                )}
              </div>

              {/* Name */}
              <div>
                <label
                  className={`mb-2 block text-sm font-medium ${secondaryText}`}
                >
                  Display Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={50}
                  placeholder="Enter your name"
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 ${modalInput}`}
                />
              </div>

              {/* Error and Success */}
              {error && (
                <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-500">
                  {error}
                </p>
              )}

              {success && (
                <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
                  {success}
                </p>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeProfileEditor}
                  disabled={saving || uploadingAvatar}
                  className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    isDark
                      ? "text-slate-300 hover:bg-white/5"
                      : "text-[#626282] hover:bg-[#f0edfb]"
                  } disabled:opacity-50`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || uploadingAvatar || !name.trim()}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7435f1] to-[#9229ed] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
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
