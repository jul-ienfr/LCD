FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS tools
WORKDIR /app
COPY . .
ENV NODE_ENV=production
CMD ["npm", "run", "db:migrate"]

FROM node:24-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Secret factice uniquement pour la validation d'environnement au build.
# Le vrai secret est injecté au runtime par .env.prod.
ENV NEXT_TELEMETRY_DISABLED=1
RUN BETTER_AUTH_SECRET=build-only-change-me-please-32chars-min npm run build

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN useradd -r -u 10001 lcd && chown -R lcd:lcd /app
USER lcd
COPY --from=build --chown=lcd:lcd /app/.next/standalone ./
COPY --from=build --chown=lcd:lcd /app/.next/static ./.next/static
COPY --from=build --chown=lcd:lcd /app/public ./public
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
