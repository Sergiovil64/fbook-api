FROM node:20-alpine AS deps
WORKDIR /fbook_api/services/usuario
COPY services/usuario/package*.json ./
RUN npm ci

FROM deps AS builder
COPY smithy_api/generated/ /fbook_api/smithy_api/generated/
COPY services/usuario/ .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /fbook_api/services/usuario
COPY --from=builder /fbook_api/services/usuario/dist ./dist
COPY --from=builder /fbook_api/services/usuario/node_modules ./node_modules
COPY --from=builder /fbook_api/services/usuario/package.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]

FROM deps AS development
COPY services/usuario/tsconfig.json ./
COPY services/usuario/nest-cli.json ./
COPY services/usuario/.env.example .env
COPY smithy_api/generated/ /fbook_api/smithy_api/generated/
EXPOSE 3000
CMD ["npm", "run", "start:dev"]
