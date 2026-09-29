FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/site/package.json apps/site/package.json
RUN pnpm install --frozen-lockfile --filter site...
COPY apps/site apps/site
RUN pnpm --filter site build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/site/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
