# Multi-stage build optimizado

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production

FROM node:20-alpine AS final
WORKDIR /usr/src/app

# Copiar dependencias instaladas
COPY --from=builder /app/node_modules ./node_modules

# Copiar código fuente (estructura real del proyecto)
COPY src/ ./src/

EXPOSE 8080

# Usuario no privilegiado (DSA: Least Privilege)
USER node

CMD ["node", "src/server.js"]