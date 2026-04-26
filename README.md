# fbook-api — Instructions

Official documentation references for the whole stack (Smithy, OpenAPI, NestJS, Prisma, Docker, etc.): **[SOURCES.md](./SOURCES.md)**.

---

## Prerequisites

| Tool | Version / notes |
|------|------------------|
| **Node.js** | 18 or newer (`node --version`) |
| **npm** | Comes with Node (`npm --version`) |
| **Docker Desktop** (or Docker Engine + Compose) | For PostgreSQL (`docker --version`, `docker compose version`) |
| **JDK** | 11 or newer — required by the **Smithy CLI** (`java --version`) |

Optional but useful: **Git**, **curl** or **Postman** to call the API.

---

## 1. Clone the repository

```bash
git clone <repository-url>
cd fbook-api
```

---

## 2. Install Smithy CLI

Smithy validates the API model and produces an **OpenAPI** spec used for codegen.

### Windows

The repository includes a Windows distribution of the Smithy CLI as a zip at the **repository root**:

- **`smithy-cli-windows-x64.zip`**

**Recommended: use `install.bat`**

1. Extract the zip to a temporary folder (e.g. `Downloads\smithy-cli` or `C:\temp\smithy-cli`).
2. In that folder, run **`install.bat`** (double-click or run from PowerShell/CMD).
3. Follow the installer: it copies Smithy to a target directory (for example under `Program Files` or a path you choose) and can add the CLI to your **PATH** for all users or the current user, depending on the options you pick.
4. Close and **open a new terminal**, then verify:

   ```powershell
   smithy --version
   ```

If `smithy` is still not found, either sign out and back in, or add the install location’s **`bin`** folder to your user **PATH** manually in *Environment Variables*.

**Alternative (manual):** extract the zip, locate **`smithy.bat`** (often under a `bin` directory), and add that directory to **PATH**, or call `smithy.bat` with its full path.

