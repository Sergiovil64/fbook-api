# FBook API — Guía de Setup y Deploy

Arquitectura de microservicios con **Smithy** (contrato API), **NestJS** (servicios) y **DynamoDB** (base de datos).

---

## Tabla de contenidos

**Producción**
1. [Arquitectura](#arquitectura)
2. [Moderación de contenido con IA](#moderación-de-contenido-con-ia)
3. [Prerrequisitos producción](#prerrequisitos-producción)
4. [Clonar el repositorio](#clonar-el-repositorio)
5. [Releases automatizados (CI/CD)](#releases-automatizados-cicd)
6. [Deploy manual (fallback)](#subir-imágenes-a-amazon-ecr)
7. [Autenticación con Cognito](#autenticación-con-cognito)

**Desarrollo**

8. [Prerrequisitos desarrollo](#prerrequisitos-desarrollo)
9. [Generar el contrato API con Smithy](#generar-el-contrato-api-con-smithy)
10. [Documentación de endpoints](#documentación-de-endpoints)
11. [Guía para developers de servicios](#guía-para-developers-de-servicios)
12. [Flujo cuando se modifica un modelo Smithy](#flujo-cuando-se-modifica-un-modelo-smithy)
13. [Levantar localmente sin Docker](#levantar-localmente-sin-docker)
14. [Levantar con Docker desarrollo (hot-reload)](#levantar-con-docker-desarrollo-hot-reload)

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
│                            #   (incluye Comentarios, Reacciones y moderación IA)
│                            #   src/modules/moderation/  → cliente de los endpoints SageMaker
├── ml/                      # Módulo IA — detección de cyberbullying (ver sección dedicada abajo)
│   ├── CONTRACT.md          # Contrato I/O de los 2 endpoints SageMaker (fuente de verdad)
│   ├── translator/          # Contenedor BYOC: fastText LID + MarianMT ES→EN
│   ├── classifier/          # Contenedor BYOC: DistilBERT binario (cyberbullying)
│   └── training/            # Notebook + dataset de entrenamiento del clasificador
└── docker-compose.dev.yml   # Desarrollo (hot-reload + DynamoDB Local)
```

**Puertos:**

| Servicio       | App  | DynamoDB Local (solo dev) |
|----------------|------|---------------------------|
| usuario        | 3001 | 8001                      |
| amistad        | 3002 | 8002                      |
| publicacion    | 3003 | 8003                      |

**Variables de entorno:**
- **Desarrollo:** todas las variables las provee `docker-compose.dev.yml` — no se necesita ningún `.env` por servicio.
- **Producción:** ECS las inyecta desde el Task Definition configurado por CDK.

---

## Moderación de contenido con IA

> **Estado: desplegado y verificado end-to-end en AWS real (2026-07-19).** Ver
> `../decisions-ai-moderation.md` para el historial completo de decisiones, bugs encontrados/corregidos
> y la tabla de resultados de la verificación.

Cada post y comentario pasa por un pipeline de detección de cyberbullying **antes** de guardarse,
orquestado por `services/publicacion/src/modules/moderation/moderation.service.ts`:

```
texto (ES/EN)
   │
   ▼
fbook-translator          (SageMaker — fastText LID + MarianMT ES→EN)
   │  { text: EN, srcLang }
   ▼
fbook-bullying-classifier (SageMaker — DistilBERT binario)
   │  { label: "bullying"|"ok", score }
   ▼
moderationStatus = FLAGGED | OK   ·   toxicityScore = score   ·   lang = srcLang
```

- **Contrato fuente de verdad:** `ml/CONTRACT.md` — define el JSON in/out de ambos endpoints. Si se
  reemplaza un modelo, mientras respete el contrato, **el backend no cambia**.
- **Fail-open:** cualquier error, timeout (`MODERATION_TIMEOUT_MS`, default 4000ms) o
  `MODERATION_ENABLED=false` guarda el contenido igual con `moderationStatus='UNCHECKED'` — nunca
  bloquea al usuario por una falla de IA.
- **Ambos modelos son reales**, no dummies: el traductor usa fastText (detección de idioma) +
  Helsinki-NLP/opus-mt-es-en (MarianMT) para ES→EN; el clasificador es un DistilBERT binario
  fine-tuneado por el equipo en `ml/training/train_classifier.ipynb` (Google Colab GPU).
- **Infraestructura gestionada por CDK** (`fbook-cdk`, stack `FbookAiModerationStack`): construye y
  publica ambas imágenes Docker (`DockerImageAsset`, sin push manual) y crea los 2 endpoints
  SageMaker. Solo se despliega con `--context deployAi=true` porque son endpoints siempre activos
  (~$50+/mes cada uno).
- **Detalle completo, diseño y guía de deploy:** ver `ml/README.md` (este repo) y
  `../fbook-cdk/ARCHITECTURE.md → §11 FbookAiModerationStack` (repo `fbook-cdk`).
- **UI de prueba manual:** `web-test/` — HTML/CSS/JS sin frameworks para registrar/loguear un
  usuario real (Cognito), publicar posts/comentarios contra el backend real en AWS y ver el
  resultado de la moderación en vivo. Pública en S3:
  **http://fbook-web-test-140858350333.s3-website-us-east-1.amazonaws.com** — ver `web-test/README.md`.

---

# Producción

## Prerrequisitos producción

- **Docker** instalado y corriendo
- **AWS CLI v2** instalado:

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
aws --version
```

- **Credenciales IAM** con permisos de ECR y ECS. Configurar un perfil con nombre para no pisar otras cuentas:

```bash
aws configure --profile fbook
# Ingresar cuando se solicite:
#   AWS Access Key ID:     AKIA...
#   AWS Secret Access Key: <secret>
#   Default region name:   us-east-1
#   Default output format: json
```

> Las credenciales se obtienen en la consola de AWS:
> **IAM → Users → tu usuario → Security credentials → Access keys → Create access key**

---

## Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd fbook_api
```

---

## Releases automatizados (CI/CD)

El método **recomendado** para hacer un release a producción es por tag git. La infraestructura CDK provisiona 4 pipelines en AWS CodePipeline:

| Pipeline                      | Trigger                                                     | Etapas                            |
| ----------------------------- | ----------------------------------------------------------- | --------------------------------- |
| `fbook-pipeline-ci`           | Push a `main` + PR (open/updated) contra `main`             | Source → Build (type-check)       |
| `fbook-pipeline-usuario`      | Push de tag `usuario-v*`                                    | Source → Build → Deploy ECS       |
| `fbook-pipeline-amistad`      | Push de tag `amistad-v*`                                    | Source → Build → Deploy ECS       |
| `fbook-pipeline-publicacion`  | Push de tag `publicacion-v*`                                | Source → Build → Deploy ECS       |

### CI — corre antes de mergear

Cada PR contra `main` (y cada push a `main`) dispara `fbook-pipeline-ci`, que corre `npm ci && npm run build` para los 3 microservicios. Si el type-check falla, la ejecución del pipeline falla y queda como status check del PR.

No se necesita acción manual — el trigger nativo de CodePipeline V2 (filtro por branch + PR events) lo dispara solo.

### CD — release por tag SemVer

Convención de tags: **`<servicio>-vMAJOR.MINOR.PATCH`** (ejemplo `usuario-v1.2.0`).

| Bump  | Cuándo                                          |
| ----- | ----------------------------------------------- |
| MAJOR | Cambios incompatibles en el contrato API        |
| MINOR | Nuevas funcionalidades retrocompatibles         |
| PATCH | Bugfixes retrocompatibles                       |

**Cómo disparar un release:**

```bash
# Desde main, después de mergear los cambios
git tag usuario-v1.2.0
git push origin usuario-v1.2.0
```

Solo `fbook-pipeline-usuario` se dispara — los otros dos pipelines de CD ignoran este tag. El pipeline tarda ~5–10 min:
1. **Source** — clona `fbook-api` desde GitHub via CodeStar Connection.
2. **Build** — `docker build --target production` con el tag de versión, push de 4 tags a ECR (`X.Y.Z`, `X.Y`, `X`, `latest`).
3. **Deploy** — `aws ecs update-service --force-new-deployment` + polling del rolloutState (60×30s).

**Múltiples servicios en el mismo commit** está soportado:

```bash
git tag usuario-v1.2.0 amistad-v1.0.5 publicacion-v2.0.0
git push origin --tags
```

Los 3 pipelines disparan en paralelo. Cada buildspec usa `git tag --points-at HEAD | grep "^${SERVICE}-v"` para encontrar su tag.

### Monitoreo del pipeline

```
https://console.aws.amazon.com/codesuite/codepipeline/pipelines/fbook-pipeline-<servicio>/view?region=us-east-1
```

Reemplazar `<servicio>` por `usuario`, `amistad`, `publicacion` o `ci`.

### Validación post-release

```powershell
# 4 tags publicadas en ECR para el último release
aws ecr describe-images --repository-name fbook-service-usuario `
  --query 'imageDetails[].imageTags' --output text

# rolloutState del PRIMARY deployment
aws ecs describe-services --cluster fbook-cluster --services fbook-service-usuario `
  --query 'services[0].deployments[?status==`PRIMARY`].rolloutState' --output text
# COMPLETED

# Métricas EMF emitidas por el container
aws cloudwatch list-metrics --namespace Fbook/Usuario `
  --query 'Metrics[].MetricName' --output text
# RequestCount RequestLatencyMs ErrorCount
```

Las métricas EMF tardan 1–2 min en aparecer en CloudWatch tras el primer request post-release.

---

## Subir imágenes a Amazon ECR

> **Este flujo es manual y se usa como fallback** (debugging del pipeline, primer bootstrap, ambiente sin CodeStar Connection). El flujo recomendado es el [release por tag](#releases-automatizados-cicd) descrito arriba.

### Paso 1 — Desplegar infraestructura con CDK

Antes de subir cualquier imagen el CDK debe estar desplegado. Crea los repositorios ECR, el cluster ECS Fargate, ALB, Cloud Map, IAM roles y tablas DynamoDB:

```
https://github.com/Sergiovil64/fbook-cdk.git
```

Seguir las instrucciones de ese repo. Al finalizar, el CDK imprime en consola los outputs necesarios para el siguiente paso.

### Paso 2 — Obtener la URL del registry

```bash
echo "$(aws sts get-caller-identity --profile fbook --query Account --output text).dkr.ecr.us-east-1.amazonaws.com"
```

Copiá el valor que imprime (ejemplo: `123456789012.dkr.ecr.us-east-1.amazonaws.com`). Se usará en el siguiente paso.

### Paso 3 — Configurar el archivo .env

Copiar el ejemplo y completar con los valores obtenidos:

```bash
cp .env.example .env
```

Editar `.env`:

```env
ECR_REGISTRY=123456789012.dkr.ecr.us-east-1.amazonaws.com  # output del CDK
AWS_REGION=us-east-1
IMAGE_TAG=latest
ECS_CLUSTER=fbook-cluster                                  # confirmar con el equipo CDK si difiere
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX                  # output del CDK (FbookUserPoolId)
COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX               # output del CDK (FbookUserPoolClientId)
```

### Paso 4 — Generar el contrato API con Smithy

Asegurarse de que los tipos TypeScript estén actualizados antes de construir las imágenes:

```bash
cd smithy_api
npm install
smithy build
npm run generate
cd ..
```

> Si ya estaban generados y no hubo cambios en el modelo, este paso es rápido. Mejor correrlo de más que subir una imagen desactualizada.

### Paso 5 — Ejecutar el script de push

Desde la raíz del proyecto:

```bash
./push-to-ecr.sh fbook --deploy
```

El script realiza automáticamente:
1. Login a ECR con el perfil indicado
2. Build de las 3 imágenes en modo `production`
3. Tag de cada imagen con la URL del registry
4. Push de las 3 imágenes a ECR
5. `aws ecs update-service --force-new-deployment` en los 3 servicios

### Paso 6 — Verificar el deploy

```bash
aws ecs describe-services \
  --cluster fbook-cluster \
  --services fbook-usuario fbook-amistad fbook-publicacion \
  --profile fbook \
  --query 'services[*].{name:serviceName,running:runningCount,desired:desiredCount,status:status}'
```

O directamente en la consola de AWS: **ECS → Clusters → fbook-cluster → Services**.

**Actualizaciones futuras** — cuando se suban nuevos cambios:

```bash
./push-to-ecr.sh fbook --deploy
```

ECS descarga la imagen más reciente y reemplaza los contenedores sin downtime.

---

## Autenticación con Cognito

Los endpoints están protegidos con JWT emitidos por Amazon Cognito. El flujo es:

### 1 — Registrar un usuario

```
POST /v1/usuarios
Content-Type: application/json

{
  "nombre": "Tu Nombre",
  "correo": "tucorreo@ejemplo.com",
  "password": "Password123!"
}
```

Esto crea el usuario en DynamoDB **y** en Cognito (contraseña permanente, email verificado automáticamente).

### 2 — Obtener el token JWT

Llamar directamente al endpoint de Cognito:

```
POST https://cognito-idp.us-east-1.amazonaws.com/
Content-Type: application/x-amz-json-1.1
X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth

{
  "AuthFlow": "USER_PASSWORD_AUTH",
  "ClientId": "<COGNITO_CLIENT_ID>",
  "AuthParameters": {
    "USERNAME": "tucorreo@ejemplo.com",
    "PASSWORD": "Password123!"
  }
}
```

La respuesta incluye `IdToken`, `AccessToken` y `RefreshToken`.

### 3 — Usar el token en requests protegidos

Agregar los siguientes headers en todos los requests a endpoints protegidos:

```
Authorization: Bearer <IdToken>
Content-Type: application/json
```

**Endpoints públicos** (no requieren token):
- `POST /v1/usuarios` — registro de usuario

**Endpoints protegidos** (requieren token):
- Todos los demás (`GET`, `PUT`, `DELETE` en usuarios, publicaciones, comentarios, reacciones, amistades)

---

# Desarrollo

## Prerrequisitos desarrollo

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo

> **WSL (Windows):** Habilitar integración en Docker Desktop → Settings → Resources → WSL Integration → activar tu distro → Apply & Restart.

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

- **Smithy CLI** instalado:

```bash
smithy --version   # verificar instalación
```

> **Nota WSL:** Siempre usar una terminal WSL nativa (Ubuntu), nunca CMD ni PowerShell de Windows. Si `node` no se encuentra, ejecutar `source ~/.bashrc` primero.

---

## Generar el contrato API con Smithy

Este paso es **obligatorio** antes de levantar cualquier servicio. Genera el OpenAPI spec y los tipos TypeScript compartidos.

### Paso 1 — Smithy build

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

> **Atajo:** los pasos 1 y 3 juntos:
> ```bash
> npm run build:generate
> ```

---

## Documentación de endpoints

La documentación completa e interactiva de todos los endpoints (rutas, parámetros, request/response schemas) se encuentra en:

```
smithy_api/docs/index.html
```

Abrir directamente en cualquier navegador, no requiere servidor. Para regenerarla después de cambios en el modelo:

```bash
cd smithy_api
smithy build
npm run docs
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
└── Dockerfile
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

## Levantar localmente sin Docker

Requiere haber generado los tipos con Smithy (ver sección anterior) y tener una instancia de DynamoDB Local corriendo por servicio.

### Instalar dependencias de cada servicio

```bash
cd services/usuario && npm install
cd ../amistad && npm install
cd ../publicacion && npm install
```

### Configurar variables de entorno

Cada servicio lee sus variables desde `process.env`. Sin Docker, setearlas antes de arrancar cada proceso. Referencia de variables necesarias por servicio:

**usuario:**
```bash
export PORT=3001
export DYNAMODB_ENDPOINT=http://localhost:8001
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=local
export AWS_SECRET_ACCESS_KEY=local
export TABLE_NAME=Usuarios
export COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX   # solo necesario si se prueba auth localmente
```

**amistad:**
```bash
export PORT=3002
export DYNAMODB_ENDPOINT=http://localhost:8002
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=local
export AWS_SECRET_ACCESS_KEY=local
export TABLE_NAME=Amistades
export USUARIO_SERVICE_URL=http://localhost:3001
export COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX   # solo necesario si se prueba auth localmente
```

**publicacion:**
```bash
export PORT=3003
export DYNAMODB_ENDPOINT=http://localhost:8003
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=local
export AWS_SECRET_ACCESS_KEY=local
export TABLE_NAME=Publicaciones
export TABLE_COMENTARIOS=Comentarios
export TABLE_REACCIONES=Reacciones
export USUARIO_SERVICE_URL=http://localhost:3001
export PUBLICACION_SERVICE_URL=http://localhost:3003
export COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX   # solo necesario si se prueba auth localmente
```

> El flujo recomendado es usar Docker (sección siguiente) — evita configurar DynamoDB Local y variables manualmente.

### Levantar cada servicio (3 terminales)

```bash
# Terminal 1
cd services/usuario && npm run start:dev

# Terminal 2
cd services/amistad && npm run start:dev

# Terminal 3
cd services/publicacion && npm run start:dev
```

---

## Levantar con Docker desarrollo (hot-reload)

Desde la raíz del proyecto (`fbook_api/`):

```bash
docker compose -f docker-compose.dev.yml up --build -d
```

Los cambios en `src/` de cada servicio se reflejan automáticamente sin reconstruir la imagen. No se necesita configurar ningún `.env` — `docker-compose.dev.yml` provee todas las variables.

### Verificar que los servicios están corriendo

```bash
curl http://localhost:3001/health   # {"status":"ok"}
curl http://localhost:3002/health   # {"status":"ok"}
curl http://localhost:3003/health   # {"status":"ok"}
```

### Ver logs

```bash
# Todos los servicios
docker compose -f docker-compose.dev.yml logs -f

# Un servicio específico
docker compose -f docker-compose.dev.yml logs -f service-usuario
```

### Detener

```bash
docker compose -f docker-compose.dev.yml down
```
