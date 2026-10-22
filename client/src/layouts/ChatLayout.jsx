
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

export default function ChatLayout() {
  return (
    <main className="flex h-screen overflow-hidden bg-[#0b1020]">
      <Sidebar />
      <ChatWindow />
    </main>
  );
}
