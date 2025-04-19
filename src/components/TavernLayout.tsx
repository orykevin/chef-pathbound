import React from "react";

export function TavernLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full flex flex-col items-start max-h-[calc(100vh-90px)] h-full">
      {children}
    </div>
  );
}
