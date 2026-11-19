import type { Metadata } from "next";
import { GitHubMark } from "@/components/icons";
import SignOutButton from "@/components/SignOutButton";
import { safeReturnPath, sessionLogin, signInConfigured } from "@/lib/oauth";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Sign in with GitHub · ${SITE_NAME}`,
  description:
    "Live analysis on RepoLens needs a GitHub sign-in. Why, what RepoLens can and can't see, and where your sign-in is kept.",
  alternates: { canonical: "/signin" },
  robots: { index: false, follow: true },
};

const ERRORS: Record<string, string> = {
  cancelled: "Sign-in was cancelled on GitHub, so nothing was shared.",
  failed: "Sign-in didn't finish. Try again, and if it keeps failing, tell me through the Feedback button.",
  unavailable: "Sign-in isn't switched on right now.",
};

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl mt-10 mb-2">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>
      {children}
    </p>
  );
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; error?: string }>;
}) {
  const { returnTo, error } = await searchParams;
  const back = safeReturnPath(returnTo);
  const configured = signInConfigured();
  const login = configured ? await sessionLogin() : null;

  return (
    <article className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-5xl sm:text-6xl">Sign in with GitHub</h1>
      <p className="mt-5 text-lg leading-relaxed">
        If you want a live analysis, you need to sign in with GitHub. Reports that already exist open without an
        account.
      </p>

      {error && ERRORS[error] ? (
        <p className="mt-6 text-sm rounded-xl border px-4 py-3" style={{ borderColor: "var(--status-serious)", color: "var(--text-primary)" }}>
          {ERRORS[error]}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {!configured ? (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Sign-in isn&apos;t switched on yet, so only reports that already exist can be opened for now.
          </p>
        ) : login ? (
          <>
            <p className="w-full text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
              You&apos;re signed in as <span style={{ color: "var(--text-primary)" }}>{login}</span>.
            </p>
            <a href={back} className="btn-accent px-5 py-2.5 text-sm">
              Continue
            </a>
            <SignOutButton />
          </>
        ) : (
          <>
            <a href={`/api/auth/github?returnTo=${encodeURIComponent(back)}`} className="btn-accent px-5 py-2.5 text-sm">
              <GitHubMark size={16} />
              Continue with GitHub
            </a>
            <a href={back} className="btn-ghost px-5 py-2.5 text-sm">
              Not now
            </a>
          </>
        )}
      </div>

      <H2>Why it&apos;s needed</H2>
      <P>
        A fresh analysis makes about 40 requests to GitHub&apos;s API. GitHub only allows 60 an hour without an
        account, so RepoLens runs each analysis on your own GitHub account&apos;s allowance instead, which is 5,000
        requests an hour.
      </P>

      <H2>What RepoLens can see</H2>
      <P>
        Only what&apos;s already public on github.com. The RepoLens app asks for no permissions, so it can&apos;t
        read private repositories or your email address, and it can&apos;t change anything in your account.
      </P>

      <H2>Where your sign-in is kept</H2>
      <P>
        In a cookie in your browser, for up to 8 hours. It isn&apos;t stored on RepoLens&apos;s servers. You can
        sign out at any time, or remove RepoLens from{" "}
        <a href="https://github.com/settings/apps/authorizations" className="link">
          your authorized GitHub Apps
        </a>
        . More detail is on the{" "}
        <a href="/privacy" className="link">
          privacy page
        </a>
        .
      </P>
    </article>
  );
}
