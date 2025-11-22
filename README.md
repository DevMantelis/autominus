# Autominus

Autominus is a modern car listings companion that blends a consumer-facing web experience with the tooling needed to source and enrich vehicle data. Everything runs from a single Turborepo so UI, scraping jobs, shared configs, and Convex data models evolve together.

> ⚠️ The website is under active development. Expect frequent changes as core features land.

## Apps & Packages

- `apps/web` – Next.js 16 + React 19 application that renders the public listings experience with HeroUI, Tailwind, and Convex for realtime data.
- `apps/scraper` – Playwright/Node-based scraper that ingests source listings, normalizes them, and pushes structured records to Convex.
- `packages/convex-db` – Shared Convex schema and server-side functions used by both apps.
- `packages/eslint-config` / `packages/typescript-config` – Centralized linting and TypeScript settings that keep every project aligned.

## Tech Stack

- Turborepo + pnpm workspace for orchestration and caching.
- Next.js 16, React 19, and HeroUI for the front-end.
- Convex for realtime data storage and server functions.
- Tailwind CSS 4 for styling, Framer Motion for motion, Lucide for icons.
- Playwright + Puppeteer Extra for scraping, Day.js/Moment for time helpers.

## Getting Started

### Requirements

- Node.js 18+
- [pnpm](https://pnpm.io/) 9+
- A Convex project + environment variables for both the web app and scraper (see `.env.example` files if available).

### Install dependencies

```sh
pnpm install
```

### Run everything in development

```sh
pnpm dev
```

This starts the dev servers defined in each package via Turborepo.

### Build for production

```sh
pnpm build
```

### Other useful scripts

```sh
pnpm lint
pnpm check-types
```

Run them from the repo root to lint or type-check every package concurrently.

## Roadmap

- Landing page polish with hero content, FAQs, and waitlist capture.
- Listings improvements:
  - Filters for make, price, mileage, body type, transmission, condition, and more.
  - Sort controls for relevance, freshness, and price direction.
  - Expandable listing details with full spec sheets and seller notes.
  - Listing's photo carousel with lazy loading and keyboard navigation.
- Authentication & bookmarks so signed-in users can save searches and individual cars.
- Number plates search for reverse lookups when a photo or registration ID is all you have.
- “Near me” listings using device geolocation plus distance-to-seller indicators.

## Contributing

Contributions are welcome while the project is in flux. Open an issue with your proposal or pick up a roadmap item, then submit a PR aligned with the shared ESLint and TypeScript configs. Continuous deployment is disabled until the core feature set above ships.
