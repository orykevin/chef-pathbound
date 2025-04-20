"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="fixed w-full left-0 top-0  flex items-center justify-center h-full bg-yellow-100 overflow-auto">
      <div className=" max-w-lg w-full h-full bg-yellow-100 rounded-2xl p-4 md:p-8 flex flex-col gap-3 md:gap-6 ">
        <h2 className="text-center text-3xl font-bold text-yellow-900 font-serif mb-2 mt-4">PathBound</h2>
        <h2 className="text-center text-2xl font-bold text-yellow-900 font-serif mb-2">Adventure Together.<br /> Decide the Path.</h2>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitting(true);
            const formData = new FormData(e.target as HTMLFormElement);
            formData.set("flow", flow);
            void signIn("password", formData).catch((_error) => {
              const toastTitle =
                flow === "signIn"
                  ? "Could not sign in, did you mean to sign up?"
                  : "Could not sign up, did you mean to sign in?";
              toast.error(toastTitle);
              setSubmitting(false);
            });
          }}
        >
          <input
            className="rounded-lg border border-yellow-300 px-4 py-2 bg-yellow-50 text-yellow-900 placeholder-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-600 transition"
            type="email"
            name="email"
            placeholder="Email"
            required
          />
          <input
            className="rounded-lg border border-yellow-300 px-4 py-2 bg-yellow-50 text-yellow-900 placeholder-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-600 transition"
            type="password"
            name="password"
            placeholder="Password"
            required
          />
          <button
            className="px-4 py-2 rounded-lg font-semibold transition-colors bg-yellow-700 text-yellow-50 hover:bg-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
            type="submit"
            disabled={submitting}
          >
            {flow === "signIn" ? "Sign in" : "Sign up"}
          </button>
          <div className="text-center text-sm text-yellow-700">
            <span>{flow === "signIn" ? "Don't have an account? " : "Already have an account? "}</span>
            <button
              type="button"
              className="text-yellow-900 underline font-semibold cursor-pointer"
              onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
            >
              {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
            </button>
          </div>
        </form>
        <div className="flex items-center justify-center md:my-3">
          <hr className="my-1 md:my-3 grow border-yellow-300" />
          <span className="mx-4 text-yellow-400 font-bold">or</span>
          <hr className="my-1 md:my-3 grow border-yellow-300" />
        </div>
        <button
          className="px-4 py-2 rounded-lg font-semibold transition-colors border-2 border-yellow-600 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600"
          onClick={() => void signIn("anonymous")}
        >
          Sign in anonymously
        </button>
      </div>
    </div>
  );
}
