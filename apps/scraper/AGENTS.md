# Repository Guidelines

## Project Structure & Module Organization
This app lives in `apps/scraper`. All TypeScript sources sit in `src/`, with `main.ts` orchestrating the scrape workflow. Shared utilities such as `browser.ts`, `helpers.ts`, and `database.ts` encapsulate Chromium setup, data normalization, and persistence. Vendor-specific scrapers reside in `src/sources/` with one module per marketplace and an index aggregator; add new integrations by mirroring this layout. Build artifacts land in `dist/`, produced by the `tsup` bundler. Runtime environment contracts are defined in `env.ts`; update schemas there whenever a new `.env` variable is introduced.

## Build, Test, and Development Commands
Run commands with pnpm from the repository root: `pnpm --filter scraper dev` starts the local runner via `tsx`, and `pnpm --filter scraper typecheck` performs a type-check when needed. `pnpm --filter scraper build` bundles into `dist/` for production through `tsup`. Use `pnpm --filter scraper start` to execute the compiled bundle with Node’s ESM resolver. Keep linting clean with `pnpm --filter scraper lint`, which applies the workspace ESLint config.

## Coding Style & Naming Conventions
We use TypeScript strict mode with the shared `@repo/typescript-config`. Favor named exports and keep modules focused on one concern. Follow the ESLint ruleset in `eslint.config.mjs`; it enforces 2-space indentation, single quotes, and Effect-friendly patterns. File names are kebab-case for modules (`get_plates.ts`) and camelCase for helper functions. Log through `pino` and keep structured messages.

## Testing Guidelines
Adopt `@playwright/test` for both unit-like browser automation and integration coverage. Place specs alongside sources as `<name>.spec.ts` to keep context close, and stub network calls via Playwright fixtures when possible. Execute the suite with `pnpm --filter scraper exec playwright test`; aim to cover new scraping branches and error handling paths. Capture deterministic selectors in helpers so site changes are easy to adjust.

## Commit & Pull Request Guidelines
Follow Conventional Commits as seen in history (`chore(scraper): …`, `refactor(scraper): …`). Limit subjects to 72 characters and describe the user-visible impact in the body when needed. Pull requests should link relevant issues, explain scraping changes, list environment updates, and include before/after evidence (logs or screenshots) for new marketplace behaviour. Request review when lint and tests are green.
