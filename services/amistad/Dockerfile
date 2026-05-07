FROM public.ecr.aws/docker/library/node:20-alpine AS deps
WORKDIR /fbook_api/services/amistad
COPY services/amistad/package*.json ./
RUN npm ci

FROM deps AS builder
COPY smithy_api/generated/ /fbook_api/smithy_api/generated/
COPY services/amistad/ .
RUN npm run build

FROM public.ecr.aws/docker/library/node:20-alpine AS production
WORKDIR /fbook_api/services/amistad
COPY --from=builder /fbook_api/services/amistad/dist ./dist
COPY --from=builder /fbook_api/services/amistad/node_modules ./node_modules
COPY --from=builder /fbook_api/services/amistad/package.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]

FROM deps AS development
COPY services/amistad/tsconfig.json ./
COPY services/amistad/nest-cli.json ./
COPY smithy_api/generated/ /fbook_api/smithy_api/generated/
EXPOSE 3000
CMD ["npm", "run", "start:dev"]
