
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

const initialConversations = [
  {
    id: 1,
    name: "Alex Morgan",
    message: "Nice! The UI is going to look great 🔥",
    time: "2m",
    online: true,
  },
  {
    id: 2,
    name: "Sarah Chen",
    message: "That looks amazing 🔥",
    time: "15m",
    online: true,
  },
  {
    id: 3,
    name: "Dev Squad",
    message: "You: pushed the latest code",
    time: "1h",
    online: false,
  },
  {
    id: 4,
    name: "Jordan Lee",
    message: "You're welcome!",
    time: "3h",
    online: false,
  },
];

const initialMessages = {
  1: [
    { id: 1, sender: "Alex Morgan", text: "Hey! How's the new project going?", time: "10:42 AM", mine: false },
    { id: 2, sender: "You", text: "Pretty good! I'm building KNOT from scratch.", time: "10:43 AM", mine: true },
    { id: 3, sender: "Alex Morgan", text: "Nice! The UI is going to look great 🔥", time: "10:43 AM", mine: false },
  ],
  2: [
    { id: 4, sender: "Sarah Chen", text: "Hey! How are you?", time: "10:30 AM", mine: false },
    { id: 5, sender: "You", text: "I'm good! How about you?", time: "10:31 AM", mine: true },
    { id: 6, sender: "Sarah Chen", text: "That looks amazing 🔥", time: "10:32 AM", mine: false },
  ],
  3: [
    { id: 7, sender: "Dev Squad", text: "The latest code is ready for review.", time: "9:15 AM", mine: false },
    { id: 8, sender: "You", text: "You pushed the latest code.", time: "9:20 AM", mine: true },
  ],
  4: [
    { id: 9, sender: "Jordan Lee", text: "Thanks for the help!", time: "8:45 AM", mine: false },
    { id: 10, sender: "You", text: "You're welcome!", time: "8:46 AM", mine: true },
  ],
};

export default function ChatLayout() {
  const [conversations, setConversations] = useState(initialConversations);
  const [messagesByChat, setMessagesByChat] = useState(initialMessages);

  const [selectedChat, setSelectedChat] = useState(initialConversations[0]);

  function sendMessage(text) {
    const now = new Date();
    const messageTime = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newMessage = {
      id: Date.now(),
      sender: "You",
      text,
      time: messageTime,
      mine: true,
    };

    setMessagesByChat((previous) => ({
      ...previous,
      [selectedChat.id]: [
        ...(previous[selectedChat.id] || []),
        newMessage,
      ],
    }));

    setConversations((previous) =>
      [
        ...previous.map((chat) =>
          chat.id === selectedChat.id
            ? {
                ...chat,
                message: `You: ${text}`,
                time: "now",
              }
            : chat
        ),
      ].sort((a, b) => {
        if (a.id === selectedChat.id) return -1;
        if (b.id === selectedChat.id) return 1;
        return 0;
      })
    );
  }

  return (
    <main className="flex h-screen overflow-hidden bg-[#0b1020]">
      <Sidebar
        conversations={conversations}
        selectedChatId={selectedChat.id}
        onSelectChat={setSelectedChat}
      />

      <ChatWindow
        selectedChat={selectedChat}
        messages={messagesByChat[selectedChat.id] || []}
        onSendMessage={sendMessage}
      />
    </main>
  );
}
