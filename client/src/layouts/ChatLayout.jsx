
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { socket } from "../services/socket";

import {
  getCurrentUser,
  getUsers,
  getMessages,
  sendMessage,
  getUnreadCounts,
  markMessagesRead,
  editMessage,
  deleteMessageForEveryone,
  deleteMessageForMe,
} from "../services/api";

export default function ChatLayout() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);

  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [typingUserId, setTypingUserId] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const usersRef = useRef([]);
  const selectedChatRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Load initial account data.
  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        const user = await getCurrentUser();

        if (cancelled) return;
        setCurrentUser(user);

        const registeredUsers = await getUsers();

        if (cancelled) return;
        setUsers(registeredUsers);

        try {
          const counts = await getUnreadCounts();

          if (!cancelled) {
            setUnreadCounts(counts);
          }
        } catch (err) {
          console.error("Failed to load unread counts:", err);
        }
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load account data:", err);

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", { replace: true });
      } finally {
        if (!cancelled) {
          setLoadingUser(false);
        }
      }
    }

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // Socket.IO connection and event listeners.
  useEffect(() => {
    if (!currentUser?.id) return;

    function handleConnect() {
      console.log("Connected to KNOT Socket.IO:", socket.id);
      socket.emit("register_user", String(currentUser.id));
    }

    function handleDisconnect() {
      console.log("Disconnected from KNOT Socket.IO");
      setTypingUserId(null);
    }

    function handleConnectError(err) {
      console.error("Socket.IO connection error:", err.message);
    }

    function handleOnlineUsers(userIds) {
      setOnlineUserIds([...new Set(userIds.map(String))]);
    }

    function handleUserStatus({ userId, online }) {
      const id = String(userId);

      setOnlineUserIds((previous) => {
        if (online) {
          return previous.includes(id) ? previous : [...previous, id];
        }

        return previous.filter((item) => item !== id);
      });

      if (!online) {
        setTypingUserId((previous) =>
          previous === id ? null : previous
        );
      }
    }

    function handleUnreadCountUpdate({ senderId, count }) {
      setUnreadCounts((previous) => ({
        ...previous,
        [String(senderId)]: count,
      }));
    }

    // Receive a new message.
    function handleNewMessage(message) {
      if (String(message.receiver) !== String(currentUser.id)) {
        return;
      }

      const senderId = String(message.sender);
      const openChat = selectedChatRef.current;

      const sender = usersRef.current.find(
        (user) => String(user._id) === senderId
      );

      if (socket.connected) {
        socket.emit("message_delivered", message.id);
      }

      const formattedMessage = {
        id: message.id,
        sender: sender?.name || "Unknown",
        senderId,
        receiver: String(message.receiver),
        text: message.text,
        time: new Date(message.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        mine: false,
        status: message.status || "sent",
        isEdited: false,
      };

      if (openChat && String(openChat._id) === senderId) {
        setMessages((previous) => {
          if (previous.some((item) => item.id === formattedMessage.id)) {
            return previous;
          }

          return [...previous, formattedMessage];
        });

        setUnreadCounts((previous) => ({
          ...previous,
          [senderId]: 0,
        }));

        markMessagesRead(senderId).catch((err) => {
          console.error("Failed to mark message as read:", err);
        });
      }

      setUsers((previous) =>
        previous.map((user) =>
          String(user._id) === senderId
            ? { ...user, lastMessage: message.text }
            : user
        )
      );

      setTypingUserId((previous) =>
        previous === senderId ? null : previous
      );
    }

    // Delivery status.
    function handleMessageStatus(update) {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === update.messageId
            ? { ...message, status: update.status }
            : message
        )
      );
    }

    // Read receipts.
    function handleMessagesRead(update) {
      const readerId = String(update.readerId);

      setMessages((previous) =>
        previous.map((message) =>
          message.mine &&
          String(message.receiver) === readerId
            ? { ...message, status: "read" }
            : message
        )
      );
    }

    // Message edited by either user.
    function handleMessageEdited(update) {
      setMessages((previous) =>
        previous.map((message) =>
          String(message.id) === String(update.messageId)
            ? {
                ...message,
                text: update.text,
                isEdited: true,
              }
            : message
        )
      );
    }

    // Message deleted for everyone.
    function handleMessageDeletedEveryone(update) {
      setMessages((previous) =>
        previous.filter(
          (message) =>
            String(message.id) !== String(update.messageId)
        )
      );
    }

    // Message deleted only for the current user.
    function handleMessageDeletedForMe(update) {
      setMessages((previous) =>
        previous.filter(
          (message) =>
            String(message.id) !== String(update.messageId)
        )
      );
    }

    // Typing events.
    function handleUserTyping({ userId }) {
      const senderId = String(userId);
      const openChat = selectedChatRef.current;

      if (!openChat || String(openChat._id) !== senderId) {
        return;
      }

      setTypingUserId(senderId);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setTypingUserId(null);
      }, 3000);
    }

    function handleUserStopTyping({ userId }) {
      const senderId = String(userId);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      setTypingUserId((previous) =>
        previous === senderId ? null : previous
      );
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("online_users", handleOnlineUsers);
    socket.on("user_status", handleUserStatus);
    socket.on("new_message", handleNewMessage);
    socket.on("message_status", handleMessageStatus);
    socket.on("messages_read", handleMessagesRead);
    socket.on("unread_count_update", handleUnreadCountUpdate);

    socket.on("message_edited", handleMessageEdited);
    socket.on("message_deleted_everyone", handleMessageDeletedEveryone);
    socket.on("message_deleted_for_me", handleMessageDeletedForMe);

    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);

    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("online_users", handleOnlineUsers);
      socket.off("user_status", handleUserStatus);
      socket.off("new_message", handleNewMessage);
      socket.off("message_status", handleMessageStatus);
      socket.off("messages_read", handleMessagesRead);
      socket.off("unread_count_update", handleUnreadCountUpdate);

      socket.off("message_edited", handleMessageEdited);
      socket.off("message_deleted_everyone", handleMessageDeletedEveryone);
      socket.off("message_deleted_for_me", handleMessageDeletedForMe);

      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      socket.disconnect();
    };
  }, [currentUser]);

  // Load conversation history.
  useEffect(() => {
    if (!selectedChat?._id || !currentUser?.id) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    async function loadMessages() {
      setLoadingMessages(true);
      setError("");
      setMessages([]);

      try {
        const result = await getMessages(selectedChat._id);

        if (cancelled) return;

        const formattedMessages = result.map((message) => {
          const isMine =
            String(message.sender) === String(currentUser.id);

          return {
            id: message.id,
            sender: isMine ? "You" : selectedChat.name,
            senderId: String(message.sender),
            receiver: String(message.receiver),
            text: message.text,
            time: new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            mine: isMine,
            status: message.status || "sent",
            isEdited: message.isEdited || false,
          };
        });

        setMessages(formattedMessages);

        const incomingMessages = result.filter(
          (message) =>
            String(message.sender) === String(selectedChat._id) &&
            String(message.receiver) === String(currentUser.id)
        );

        if (incomingMessages.length > 0) {
          setUnreadCounts((previous) => ({
            ...previous,
            [String(selectedChat._id)]: 0,
          }));

          try {
            await markMessagesRead(String(selectedChat._id));

            if (cancelled) return;

            setMessages((previous) =>
              previous.map((message) =>
                !message.mine
                  ? { ...message, status: "read" }
                  : message
              )
            );
          } catch (err) {
            console.error("Failed to mark messages as read:", err);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load messages:", err);
          setError(err.message || "Could not load messages.");
        }
      } finally {
        if (!cancelled) {
          setLoadingMessages(false);
        }
      }
    }

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [selectedChat, currentUser]);

  // Select a conversation.
  function handleSelectChat(chat) {
    const previousChat = selectedChatRef.current;

    if (previousChat?._id && socket.connected) {
      socket.emit("stop_typing", String(previousChat._id));
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    selectedChatRef.current = chat;
    setSelectedChat(chat);
    setTypingUserId(null);

    setUnreadCounts((previous) => ({
      ...previous,
      [String(chat._id)]: 0,
    }));
  }

  // Typing events.
  function handleTypingChange(isTyping) {
    if (!selectedChat?._id || !socket.connected) return;

    socket.emit(
      isTyping ? "typing" : "stop_typing",
      String(selectedChat._id)
    );
  }

  // Send message.
  async function handleSendMessage(text) {
    if (!selectedChat?._id || sending) return;

    const trimmedText = text.trim();
    if (!trimmedText) return;

    setSending(true);
    setError("");

    try {
      const savedMessage = await sendMessage(
        selectedChat._id,
        trimmedText
      );

      const formattedMessage = {
        id: savedMessage.id,
        sender: "You",
        senderId: String(currentUser.id),
        receiver: String(selectedChat._id),
        text: savedMessage.text,
        time: new Date(savedMessage.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        mine: true,
        status: savedMessage.status || "sent",
        isEdited: false,
      };

      setMessages((previous) => {
        if (previous.some((item) => item.id === formattedMessage.id)) {
          return previous;
        }

        return [...previous, formattedMessage];
      });

      setUsers((previous) =>
        previous.map((user) =>
          String(user._id) === String(selectedChat._id)
            ? { ...user, lastMessage: trimmedText }
            : user
        )
      );
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(err.message || "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  // Edit an existing message.
  async function handleEditMessage(messageId, newText) {
    try {
      setError("");

      const updatedMessage = await editMessage(messageId, newText);

      setMessages((previous) =>
        previous.map((message) =>
          String(message.id) === String(messageId)
            ? {
                ...message,
                text: updatedMessage.text,
                isEdited: true,
              }
            : message
        )
      );
    } catch (err) {
      console.error("Failed to edit message:", err);
      setError(err.message || "Could not edit message.");
      throw err;
    }
  }

  // Delete message for everyone.
  async function handleDeleteForEveryone(messageId) {
    try {
      setError("");

      await deleteMessageForEveryone(messageId);

      setMessages((previous) =>
        previous.filter(
          (message) => String(message.id) !== String(messageId)
        )
      );
    } catch (err) {
      console.error("Failed to delete message for everyone:", err);
      setError(err.message || "Could not delete message.");
      throw err;
    }
  }

  // Delete message only for me.
  async function handleDeleteForMe(messageId) {
    try {
      setError("");

      await deleteMessageForMe(messageId);

      setMessages((previous) =>
        previous.filter(
          (message) => String(message.id) !== String(messageId)
        )
      );
    } catch (err) {
      console.error("Failed to delete message for me:", err);
      setError(err.message || "Could not delete message.");
      throw err;
    }
  }

  if (loadingUser || !currentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b1020] text-white">
        <p>Loading your account...</p>
      </main>
    );
  }

  const conversations = users.map((user) => ({
    ...user,
    id: user._id,
    name: user.name,
    message: user.lastMessage || "Start a conversation",
    time: "",
    online: onlineUserIds.includes(String(user._id)),
    unreadCount: unreadCounts[String(user._id)] || 0,
  }));

  const selectedChatWithStatus = selectedChat
    ? {
        ...selectedChat,
        online: onlineUserIds.includes(String(selectedChat._id)),
      }
    : null;

  const typingUser = users.find(
    (user) => String(user._id) === typingUserId
  );

  return (
    <main className="flex h-screen overflow-hidden bg-[#0b1020]">
      <Sidebar
        conversations={conversations}
        selectedChatId={selectedChat?.id}
        onSelectChat={handleSelectChat}
        currentUser={currentUser}
        onProfileUpdated={setCurrentUser}
      />

      {selectedChat ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {error && (
            <div
              role="alert"
              className="bg-red-500/10 px-4 py-2 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          {loadingMessages ? (
            <div className="flex flex-1 items-center justify-center text-slate-400">
              Loading conversation...
            </div>
          ) : (
            <ChatWindow
              selectedChat={selectedChatWithStatus}
              messages={messages}
              onSendMessage={handleSendMessage}
              onTypingChange={handleTypingChange}
              onEditMessage={handleEditMessage}
              onDeleteForEveryone={handleDeleteForEveryone}
              onDeleteForMe={handleDeleteForMe}
              sending={sending}
              isTyping={Boolean(
                typingUser &&
                String(typingUser._id) === String(selectedChat._id)
              )}
              typingUserName={typingUser?.name || selectedChat.name}
            />
          )}
        </div>
      ) : (
        <section className="flex flex-1 items-center justify-center bg-[#0b1020] text-center text-slate-400">
          <div>
            <h2 className="mb-2 text-xl font-semibold text-white">
              Welcome to KNOT
            </h2>
            <p>Select a user from the sidebar to start chatting.</p>
          </div>
        </section>
      )}
    </main>
  );
}
