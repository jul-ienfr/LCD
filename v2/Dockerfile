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
RUN BETTER_AUTH_SECRET=build-only-change-me-please-32chars-min npm run build

FROM deps AS prod-deps
RUN npm prune --omit=dev

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
# adapter-node doit connaître le protocole et l'hôte réels derrière Caddy,
# sinon SvelteKit rejette les formulaires comme « cross-site ».
ENV PROTOCOL_HEADER=x-forwarded-proto
ENV HOST_HEADER=x-forwarded-host
RUN useradd -r -u 10001 lcd && chown -R lcd:lcd /app
USER lcd
COPY --from=prod-deps --chown=lcd:lcd /app/node_modules ./node_modules
COPY --from=build --chown=lcd:lcd /app/build ./build
COPY --from=build --chown=lcd:lcd /app/package.json ./package.json
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "build"]
