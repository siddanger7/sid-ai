import Sidebar from "../components/sidebar/Sidebar";
import Header from "../components/header/Header";
import ChatWindow from "../components/chat/ChatWindow";
import MessageInput from "../components/input/MessageInput";

export default function Home() {
  return (
    <main className="flex h-screen">

      <Sidebar />

      <section className="flex flex-1 flex-col">

        <Header />

        <ChatWindow />

        <MessageInput />

      </section>

    </main>
  );
}