"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button className="px-4 py-2 rounded-lg transition-colors border-2 border-yellow-600 bg-yellow-50 text-yellow-600" onClick={() => void signOut()}>
      Sign out
    </button>
  );
}
