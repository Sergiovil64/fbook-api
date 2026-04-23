FROM node:20-alpine AS deps
WORKDIR /fbook_api/services/publicacion
COPY services/publicacion/package*.json ./
RUN npm ci

FROM deps AS builder
COPY smithy_api/generated/ /fbook_api/smithy_api/generated/
COPY services/publicacion/ .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /fbook_api/services/publicacion
COPY --from=builder /fbook_api/services/publicacion/dist ./dist
COPY --from=builder /fbook_api/services/publicacion/node_modules ./node_modules
COPY --from=builder /fbook_api/services/publicacion/package.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]

FROM deps AS development
COPY smithy_api/generated/ /fbook_api/smithy_api/generated/
EXPOSE 3000
CMD ["npm", "run", "start:dev"]
