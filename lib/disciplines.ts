export const DISCIPLINES = [
  { id: "engineering", label: "Engineering" },
  { id: "computer-science", label: "Computer Science" },
  { id: "physical-sciences", label: "Physics, Chemistry & Maths" },
  { id: "life-sciences", label: "Biological Sciences" },
  { id: "medicine-health", label: "Medicine & Health" },
  { id: "veterinary", label: "Veterinary Science" },
  { id: "psychology", label: "Psychology" },
  { id: "business-economics", label: "Business & Economics" },
  { id: "law", label: "Law" },
  { id: "social-sciences", label: "Politics, Sociology & Policy" },
  { id: "education", label: "Education" },
  { id: "arts-humanities", label: "Arts & Humanities" },
  { id: "geography-environment", label: "Geography & Environment" },
  { id: "general", label: "General academic topics" },
] as const;

export type DisciplineId = (typeof DISCIPLINES)[number]["id"];

export const DISCIPLINE_LABEL: Record<string, string> = Object.fromEntries(DISCIPLINES.map((d) => [d.id, d.label]));
