FROM node:22.22.3-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_SUPABASE_URL=https://uajpewjagduzdpwlynrv.supabase.co
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
RUN npm run lint && npm run build && npm run build:server

FROM node:22.22.3-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4179 GARDEN_DATABASE=/data/plantings.sqlite
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && mkdir /data && chown node:node /data
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
USER node
VOLUME /data
EXPOSE 4179
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:4179/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "dist-server/serve.mjs"]
