# FBook API — Guía de Setup y Deploy (Parte 1)

Arquitectura de microservicios con **Smithy** (contrato API), **NestJS** (servicios) y **DynamoDB Local** (base de datos).

---

## Tabla de contenidos

1. [Arquitectura](#arquitectura)
2. [Prerrequisitos](#prerrequisitos)
3. [Clonar el repositorio](#clonar-el-repositorio)
4. [Generar el contrato API con Smithy](#generar-el-contrato-api-con-smithy)
5. [Levantar con Docker (recomendado)](#levantar-con-docker-recomendado)
6. [Levantar localmente sin Docker](#levantar-localmente-sin-docker)
7. [Endpoints disponibles](#endpoints-disponibles)
8. [Guía para developers de servicios](#guía-para-developers-de-servicios)
9. [Flujo cuando se modifica un modelo Smithy](#flujo-cuando-se-modifica-un-modelo-smithy)

---

## Arquitectura

```
fbook_api/
├── smithy_api/              # Contrato API (fuente de verdad)
│   ├── model/               # Modelos .smithy por entidad
│   ├── generated/           # api.d.ts generado (compartido por todos los servicios)
│   └── smithy-build.json    # Config de generación OpenAPI
├── services/
│   ├── usuario/             # Microservicio Usuario     → puerto 3001
│   ├── amistad/             # Microservicio Amistad     → puerto 3002
│   └── publicacion/         # Microservicio Publicacion → puerto 3003
│                            #   (incluye Comentarios y Reacciones)
├── docker-compose.yml       # Producción
└── docker-compose.dev.yml   # Desarrollo (hot-reload)
```

**Puertos:**

| Servicio       | App  | DynamoDB Local |
|----------------|------|----------------|
| usuario        | 3001 | 8001           |
| amistad        | 3002 | 8002           |
| publicacion    | 3003 | 8003           |

---

## Prerrequisitos

### Para correr con Docker (cualquier OS)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo

> **WSL (Windows):** Habilitar integración en Docker Desktop → Settings → Resources → WSL Integration → activar tu distro → Apply & Restart.

### Para desarrollo local sin Docker (WSL / Linux / Mac)
- **Node.js v22+** — instalar con NVM (recomendado):

```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Instalar y usar Node 22
nvm install 22
nvm use 22

# Verificar
node --version   # v22.x.x
npm --version    # 10.x.x
```

- **Smithy CLI** — instalado en `/usr/local/bin/smithy`:

```bash
smithy --version   # verificar instalación
```

> **Nota WSL:** Siempre usar una terminal WSL nativa (Ubuntu), nunca CMD ni PowerShell de Windows. Si `node` no se encuentra, ejecutar `source ~/.bashrc` primero.

```bash
# Configuración npm recomendada (seguridad)
npm config set ignore-scripts true
```

---

## Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd fbook_api
```

---

## Generar el contrato API con Smithy

Este paso es **obligatorio** antes de levantar cualquier servicio. Genera el OpenAPI spec y los tipos TypeScript compartidos.

### Paso 1 — Smithy build (genera OpenAPI spec)

```bash
cd smithy_api
smithy build
```

Salida esperada:
```
SUCCESS: Validated 526 shapes
Completed projection source
Summary: Smithy built 1 projection(s), 4 plugin(s), and 11 artifacts
```

Genera: `smithy_api/build/smithy/source/openapi/ApiService.openapi.json`

### Paso 2 — Instalar dependencias de smithy_api

```bash
# Desde smithy_api/
npm install
```

### Paso 3 — Generar tipos TypeScript compartidos

```bash
# Desde smithy_api/
npm run generate
```

Genera: `smithy_api/generated/api.d.ts`

Todos los microservicios importan sus tipos desde este archivo usando el alias `@api`.

> **Atajo:** los pasos 1 y 3 juntos:
> ```bash
> npm run build:generate
> ```

---

## Levantar con Docker (recomendado)

Desde la raíz del proyecto (`fbook_api/`):

### Modo producción

Compila las imágenes y levanta todos los servicios + DynamoDB:

```bash
docker compose up --build -d
```

### Modo desarrollo (hot-reload)

Los cambios en `src/` de cada servicio se reflejan automáticamente sin reconstruir la imagen:

```bash
docker compose -f docker-compose.dev.yml up --build -d
```

### Ver logs

```bash
# Todos los servicios
docker compose logs -f

# Un servicio específico
docker compose logs -f service-usuario
```

### Detener

```bash
docker compose down
# o para dev:
docker compose -f docker-compose.dev.yml down
```

---

## Levantar localmente sin Docker

Requiere tener los servicios de DynamoDB corriendo (o usar las variables de entorno apuntando a una instancia existente).

### Instalar dependencias de cada servicio

```bash
cd services/usuario && npm install
cd ../amistad && npm install
cd ../publicacion && npm install
```

### Configurar variables de entorno

Copiar el `.env.example` de cada servicio:

```bash
cp services/usuario/.env.example services/usuario/.env
cp services/amistad/.env.example services/amistad/.env
cp services/publicacion/.env.example services/publicacion/.env
```

Contenido por defecto de cada `.env`:

```env
PORT=3000
DYNAMODB_ENDPOINT=http://localhost:800X   # 8001 / 8002 / 8003
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
```

### Levantar cada servicio (3 terminales)

```bash
# Terminal 1
cd services/usuario && PORT=3001 npm run start:dev

# Terminal 2
cd services/amistad && PORT=3002 npm run start:dev

# Terminal 3
cd services/publicacion && PORT=3003 npm run start:dev
```

---

## Endpoints disponibles

### service-usuario `http://localhost:3001`

| Método | Ruta                  | Descripción         |
|--------|-----------------------|---------------------|
| POST   | /v1/usuarios          | Crear usuario       |
| GET    | /v1/usuarios          | Listar usuarios     |
| GET    | /v1/usuarios/:id      | Obtener usuario     |
| PUT    | /v1/usuarios/:id      | Actualizar usuario  |
| DELETE | /v1/usuarios/:id      | Eliminar usuario    |

### service-amistad `http://localhost:3002`

| Método | Ruta                  | Descripción         |
|--------|-----------------------|---------------------|
| POST   | /v1/amistades         | Crear amistad       |
| GET    | /v1/amistades         | Listar amistades    |
| GET    | /v1/amistades/:id     | Obtener amistad     |
| PUT    | /v1/amistades/:id     | Actualizar amistad  |
| DELETE | /v1/amistades/:id     | Eliminar amistad    |

### service-publicacion `http://localhost:3003`

| Método | Ruta                  | Descripción            |
|--------|-----------------------|------------------------|
| POST   | /v1/publicaciones     | Crear publicación      |
| GET    | /v1/publicaciones     | Listar publicaciones   |
| GET    | /v1/publicaciones/:id | Obtener publicación    |
| PUT    | /v1/publicaciones/:id | Actualizar publicación |
| DELETE | /v1/publicaciones/:id | Eliminar publicación   |
| POST   | /v1/comentarios       | Crear comentario       |
| GET    | /v1/comentarios       | Listar comentarios     |
| GET    | /v1/comentarios/:id   | Obtener comentario     |
| PUT    | /v1/comentarios/:id   | Actualizar comentario  |
| DELETE | /v1/comentarios/:id   | Eliminar comentario    |
| POST   | /v1/reacciones        | Crear reacción         |
| GET    | /v1/reacciones        | Listar reacciones      |
| GET    | /v1/reacciones/:id    | Obtener reacción       |
| PUT    | /v1/reacciones/:id    | Actualizar reacción    |
| DELETE | /v1/reacciones/:id    | Eliminar reacción      |

### Prueba rápida con curl

```bash
# Listar usuarios
curl http://localhost:3001/v1/usuarios

# Crear usuario
curl -X POST http://localhost:3001/v1/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan","correo":"juan@test.com","password":"123"}'

# Listar publicaciones
curl http://localhost:3003/v1/publicaciones
```

---

## Guía para developers de servicios

### Estructura de un servicio

```
services/usuario/
├── src/
│   ├── main.ts                          # Entry point
│   ├── app.module.ts                    # Módulo raíz
│   ├── dynamodb/
│   │   └── dynamodb.module.ts           # Cliente DynamoDB (global)
│   └── modules/
│       └── usuarios/
│           ├── usuarios.module.ts
│           ├── usuarios.controller.ts   # Rutas HTTP
│           └── usuarios.service.ts      # Lógica de negocio
├── package.json
├── tsconfig.json                        # Incluye alias @api
├── Dockerfile
└── .env.example
```

### Usar los tipos generados por Smithy

Todos los tipos están disponibles en `smithy_api/generated/api.d.ts` a través del alias `@api`:

```typescript
import type { components } from '@api';

// Tipos de request
type CreateInput = components['schemas']['CreateUsuarioRequestContent'];
type UpdateInput = components['schemas']['UpdateUsuarioRequestContent'];

// Tipos de respuesta
type Usuario    = components['schemas']['Usuario'];
type ListOutput = components['schemas']['ListUsuariosResponseContent'];
```

Los schemas disponibles son:
- `Usuario`, `Amistad`, `Publicacion`, `Comentario`, `Reaccion`
- `Create*RequestContent`, `Update*RequestContent`
- `List*ResponseContent`

### Compilar un servicio

```bash
cd services/usuario
npm run build        # compila TypeScript → dist/
npm run start        # corre dist/main.js (producción)
npm run start:dev    # hot-reload con watch (desarrollo)
```

### El alias `@api` en tsconfig

Cada servicio tiene este path configurado en `tsconfig.json`:

```json
"paths": {
  "@api": ["../../smithy_api/generated/api"]
}
```

Apunta a `smithy_api/generated/api.d.ts` relativo a la raíz del servicio. En Docker, esta ruta se replica como `/fbook_api/smithy_api/generated/`.

---

## Flujo cuando se modifica un modelo Smithy

Si se agrega un campo, operación o entidad nueva en `smithy_api/model/`:

```bash
# 1. Desde smithy_api/
cd smithy_api

# 2. Regenerar OpenAPI spec + tipos TypeScript
npm run build:generate

# 3. Los servicios ya tienen acceso a los nuevos tipos via @api
#    Solo reconstruir el servicio afectado
cd ../services/usuario
npm run build

# Con Docker dev (hot-reload detecta el cambio automáticamente)
# Solo correr build:generate, el contenedor recarga solo
```

> **Regla:** nunca editar `smithy_api/generated/api.d.ts` a mano. Siempre regenerar desde los modelos `.smithy`.

---

## Comandos de referencia rápida

```bash
# Generar tipos desde Smithy
cd smithy_api && npm run build:generate

# Docker — producción
docker compose up --build -d
docker compose down
docker compose logs -f service-usuario

# Docker — desarrollo
docker compose -f docker-compose.dev.yml up --build -d
docker compose -f docker-compose.dev.yml down

# Build de un servicio
cd services/usuario && npm run build
```
