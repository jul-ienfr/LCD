# web/Dockerfile — front LCD auto-hébergé (self-hosted, 0 €).
# Build multi-stage (guide embarqué Next : output standalone + server.js minimal
# sans node_modules). SSR + Server Actions : le navigateur ne parle JAMAIS à la
# gateway en direct — les lectures/écritures passent par le serveur Next, qui lit
# LCD_GATEWAY_URL au RUNTIME (jamais commité, monté par compose).
# Build : docker build -f web/Dockerfile -t lcd-web:local .
# Run : LCD_GATEWAY_URL=http://gateway-parc:8443 (nom du service sur le réseau
# Docker partagé, jamais en dur ici — variable d'environnement du compose).

# --- Étape 1 : dépendances (cache stable tant que package.json/lock ne changent pas)
FROM node:24-slim AS deps
WORKDIR /app
COPY web/package.json web/package-lock.json ./
# `npm ci` reproductible (lock versionné, voir .gitignore racine) — jamais de
# `npm install` flottant en image. Jamais de secret ici.
RUN npm ci

# --- Étape 2 : build (standalone : .next/standalone + server.js minimal)
FROM node:24-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY web/ ./
# public/ + .next/static copiés dans standalone (pas de CDN en self-hosted).
RUN npm run build \
  && cp -r public .next/standalone/ 2>/dev/null || true \
  && cp -r .next/static .next/standalone/.next/ 2>/dev/null || true

# --- Étape 3 : runtime minimal (node seul, jamais root, jamais de secret)
FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3100
ENV HOSTNAME=0.0.0.0
RUN useradd -r -u 10001 lcd && chown -R lcd:lcd /app
USER lcd
COPY --from=build --chown=lcd:lcd /app/.next/standalone ./
COPY --from=build --chown=lcd:lcd /app/.next/static ./.next/static
COPY --from=build --chown=lcd:lcd /app/public ./public
EXPOSE 3100
HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3100/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
