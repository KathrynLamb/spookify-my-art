// app/design/components/Composer.tsx

"use client";

import { Send } from "lucide-react";
import { useState } from "react";


export function Composer({ onSend, disabled }: { onSend: (v: string) => void; disabled: boolean }) {
  const [value, setValue] = useState("");


  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
      <div className="flex gap-2 items-end">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          placeholder="Tell me what you’d like to create"
          className="flex-1 bg-transparent resize-none px-3 py-2"
        />
        <button
          className="bg-white text-black rounded-full px-4 py-2 disabled:opacity-40"
          onClick={() => {
            if (value.trim()) {
              onSend(value.trim());
              setValue("");
            }
          }}
          disabled={disabled || !value.trim()}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
