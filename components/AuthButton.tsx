"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GitHubMark } from "./icons";

interface AuthState {
  live: boolean;
  configured: boolean;
  login: string | null;
}

/** Header sign-in control. Renders nothing until "Sign in with GitHub" is configured. */
export default function AuthButton() {
  const pathname = usePathname();
  const [auth, setAuth] = useState<AuthState | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(setAuth)
      .catch(() => setAuth(null));
  }, []);

  if (!auth?.configured) return null;

  if (auth.login) {
    return (
      <div className="flex items-center gap-2.5 text-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://github.com/${auth.login}.png?size=48`}
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 rounded-full border"
          style={{ borderColor: "var(--border-bright)" }}
        />
        <span className="hidden sm:inline" style={{ color: "var(--text-secondary)" }}>
          {auth.login}
        </span>
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
            window.location.reload();
          }}
          className="text-sm cursor-pointer hover:underline underline-offset-4"
          style={{ color: "var(--text-muted)" }}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <a
      href={`/signin?returnTo=${encodeURIComponent(pathname)}`}
      className="btn-ghost px-3.5 py-1.5 text-sm"
    >
      <GitHubMark size={14} />
      Sign in
    </a>
  );
}
