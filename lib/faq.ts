/**
 * Single source of truth for the home-page FAQ: rendered as visible HTML
 * (what AI answer engines actually quote) and as FAQPage JSON-LD (what
 * Google rich results and AI grounding parse). Answers are plain, factual,
 * and self-contained so any one of them can be lifted as a citation.
 */
export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    q: "What is RepoLens?",
    a: "RepoLens is a free web app that analyzes any public GitHub profile and scores it out of 100 on how well it presents its owner to recruiters and hiring managers. It reviews repository quality, README quality, commit habits, language breadth, and open-source collaboration, then tells you exactly what to fix and which five projects to build next.",
  },
  {
    q: "Who is RepoLens for?",
    a: "It is built for students, junior developers, and job-seeking engineers who have public repositories but no clear sense of how those repositories read to someone deciding whether to hire them. Bootcamps, university clubs, and hackathon organizers can also score an entire cohort at once.",
  },
  {
    q: "Is RepoLens free?",
    a: "Yes, completely free. There is no paid tier, no sign-up, and no credit card. Analyzing a profile requires nothing but a GitHub username. Signing in with GitHub is optional and only unlocks opening suggested fixes as pull requests on your own repositories.",
  },
  {
    q: "How is the RepoLens score calculated?",
    a: "The 0-100 score combines six weighted components: repository quality (45 points), recent activity (15), portfolio coverage across areas like tests, CI, demos and documentation (15), language breadth (10), open-source collaboration such as merged pull requests in other people's projects (10), and commit-message craft (5). Every weight is published on the methodology page.",
  },
  {
    q: "What counts as a good score?",
    a: "Scores of 80 and above are rated EXCELLENT, 50 to 79 DEVELOPING, and below 50 NEEDS WORK. The scale is deliberately demanding: the median analyzed profile scores around 50, and roughly one profile in ten clears 80, because reaching the top tier requires strong READMEs, live demos, recent activity, and real collaboration together.",
  },
  {
    q: "Does RepoLens need access to my GitHub account?",
    a: "No. It reads only public data through the official GitHub API, so you can analyze any profile without signing in. Optional GitHub sign-in is used solely to open pull requests on repositories you own, and RepoLens never requests access to private repositories.",
  },
];
