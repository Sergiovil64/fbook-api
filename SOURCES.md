# Sources and references (fbook-api)

## 1. Smithy (model, validation, build)

| Topic | Source |
|--------|--------|
| Smithy language & models | [Smithy documentation](https://smithy.io/2.0/index.html) |
| `smithy-build.json` / build & plugins | [Smithy — smithy-build.json](https://smithy.io/2.0/guides/smithy-build-json.html) |
| Converting Smithy to OpenAPI (plugin options, e.g. `tags`) | [Smithy — Converting to OpenAPI](https://smithy.io/2.0/guides/model-translations/converting-to-openapi.html) |
| Smithy CLI installation & releases | [smithy-lang/smithy releases](https://github.com/smithy-lang/smithy/releases) |

**This repo:** `smithy/smithy-build.json`, `smithy/model/*.smithy`, artifacts under `smithy/build/` (including OpenAPI).

---

## 2. OpenAPI

| Topic | Source |
|--------|--------|
| OpenAPI Specification | [OpenAPI Initiative / specification](https://spec.openapis.org/oas/latest.html) |
| Tag objects & operation grouping | [OpenAPI — Tag Object](https://spec.openapis.org/oas/latest.html#tag-object) |

**This repo:** `smithy/build/smithy/source/openapi/ApiService.openapi.json` (generated).

---

## 3. Code generation from OpenAPI

| Topic | Source |
|--------|--------|
| OpenAPI Generator (CLI, generators) | [OpenAPI Generator](https://openapi-generator.tech/) |
| `typescript-nestjs-server` generator | Listed under server generators in OpenAPI Generator docs / `list` CLI output |
| openapi-typescript (types from OpenAPI) | [openapi-ts / openapi-typescript](https://github.com/openapi-ts/openapi-typescript) |

**This repo:** `server/package.json` scripts `generate:stubs:nest`, `generate:types`; output in `server/src/generated/`.

---

## 4. NestJS (HTTP API server)

| Topic | Source |
|--------|--------|
| Providers & dependency injection | [NestJS — Providers](https://docs.nestjs.com/providers) |
| Modules | [NestJS — Modules](https://docs.nestjs.com/modules) |
| Exception filters & HTTP exceptions (`NotFoundException`, etc.) | [NestJS — Exception filters](https://docs.nestjs.com/exception-filters) |
| CLI / build | [NestJS — CLI](https://docs.nestjs.com/cli/overview) |

**This repo:** `server/src/main.ts`, `server/src/app.module.ts`, `server/src/prisma/`, `server/src/modules/`, generated `server/src/generated/nest/` (controllers + `ApiModule`).

---

## 5. Prisma (PostgreSQL ORM)

| Topic | Source |
|--------|--------|
| Schema reference (`datasource`, `generator`, models) | [Prisma — Schema reference](https://www.prisma.io/docs/orm/reference/prisma-schema-reference) |
| Prisma Client queries (`create`, `findUnique`, `update`, `delete`, `findMany`) | [Prisma — CRUD](https://www.prisma.io/docs/orm/prisma-client/queries/crud) |
| Pagination (`skip`, `take`) | [Prisma — Pagination](https://www.prisma.io/docs/orm/prisma-client/queries/pagination) |
| Type safety & advanced typing with the client | [Prisma — Type safety](https://www.prisma.io/docs/orm/prisma-client/type-safety) |
| Error reference (`P2025`, etc.) | [Prisma — Error reference](https://www.prisma.io/docs/orm/reference/error-reference) |
| Handling `PrismaClientKnownRequestError` | [Prisma — Handling exceptions and errors](https://www.prisma.io/docs/orm/prisma-client/debugging-and-troubleshooting/handling-exceptions-and-errors) |

**This repo:** `server/prisma/schema.prisma`, `server/src/prisma/prisma.service.ts`, `server/src/modules/user-profiles/user-profiles.service.ts`.

---

## 6. TypeScript & Node.js

| Topic | Source |
|--------|--------|
| Utility types (`Awaited`, `ReturnType`, etc.) | [TypeScript Handbook — Utility types](https://www.typescriptlang.org/docs/handbook/utility-types.html) |
| `reflect-metadata` (required by Nest decorators) | [reflect-metadata (package)](https://github.com/rbuckton/reflect-metadata) — [Nest fundamentals](https://docs.nestjs.com/fundamentals) |
| `Buffer` (e.g. `base64url` encoding) | [Node.js — Buffer](https://nodejs.org/api/buffer.html) |

---

## 7. Web platform (MDN)

| Topic | Source |
|--------|--------|
| `JSON.parse` / `JSON.stringify` | [MDN — JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON) |
| Nullish coalescing (`??`) | [MDN — Nullish coalescing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing) |

---

## 8. Docker & PostgreSQL

| Topic | Source |
|--------|--------|
| Docker Compose specification | [Compose file reference](https://docs.docker.com/compose/compose-file/) |
| Official PostgreSQL Docker image | [PostgreSQL image (Docker Hub)](https://hub.docker.com/_/postgres) |

**This repo:** `docker-compose.yml` at repository root.

