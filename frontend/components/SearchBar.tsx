"use client";

import { useState, useEffect } from "react";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => onChange(local), 250);
    return () => clearTimeout(timer);
  }, [local, onChange]);

  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="搜尋技能名稱或描述..."
        className="w-full pl-9 pr-4 py-2.5 text-sm border border-zinc-200 rounded-xl bg-white placeholder-zinc-400 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
      />
      {local && (
        <button
          onClick={() => { setLocal(""); onChange(""); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
