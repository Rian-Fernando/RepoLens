export const ROLES = [
  { id: "fullstack", label: "Full-stack" },
  { id: "frontend", label: "Frontend" },
  { id: "backend", label: "Backend / API" },
  { id: "data-ml", label: "Data / ML" },
  { id: "devops", label: "DevOps / Platform" },
] as const;

export type RoleId = (typeof ROLES)[number]["id"];

export function roleLabel(id: string): string {
  return ROLES.find((r) => r.id === id)?.label ?? "Full-stack";
}

/**
 * Role expectation per coverage area, 0-100 — the "target polygon" on the
 * role-fit radar. Keys match gap ids from lib/analyze.ts.
 */
export const ROLE_RADAR: Record<RoleId, Record<string, number>> = {
  fullstack: { tests: 70, ci: 70, demo: 90, readme: 80, backend: 85, docker: 55, data: 35, license: 60 },
  frontend: { tests: 65, ci: 60, demo: 95, readme: 85, backend: 40, docker: 30, data: 25, license: 60 },
  backend: { tests: 90, ci: 85, demo: 60, readme: 75, backend: 95, docker: 75, data: 40, license: 60 },
  "data-ml": { tests: 60, ci: 55, demo: 70, readme: 85, backend: 50, docker: 55, data: 95, license: 60 },
  devops: { tests: 75, ci: 95, demo: 55, readme: 80, backend: 60, docker: 95, data: 30, license: 70 },
};

/** What each target role expects a portfolio to show — feeds the AI prompt and roadmap emphasis. */
export const ROLE_EXPECTATIONS: Record<RoleId, string> = {
  fullstack:
    "end-to-end products: a deployed web app with a real backend, auth, a database, tests, and CI",
  frontend:
    "polished, deployed UIs: responsive design, accessibility, state management, component testing, performance work, and visual craft",
  backend:
    "APIs and systems: REST/GraphQL services, databases, caching, authentication, load handling, integration tests, and observability",
  "data-ml":
    "applied data work: datasets wrangled end-to-end, models trained and evaluated honestly, notebooks turned into reproducible pipelines, and at least one deployed inference demo",
  devops:
    "infrastructure as a product: Dockerized services, CI/CD pipelines, IaC (Terraform or similar), monitoring, and documented runbooks",
};
