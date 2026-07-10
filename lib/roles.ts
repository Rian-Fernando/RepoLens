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
