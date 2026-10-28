import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { socket } from "../services/socket";
import {
  getCurrentUser,
  getUsers,
  getMessages,
  sendMessage,
} from "../services/api";

export default function ChatLayout() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  const [messages, setMessages] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Load the logged-in user and registered users.
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

  // Connect Socket.IO when the logged-in user is available.

  useEffect(() => {
    if (!currentUser?.id) return;

    function handleConnect() {
      console.log("Connected to KNOT Socket.IO:", socket.id);

      socket.emit("register_user", String(currentUser.id));
    }

    function handleDisconnect() {
      console.log("Disconnected from KNOT Socket.IO");
    }

    function handleConnectError(err) {
      console.error("Socket.IO connection error:", err.message);
    }

    function handleNewMessage(message) {
      console.log("Real-time message received:", message);

      // Only display messages sent to the logged-in user.
      if (String(message.receiver) !== String(currentUser.id)) {
        return;
      }

      const formattedMessage = {
        id: message.id,
        sender:
          users.find((user) => String(user._id) === String(message.sender))
            ?.name || "Unknown",
        text: message.text,
        time: new Date(message.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        mine: false,
      };

      // Add the message only if it belongs to the open conversation.
      setSelectedChat((currentChat) => {
        if (currentChat && String(currentChat._id) === String(message.sender)) {
          setMessages((previous) => {
            if (previous.some((item) => item.id === formattedMessage.id)) {
              return previous;
            }

            return [...previous, formattedMessage];
          });
        }

        return currentChat;
      });

      // Update the conversation preview.
      setUsers((previous) =>
        previous.map((user) =>
          String(user._id) === String(message.sender)
            ? { ...user, lastMessage: message.text }
            : user,
        ),
      );
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("new_message", handleNewMessage);

    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("new_message", handleNewMessage);
      socket.disconnect();
    };
  }, [currentUser, users]);

  // Load conversation history whenever a user is selected.
  useEffect(() => {
    if (!selectedChat?._id) {
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
          const isMine = String(message.sender) === String(currentUser?.id);

          return {
            id: message.id,
            sender: isMine ? "You" : selectedChat.name,
            text: message.text,
            time: new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            mine: isMine,
          };
        });

        setMessages(formattedMessages);
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

  // Save a message in MongoDB before displaying it.
  async function handleSendMessage(text) {
    if (!selectedChat?._id || sending) return;

    const trimmedText = text.trim();
    if (!trimmedText) return;

    setSending(true);
    setError("");

    try {
      const savedMessage = await sendMessage(selectedChat._id, trimmedText);

      const isMine = String(savedMessage.sender) === String(currentUser?.id);

      const formattedMessage = {
        id: savedMessage.id,
        sender: isMine ? "You" : selectedChat.name,
        text: savedMessage.text,
        time: new Date(savedMessage.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        mine: isMine,
      };

      setMessages((previous) => [...previous, formattedMessage]);

      setUsers((previous) =>
        previous.map((user) =>
          user._id === selectedChat._id
            ? { ...user, lastMessage: trimmedText }
            : user,
        ),
      );
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(err.message || "Could not send message.");
    } finally {
      setSending(false);
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
    online: Boolean(user.isOnline),
  }));

  return (
    <main className="flex h-screen overflow-hidden bg-[#0b1020]">
      <Sidebar
        conversations={conversations}
        selectedChatId={selectedChat?.id}
        onSelectChat={setSelectedChat}
        currentUser={currentUser}
      />

      {selectedChat ? (
        <div className="flex min-w-0 flex-1 flex-col">
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
              selectedChat={selectedChat}
              messages={messages}
              onSendMessage={handleSendMessage}
              sending={sending}
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
