export type MessageRole = "user" | "assistant";

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  title: string;
  preview: string;
  updatedAt: number;
}

export interface SendMessageResponse {
  message: ChatMessage;
}