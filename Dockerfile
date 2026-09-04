# syntax=docker/dockerfile:1

# ── deps ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ── dev: Vite dev server + HMR ──────────────────────────────────────────────
FROM node:22-alpine AS dev
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 1311
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ── build ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Variabel VITE_ dibaca saat build, bukan saat run — nilainya ikut ter-bundel.
ARG VITE_API_MODE=mock
ARG VITE_API_BASE_URL=
ARG VITE_PAYMENT_PROVIDER=mock
ARG VITE_AD_PROVIDER=mock
ARG VITE_APP_VERSION=0.1.0
ENV VITE_API_MODE=$VITE_API_MODE \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_PAYMENT_PROVIDER=$VITE_PAYMENT_PROVIDER \
    VITE_AD_PROVIDER=$VITE_AD_PROVIDER \
    VITE_APP_VERSION=$VITE_APP_VERSION
RUN npm run build

# ── prod: nginx menyajikan berkas statis ────────────────────────────────────
FROM nginx:1.27-alpine AS prod
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost/ >/dev/null || exit 1
CMD ["nginx", "-g", "daemon off;"]
