import { ChatMessage } from "../../../types/chat";

interface Props {
  message: ChatMessage;
}

export default function Message({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex mb-5 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-2xl rounded-2xl px-5 py-4 whitespace-pre-wrap ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-[var(--bg-surface)] text-[var(--text-primary)] backdrop-blur-xl"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}