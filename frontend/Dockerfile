FROM node:24.22.1-alpine@sha256:6a1c190e17215d844926b0677f4bf87273ff7d5e54db06d3b5b5863ab0b09a3d AS build

WORKDIR /app

RUN apk update && \
    apk add pnpm --no-cache

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN npm run build


FROM nginx/nginx-unprivileged:1.31.8-alpine-slim@sha256:a2ae214d0266826427b804b0513dce20c9c93b862f1593203f9e6b50be9c2689

USER root

RUN mkdir -p /tmp/nginx && \
    chown -R nginx:nginx /tmp/nginx

USER nginx

COPY --from=build /app/dist /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000
