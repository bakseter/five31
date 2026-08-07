FROM node:24.19.0-alpine@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43 AS build

WORKDIR /app

RUN apk update && \
    apk add pnpm --no-cache

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN npm run build


FROM nginxinc/nginx-unprivileged:1.31.3-alpine-slim@sha256:98edb4ebb9aae4d8ff4bd2ea5edc9939cc2f7cd206a20644928ada32a657c052

USER root

RUN mkdir -p /tmp/nginx && \
    chown -R nginx:nginx /tmp/nginx

USER nginx

COPY --from=build /app/dist /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000
