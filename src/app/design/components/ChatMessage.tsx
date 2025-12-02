// app/design/components/ChatMessage.tsx

export function ChatMessage({ role, content }: { role: string; content: string }) {
    const isUser = role === "user";
  
    return (
      <div className={`my-2 w-full ${isUser ? "text-right" : "text-left"}`}>
        <div
          className={`inline-block px-3 py-2 rounded-lg max-w-[80%] whitespace-pre-wrap
            ${isUser ? "bg-purple-700" : "bg-gray-800"}`}
        >
          {content}
        </div>
      </div>
    );
  }
  