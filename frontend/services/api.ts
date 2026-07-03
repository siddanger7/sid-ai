import { ChatMessage, SendMessageResponse } from "@/types/chat";

const MOCK_REPLIES: string[] = [
  `Here's a quick breakdown of what you asked for:

- I parsed your request
- Generated a structured response
- Formatted it for clarity

Let me know if you'd like me to go deeper into any part of this.`,
  `That's a great question. Let's think about it step by step.

1. First, we identify the core problem.
2. Then, we break it down into smaller pieces.
3. Finally, we assemble a solution.

Here's a small code example to illustrate the idea:

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}! Welcome to sid.ai\`;
}

console.log(greet("Siddiq"));
\`\`\`

Would you like me to expand on this further?`,
  `Sure — here's a clean implementation you can drop straight in:

\`\`\`javascript
const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};
\`\`\`

This pattern is especially useful for search inputs and resize handlers.`,
  `I've thought through this carefully. In short: **clarity beats cleverness**.

When designing systems, prioritize:

- Readability over micro-optimizations
- Predictable data flow
- Small, composable pieces

That's usually the path to something maintainable.`,
  `Here's a comparison, in plain text form:

**Option A** — Fast to build, harder to scale
**Option B** — Slower to build, scales beautifully

Given your context, I'd lean toward Option B for long-term stability.`,
];

function randomId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function pickMockReply(userMessage: string): string {
  const trimmed = userMessage.trim().toLowerCase();

  if (trimmed.includes("hello") || trimmed.includes("hi")) {
    return `Hey there 👋 I'm **sid.ai** — your AI assistant. What are we building today?`;
  }

  if (trimmed.includes("code") || trimmed.includes("function") || trimmed.includes("bug")) {
    return MOCK_REPLIES[2];
  }

  const index = Math.floor(Math.random() * MOCK_REPLIES.length);
  return MOCK_REPLIES[index];
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendMessage(message: string): Promise<SendMessageResponse> {
  const latency = 700 + Math.random() * 900;
  await wait(latency);

  const reply: ChatMessage = {
    id: randomId(),
    role: "assistant",
    content: pickMockReply(message),
    createdAt: Date.now(),
  };

  return { message: reply };
}

export const api = {
  sendMessage,
};