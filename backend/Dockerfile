# ---- Etapa 1: instalar solo dependencias de producción ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Etapa 2: imagen final, mínima y sin privilegios ----
FROM node:20-alpine
WORKDIR /app

# La imagen node:alpine ya trae un usuario "node" (uid 1000) sin
# privilegios — se reutiliza en vez de correr como root dentro del
# contenedor, que es el descuido de seguridad más común en Docker.
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN chown -R node:node /app
USER node

EXPOSE 4000

# Docker (y docker-compose con "condition: service_healthy") usan esto
# para saber si el backend ya está listo, no solo "arrancado".
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:4000/api/health || exit 1

CMD ["node", "src/server.js"]j