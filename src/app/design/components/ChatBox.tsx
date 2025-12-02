"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "../types";     // <-- ensure correct path
import { ChatMessage as ChatMessageBubble } from "./ChatMessage";

/**
 * ChatBox Component
 * messages: Array of ChatMessage + optional typing flag
 */
type ChatBoxProps = {
  messages: (ChatMessage & { typing?: boolean })[];
};

export function ChatBox({ messages }: ChatBoxProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="bg-gray-950 rounded-xl p-4 border border-white/10 h-[60vh] overflow-y-auto space-y-4">
      {messages.map((m, i) => {
        if (m.typing) {
          return (
            <div
              key={i}
              className="flex items-center text-white/60 animate-pulse"
            >
              <div className="w-2 h-2 bg-white/30 rounded-full mr-1" />
              <div className="w-2 h-2 bg-white/30 rounded-full mr-1" />
              <div className="w-2 h-2 bg-white/30 rounded-full" />
            </div>
          );
        }

        return (
          <div key={i} className="fade-in">
            <ChatMessageBubble role={m.role} content={m.content} />
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}
