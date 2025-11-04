# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/playwright:v1.56.1-noble AS base

ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}

WORKDIR /app

RUN corepack enable

FROM base AS deps

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/scraper/package.json apps/scraper/package.json
COPY packages/convex-db/package.json packages/convex-db/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN pnpm fetch --filter scraper...

FROM base AS runner

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY --from=deps /pnpm /pnpm
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages ./packages
COPY apps/scraper ./apps/scraper

USER root

RUN pnpm install --filter scraper... --frozen-lockfile --offline --prod=false
RUN pnpm --filter scraper... run build
RUN chown -R pwuser:pwuser /app

USER pwuser
WORKDIR /app/apps/scraper

ENV NODE_ENV=production

CMD ["pnpm", "start"]
