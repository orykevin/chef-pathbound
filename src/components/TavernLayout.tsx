import React from "react";

export function TavernLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-200 flex flex-col items-center py-8">
      <div className="w-full max-w-2xl bg-white/90 rounded-xl shadow-lg p-8 border-4 border-yellow-700">
        <div className="flex items-center mb-6">
          <img src="/og-preview.jpg" alt="Tavern" className="w-16 h-16 rounded-full mr-4 border-2 border-yellow-700" />
          <h1 className="text-4xl font-extrabold text-yellow-900 font-serif">PathBound Tavern</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
