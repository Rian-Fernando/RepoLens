"use client";

export default function SignOutButton({ className = "btn-ghost px-4 py-2 text-sm" }: { className?: string }) {
  return (
    <button
      type="button"
      className={`${className} cursor-pointer`}
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        window.location.href = "/signin";
      }}
    >
      Sign out
    </button>
  );
}
