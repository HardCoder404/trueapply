export type Resource = {
  title: string;
  url: string;
  kind: "docs" | "course" | "project" | "book";
};

const byskill: Record<string, Resource[]> = {
  react: [
    { title: "react.dev — Learn React", url: "https://react.dev/learn", kind: "docs" },
    {
      title: "Build a Kanban board with drag and drop",
      url: "https://react.dev/learn/thinking-in-react",
      kind: "project",
    },
  ],
  "next.js": [
    {
      title: "Next.js App Router course",
      url: "https://nextjs.org/learn",
      kind: "course",
    },
    {
      title: "Next.js docs — Data fetching and caching",
      url: "https://nextjs.org/docs/app/building-your-application/data-fetching",
      kind: "docs",
    },
  ],
  typescript: [
    {
      title: "TypeScript Handbook",
      url: "https://www.typescriptlang.org/docs/handbook/intro.html",
      kind: "docs",
    },
    {
      title: "Total TypeScript — free beginner tutorials",
      url: "https://www.totaltypescript.com/tutorials",
      kind: "course",
    },
  ],
  javascript: [
    {
      title: "javascript.info — The Modern JavaScript Tutorial",
      url: "https://javascript.info/",
      kind: "course",
    },
    {
      title: "MDN JavaScript guide",
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
      kind: "docs",
    },
  ],
  "node.js": [
    {
      title: "Node.js official learn guides",
      url: "https://nodejs.org/en/learn",
      kind: "docs",
    },
    {
      title: "Build a REST API with Express and Postgres",
      url: "https://expressjs.com/en/starter/installing.html",
      kind: "project",
    },
  ],
  python: [
    {
      title: "Python docs — The Python Tutorial",
      url: "https://docs.python.org/3/tutorial/",
      kind: "docs",
    },
    {
      title: "Automate the Boring Stuff with Python",
      url: "https://automatetheboringstuff.com/",
      kind: "book",
    },
  ],
  postgres: [
    { title: "PostgreSQL Exercises", url: "https://pgexercises.com/", kind: "course" },
    {
      title: "Use The Index, Luke — indexing for developers",
      url: "https://use-the-index-luke.com/",
      kind: "book",
    },
  ],
  sql: [
    {
      title: "SQLBolt — interactive SQL lessons",
      url: "https://sqlbolt.com/",
      kind: "course",
    },
    { title: "Mode SQL tutorial", url: "https://mode.com/sql-tutorial/", kind: "course" },
  ],
  go: [
    { title: "A Tour of Go", url: "https://go.dev/tour/", kind: "course" },
    { title: "Go by Example", url: "https://gobyexample.com/", kind: "docs" },
  ],
  java: [
    { title: "Dev.java — Learn Java", url: "https://dev.java/learn/", kind: "docs" },
    {
      title: "Baeldung Spring Boot guides",
      url: "https://www.baeldung.com/spring-boot",
      kind: "course",
    },
  ],
  docker: [
    {
      title: "Docker — Get started guide",
      url: "https://docs.docker.com/get-started/",
      kind: "docs",
    },
    {
      title: "Containerise a Node app and run it with Compose",
      url: "https://docs.docker.com/guides/nodejs/",
      kind: "project",
    },
  ],
  kubernetes: [
    {
      title: "Kubernetes basics tutorial",
      url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
      kind: "course",
    },
  ],
  aws: [
    {
      title: "AWS Skill Builder — free courses",
      url: "https://skillbuilder.aws/",
      kind: "course",
    },
  ],
  playwright: [
    {
      title: "Playwright docs — Writing tests",
      url: "https://playwright.dev/docs/writing-tests",
      kind: "docs",
    },
    {
      title: "Add end-to-end tests to an existing app",
      url: "https://playwright.dev/docs/intro",
      kind: "project",
    },
  ],
  tailwind: [
    { title: "Tailwind CSS docs", url: "https://tailwindcss.com/docs", kind: "docs" },
  ],
  css: [
    {
      title: "MDN — Learn CSS",
      url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics",
      kind: "course",
    },
  ],
  graphql: [
    { title: "How to GraphQL", url: "https://www.howtographql.com/", kind: "course" },
  ],
  redis: [
    {
      title: "Redis University — free courses",
      url: "https://university.redis.com/",
      kind: "course",
    },
  ],
  "system design": [
    {
      title: "System Design Primer",
      url: "https://github.com/donnemartin/system-design-primer",
      kind: "book",
    },
  ],
  "machine learning": [
    {
      title: "fast.ai — Practical Deep Learning",
      url: "https://course.fast.ai/",
      kind: "course",
    },
    {
      title: "Google ML Crash Course",
      url: "https://developers.google.com/machine-learning/crash-course",
      kind: "course",
    },
  ],
  "data analysis": [
    {
      title: "pandas — 10 minutes to pandas",
      url: "https://pandas.pydata.org/docs/user_guide/10min.html",
      kind: "docs",
    },
    {
      title: "Kaggle Learn — free micro-courses",
      url: "https://www.kaggle.com/learn",
      kind: "course",
    },
  ],
  flutter: [
    {
      title: "Flutter codelabs",
      url: "https://docs.flutter.dev/codelabs",
      kind: "course",
    },
  ],
  "react native": [
    {
      title: "React Native — Learn the basics",
      url: "https://reactnative.dev/docs/getting-started",
      kind: "docs",
    },
  ],
  django: [
    {
      title: "Django — Writing your first app",
      url: "https://docs.djangoproject.com/en/stable/intro/tutorial01/",
      kind: "course",
    },
  ],
  rust: [
    {
      title: "The Rust Programming Language book",
      url: "https://doc.rust-lang.org/book/",
      kind: "book",
    },
  ],
  git: [{ title: "Pro Git book", url: "https://git-scm.com/book/en/v2", kind: "book" }],
  figma: [
    {
      title: "Figma — Learn design",
      url: "https://help.figma.com/hc/en-us/sections/4405269443991-Figma-for-beginners",
      kind: "course",
    },
  ],
};

const aliases: Record<string, string> = {
  reactjs: "react",
  "react.js": "react",
  nextjs: "next.js",
  next: "next.js",
  ts: "typescript",
  js: "javascript",
  node: "node.js",
  nodejs: "node.js",
  postgresql: "postgres",
  tailwindcss: "tailwind",
  "tailwind css": "tailwind",
  k8s: "kubernetes",
  golang: "go",
  ml: "machine learning",
  pandas: "data analysis",
};

export function resourcesFor(skill: string): {
  skill: string;
  resources: Resource[];
  curated: boolean;
} {
  const key = skill.trim().toLowerCase();
  const canonical = aliases[key] ?? key;
  const resources = byskill[canonical];
  if (resources) return { skill: canonical, resources, curated: true };
  return {
    skill: canonical,
    curated: false,
    resources: [
      {
        title: `Official ${skill} documentation`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(`${skill} official documentation`)}`,
        kind: "docs",
      },
      {
        title: `Build a small project with ${skill} and put it on GitHub`,
        url: "https://github.com/new",
        kind: "project",
      },
    ],
  };
}
