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
    a: "A free tool that scores a public GitHub profile out of 100 on how it comes across to recruiters and hiring managers. It looks at repository and README quality, commit habits, the languages you use and your open-source work, then tells you what to fix and suggests five projects to build next.",
  },
  {
    q: "Who is RepoLens for?",
    a: "Mostly students and early-career developers with public repositories who want to know how those repositories read to someone hiring. Bootcamps, university clubs and hackathon organizers can also score a whole group at once.",
  },
  {
    q: "Is RepoLens free?",
    a: "Yes. There's no paid plan and no credit card. Opening a report needs nothing at all, and analyzing a new profile needs a free GitHub sign-in.",
  },
  {
    q: "How is the RepoLens score calculated?",
    a: "It adds up six parts: repository quality (45 points), recent activity (15), coverage of things like tests, CI, demos and documentation (15), language breadth (10), open-source collaboration such as merged pull requests in other people's projects (10), and commit messages (5). Every weight is on the methodology page.",
  },
  {
    q: "What counts as a good score?",
    a: "80 and above is rated Excellent, 50 to 79 Developing, and below 50 Needs work. The scale is hard on purpose. The typical profile scores around 50 and about one in ten clears 80, because the top tier takes strong READMEs, live demos, recent activity and real collaboration all at once.",
  },
  {
    q: "Does RepoLens need access to my GitHub account?",
    a: "Not to open reports. Analyzing a new profile needs you to sign in with GitHub, but the RepoLens app asks for no permissions: it can only read what's already public, it can't see private repositories, and it can't change anything. Your sign-in stays in your browser for up to 8 hours.",
  },
];
