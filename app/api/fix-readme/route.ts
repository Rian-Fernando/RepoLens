import { NextRequest, NextResponse } from "next/server";
import { generateJson, GeminiError } from "@/lib/gemini";
import { geminiAllowedFor, overLimit } from "@/lib/guard";

export const maxDuration = 60;

/**
 * Gemini is only called when (a) the visitor is outside the EEA, UK and
 * Switzerland — the free tier may not serve users there under the Gemini API
 * terms — and (b) the visitor is under the hourly AI cap. Otherwise the
 * built-in rules engine answers, so the feature still works for everyone.
 * Prompts carry no names, bios or usernames: the free tier's terms say not to
 * submit personal information.
 */
const AI_CALLS_PER_VISITOR_PER_HOUR = 30;

interface FixRequest {
  repoName: string;
  description: string | null;
  language: string | null;
  topics: string[];
  homepage: string | null;
  findings: string[];
  login: string;
}

const SCHEMA = {
  type: "OBJECT",
  properties: {
    readme: { type: "STRING", description: "Complete README.md content in Markdown" },
  },
  required: ["readme"],
};

const SYSTEM = `You write excellent GitHub READMEs. Given repo metadata, produce a complete, ready-to-commit README.md.
Structure: # title + one-line pitch · badges placeholder comment · Features · Quick start (install/run commands appropriate to the language) · Usage example with a code block · a "Screenshots" section with an HTML comment telling the author what to capture · Roadmap (3 items) · License line.
For the clone command use exactly: git clone https://github.com/OWNER/REPO.git (the literal words OWNER and REPO) — they are filled in afterwards.
Rules: never invent features that aren't implied by the name/description/topics — where you must assume, mark it with a "<!-- TODO: verify -->" comment. Keep it under 120 lines. No preamble — output only the file content.`;

function templateReadme(r: FixRequest): string {
  const install =
    r.language === "Python"
      ? "pip install -r requirements.txt\npython main.py"
      : r.language === "Go"
        ? "go run ."
        : "npm install\nnpm run dev";
  return `# ${r.repoName}

${r.description ?? "<!-- TODO: one-line pitch — what does this do and for whom? -->"}

${r.homepage ? `**Live demo:** ${r.homepage}` : "<!-- TODO: add a live demo link once deployed -->"}

## Features

- <!-- TODO: 3-5 bullets, lead with the most impressive -->

## Quick start

\`\`\`bash
git clone https://github.com/${r.login}/${r.repoName}.git
cd ${r.repoName}
${install}
\`\`\`

## Screenshots

<!-- TODO: add one screenshot or GIF of the main flow — this is the highest-impact 10 minutes you can spend -->

## Roadmap

- [ ] <!-- TODO: what would you build next? -->

## License

MIT — see [LICENSE](LICENSE).
`;
}

export async function POST(req: NextRequest) {
  let body: FixRequest;
  try {
    body = (await req.json()) as FixRequest;
    if (!body.repoName || !body.login) throw new Error("bad shape");
  } catch {
    return NextResponse.json({ error: "Send repo metadata as the request body." }, { status: 400 });
  }

  if (!geminiAllowedFor(req) || (await overLimit(req, "ai", AI_CALLS_PER_VISITOR_PER_HOUR, 60))) {
    return NextResponse.json({ readme: templateReadme(body), engine: "rules" });
  }

  try {
    const result = await generateJson<{ readme: string }>({
      system: SYSTEM,
      prompt: `Repo name: ${body.repoName}
Description: ${body.description ?? "none"}
Primary language: ${body.language ?? "unknown"}
Topics: ${body.topics.join(", ") || "none"}
Live demo URL: ${body.homepage ?? "none"}
Current README problems: ${body.findings.join("; ") || "missing entirely"}

Write the README.md now.`,
      schema: SCHEMA,
    });
    // the owner's username never went to Gemini; it's substituted in here
    const readme = result.readme.replaceAll("github.com/OWNER/REPO", `github.com/${body.login}/${body.repoName}`);
    return NextResponse.json({ readme, engine: "gemini" });
  } catch (e) {
    if (!(e instanceof GeminiError)) console.error("fix-readme failed", e);
    return NextResponse.json({ readme: templateReadme(body), engine: "rules" });
  }
}
