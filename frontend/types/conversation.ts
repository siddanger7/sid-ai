import { ChatMessage } from "./chat";

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

export interface ConversationState {
  conversations: Conversation[];
  activeConversationId: string | null;
}