If you prefer not to use the bundled zip, download the latest Windows build from  
[Smithy releases](https://github.com/smithy-lang/smithy/releases) — the same **`install.bat`** workflow usually applies after extraction.

### macOS (Homebrew)

```bash
brew install smithy-lang/tap/smithy-cli
smithy --version
```

### Linux

Use the distribution for your platform from the [Smithy releases](https://github.com/smithy-lang/smithy/releases) page and add it to your `PATH`.

---

## 3. Build the Smithy model → OpenAPI

All commands below assume your current directory is **`smithy_api/`** (inside the repo).

```bash
cd smithy_api
npm install
smithy build
```

Expected: build succeeds and artifacts appear under **`smithy_api/build/smithy/source/`**, including:

- **`openapi/ApiService.openapi.json`** — OpenAPI contract

> **Important:** Run `smithy build` from the **`smithy_api/`** directory (where `smithy-build.json` lives). If you change `.smithy` models, run `smithy build` again before regenerating server artifacts.

---

## 4. Generate API documentation

Requires a successful **`smithy build`** (step 3).

From **`smithy_api/`**:

```bash
npm run docs
```

This generates **`smithy_api/docs/index.html`** — an interactive HTML page with all endpoints, request/response schemas and descriptions. Open it directly in any browser (no server needed).

To regenerate after model changes:

```bash
cd smithy_api
smithy build
npm run docs
```

---

## 5. Start PostgreSQL with Docker

From the **repository root** (`fbook-api/`):

```bash
docker compose up -d
```

This starts **PostgreSQL 16** with:

- User: `dev`  
- Password: `dev`  
- Database: `fbook`  
- Port: **`5432`** on localhost  

To stop (container removed; data volume kept unless you remove it):

```bash
docker compose down
```

---

## 6. Backend (NestJS + Prisma)

### 5.1 Install dependencies

```bash
cd server
npm install
```

### 5.2 Environment variables

Copy the example env file and adjust if needed:

```bash
cp .env.example .env
```

On Windows PowerShell, you can use: `Copy-Item .env.example .env`

The default `DATABASE_URL` matches `docker-compose.yml`:

```text
postgresql://dev:dev@localhost:5432/fbook?schema=public
```

### 5.3 Prisma: generate client and sync schema

With Postgres running (`docker compose up -d`):

```bash
npm run db:generate
npm run db:push
```

Use `npm run db:migrate` instead of `db:push` if your team uses formal migrations.

### 5.4 Regenerate TypeScript types and Nest stubs from OpenAPI

Requires a successful **`smithy build`** (step 3) so `ApiService.openapi.json` exists:

```bash
npm run generate:all
```

This creates:

- **`src/generated/api.d.ts`** — types from OpenAPI (openapi-typescript)  
- **`src/generated/nest/`** — generated Nest server stubs (OpenAPI Generator). This folder is gitignored

### 5.5 Build and run the API

```bash
npm run build
npm run start:dev
```

The API listens on **`http://localhost:3000`** by default (`PORT` in `.env` overrides it).

## 7. Microservices (NestJS — services/)

The `services/` folder contains three independent NestJS microservices that run alongside the main server:

| Service | Directory | Default port |
|---|---|---|
| Usuarios | `services/usuario/` | 3001 |
| Amistades | `services/amistad/` | 3002 |
| Publicaciones / Comentarios / Reacciones | `services/publicacion/` | 3003 |

Each service has its own dependencies. To install and run one:

```bash
cd services/usuario
npm install
npm run start:dev
```

Repeat for `services/amistad` and `services/publicacion`.

---

## 8. Day-to-day workflow (after the model changes)

1. Edit files under **`smithy_api/model/`**.
2. `cd smithy_api && smithy build`
3. `npm run docs` — regenera la documentación
4. `cd ../server && npm run generate:all`
5. Implement business logic only under **`server/src/modules/`** (do not rely on editing generated files under `src/generated/nest/` for long-term changes).
6. `npm run start:dev`

---

## 9. Troubleshooting

| Issue | What to try |
|-------|-------------|
| `smithy` not found (Windows) | Ensure the extracted CLI folder is on `PATH` or use the full path to `smithy.bat`. |
| Smithy / OpenAPI build fails | Run commands from **`smithy_api/`**; install JDK 11+. |
| `generate:stubs:nest` fails | Run **`smithy build`** first; check that `../smithy_api/build/smithy/source/openapi/ApiService.openapi.json` exists. |
| `docs/index.html` no se actualiza | Correr `smithy build` primero y luego `npm run docs` desde `smithy_api/`. |
| Prisma cannot connect | Run `docker compose up -d`; confirm `.env` `DATABASE_URL` matches Docker credentials. |
| Empty or missing `src/generated/nest` | Run `npm run generate:all` after clone and after each contract change. |
| Port 5432 already in use | Stop the other Postgres instance or change the host port in `docker-compose.yml` and update `DATABASE_URL`. |

---

## 10. Repository layout (reference)

```text
fbook-api/
├── smithy-cli-windows-x64.zip     # Windows Smithy CLI bundle (optional local install)
├── docker-compose.yml             # PostgreSQL for local dev
├── smithy_api/
│   ├── smithy-build.json
│   ├── model/                     # Smithy API definitions (.smithy)
│   ├── docs/
│   │   └── index.html             # Documentación HTML generada (Redoc)
│   └── generated/
│       └── api.d.ts               # TypeScript types generados desde OpenAPI
├── server/
│   ├── prisma/schema.prisma
│   ├── .env.example
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── generated/             # openapi-typescript + generated Nest (regenerated)
│       ├── modules/               # Your implementations (safe to edit)
│       └── prisma/                # PrismaModule / PrismaService
├── services/
│   ├── usuario/                   # Microservicio de usuarios (NestJS)
│   ├── amistad/                   # Microservicio de amistades (NestJS)
│   └── publicacion/               # Microservicio de publicaciones, comentarios y reacciones (NestJS)
└── README.md                      # This file
```
