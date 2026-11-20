import { GitHubMark } from "./icons";
import Link from "next/link";

/** Shown wherever a visitor asks for a profile that needs a live analysis. */
export default function SignInPrompt({ returnTo, message }: { returnTo: string; message?: string }) {
  return (
    <div className="card p-5 flex flex-wrap items-center justify-between gap-4">
      <div className="text-sm max-w-xl">
        <p className="font-medium">Sign in to run a live analysis</p>
        <p className="mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {message ??
            "This profile hasn't been analyzed yet. Live analysis needs a GitHub sign-in: it only reads public data, and it runs on your own GitHub account's rate limit."}
        </p>
      </div>
      <Link href={`/signin?returnTo=${encodeURIComponent(returnTo)}`} className="btn-accent px-4 py-2 text-sm">
        <GitHubMark size={15} />
        Sign in with GitHub
      </Link>
    </div>
  );
}
