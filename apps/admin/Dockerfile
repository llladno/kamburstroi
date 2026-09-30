FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/admin/package.json apps/admin/package.json
RUN pnpm install --frozen-lockfile --filter admin...
COPY apps/admin apps/admin
ARG VITE_API_BASE=http://localhost:3000/api
ENV VITE_API_BASE=$VITE_API_BASE
RUN pnpm --filter admin build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
EXPOSE 80
