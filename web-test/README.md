# Fbook — UI de prueba de moderación IA

UI mínima **sin frameworks** (HTML + CSS + JS vanilla, sin build step, sin `npm install`) para probar
manualmente cómo el backend real desplegado en AWS modera posts y comentarios con el módulo de IA
(`fbook-translator` + `fbook-bullying-classifier`, ambos en SageMaker).

> **Pública en S3 (acceso libre, sin login de AWS):**
> **http://fbook-web-test-140858350333.s3-website-us-east-1.amazonaws.com**
> Bucket `fbook-web-test-140858350333` (us-east-1), static website hosting + bucket policy de lectura
> pública. Servido por HTTP (igual que el ALB del backend, sin problema de mixed-content). Ver
> "Actualizar el sitio en S3" más abajo para re-subir cambios.

Cada publicación/comentario se muestra con su badge de `moderationStatus` (**OK** / **FLAGGED** /
**UNCHECKED**), su `toxicityScore` y el `lang` detectado — justo lo que calcula
`services/publicacion/src/modules/moderation/moderation.service.ts` en el momento de crear el
contenido (no hay que refrescar ni esperar: la respuesta del `POST` ya trae el resultado).

## Cómo correrla

No requiere servidor ni instalación — es HTML estático. Dos formas:

**Opción A — abrir el archivo directamente:**
Doble click en `index.html` (o `Abrir con` tu navegador).

**Opción B — servidor estático simple (evita restricciones de algunos navegadores con `file://`):**
```bash
cd fbook-api/web-test
npx serve .
# o: python -m http.server 8080
```

El backend (`services/usuario`, `services/publicacion`) tiene CORS habilitado (`app.enableCors()`
en sus `main.ts`), así que funciona sin importar desde qué origen se sirva esta UI.

## Actualizar el sitio en S3

Subida manual (no está en CDK ni CI/CD — bucket y archivos creados/subidos a mano vía AWS CLI):

```bash
aws s3 cp index.html s3://fbook-web-test-140858350333/index.html --content-type text/html --profile default
aws s3 cp style.css  s3://fbook-web-test-140858350333/style.css  --content-type text/css --profile default
aws s3 cp app.js     s3://fbook-web-test-140858350333/app.js     --content-type application/javascript --profile default
aws s3 cp config.js  s3://fbook-web-test-140858350333/config.js  --content-type application/javascript --profile default
```

Para borrar todo (bucket + archivos, sin costo real de S3 pero por prolijidad):
```bash
aws s3 rm s3://fbook-web-test-140858350333 --recursive --profile default
aws s3api delete-bucket --bucket fbook-web-test-140858350333 --profile default
```

## Configuración

`config.js` ya apunta al stack real desplegado (ALB DNS + Cognito User Pool/Client). Si se
redespliega el stack de CDK y las URLs/IDs cambian, actualizar los 4 valores en `config.js`
(cada uno indica de qué output de CDK sale).

## Flujo de uso

1. **Registrarse** (tab "Registrarse"): crea el usuario en Cognito + DynamoDB. El `id` de Dynamo
   (distinto del `sub` de Cognito) queda guardado en `localStorage` de tu navegador, asociado al
   correo, para no tener que copiarlo a mano la próxima vez.
2. **Iniciar sesión**: llama directo a `InitiateAuth` de Cognito (`USER_PASSWORD_AUTH`, sin SDK,
   solo `fetch`) y guarda el `IdToken` en memoria (se pierde al recargar la página, a propósito —
   esto es una herramienta de prueba, no hay refresh-token flow).
   - Si iniciás sesión con un usuario que **no** registraste desde este navegador, no vamos a tener
     su `id` de Dynamo guardado — pegalo a mano en el campo "ID de usuario (Dynamo)" (te lo devuelve
     la respuesta de `POST /v1/usuarios`, o podés pedírselo a quien lo registró).
3. **Publicar**: escribí cualquier texto (benigno o tóxico, español o inglés) y mirá el badge que
   devuelve el `POST /v1/publicaciones` — pasa primero por `fbook-translator` (si es español) y
   luego por `fbook-bullying-classifier`.
4. **Comentar**: "Ver / agregar comentarios" en cualquier post del feed para expandir sus
   comentarios y agregar uno nuevo — mismo pipeline de moderación.

### Ejemplos para probar

| Texto | Esperado |
|---|---|
| `que tengan todos un excelente día` | `OK`, score bajo |
| `you are stupid, nobody likes you, just disappear` | `FLAGGED`, score alto |
| `eres una basura humana, todos te odian` | `FLAGGED` (se traduce ES→EN antes de clasificar) |

## Alcance / lo que NO hace esta UI (a propósito, para mantenerla simple)

- No maneja amistades ni reacciones (fuera del objetivo: probar moderación).
- No tiene refresh-token ni sesión persistente entre reloads.
- El feed (`GET /v1/publicaciones`) y los comentarios (`GET /v1/comentarios`) no tienen filtro por
  usuario/post en la API — se traen todos y se filtra/ordena en el cliente. Aceptable para probar
  con pocos datos; no pensado para un feed de producción.
- Sin build step ni dependencias — 4 archivos: `index.html`, `style.css`, `app.js`, `config.js`.

## Nota sobre CORS

`services/usuario` y `services/publicacion` llaman `app.enableCors()` (sin restricciones de origen)
específicamente para que esta UI pueda llamarlos desde cualquier origen (`file://`, `localhost`,
o un futuro hosting estático en S3/CloudFront). Si en el futuro se sirve esta UI sobre **HTTPS**
(ej. CloudFront), va a haber *mixed content* porque el ALB de `fbook-cdk` solo escucha HTTP — habría
que agregar HTTPS al ALB (dominio + certificado ACM) o servir esta UI también sobre HTTP.
