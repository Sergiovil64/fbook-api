# Sources and references (fbook-api)

## 1. Smithy (model, validation, build)

| Topic | Source |
|--------|--------|
| Smithy language & models | [Smithy documentation](https://smithy.io/2.0/index.html) |
| `smithy-build.json` / build & plugins | [Smithy — smithy-build.json](https://smithy.io/2.0/guides/smithy-build-json.html) |
| Converting Smithy to OpenAPI | [Smithy — Converting to OpenAPI](https://smithy.io/2.0/guides/model-translations/converting-to-openapi.html) |
| Smithy CLI installation & releases | [smithy-lang/smithy releases](https://github.com/smithy-lang/smithy/releases) |

**This repo:** `smithy_api/smithy-build.json`, `smithy_api/model/*.smithy`, artifacts under `smithy_api/build/`.

---

## 2. OpenAPI

| Topic | Source |
|--------|--------|
| OpenAPI Specification | [OpenAPI Initiative / specification](https://spec.openapis.org/oas/latest.html) |
| openapi-typescript (types from OpenAPI) | [openapi-ts / openapi-typescript](https://github.com/openapi-ts/openapi-typescript) |

**This repo:** `smithy_api/build/smithy/source/openapi/ApiService.openapi.json` (generated), `smithy_api/generated/api.d.ts`.

---

## 3. NestJS (microservices)

| Topic | Source |
|--------|--------|
| Providers & dependency injection | [NestJS — Providers](https://docs.nestjs.com/providers) |
| Modules | [NestJS — Modules](https://docs.nestjs.com/modules) |
| Exception filters & HTTP exceptions | [NestJS — Exception filters](https://docs.nestjs.com/exception-filters) |
| CLI / build | [NestJS — CLI](https://docs.nestjs.com/cli/overview) |

**This repo:** `services/usuario/`, `services/amistad/`, `services/publicacion/`.

---

## 4. AWS DynamoDB

| Topic | Source |
|--------|--------|
| DynamoDB Client (AWS SDK v3) | [AWS SDK v3 — DynamoDBClient](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/dynamodb/) |
| DynamoDB DocumentClient | [AWS SDK v3 — DynamoDBDocumentClient](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/) |
| DynamoDB Local (desarrollo) | [DynamoDB Local — Docker Hub](https://hub.docker.com/r/amazon/dynamodb-local) |

**This repo:** `services/*/src/dynamodb/dynamodb.module.ts`.

---

## 5. Amazon ECR & Docker

| Topic | Source |
|--------|--------|
| Docker Compose specification | [Compose file reference](https://docs.docker.com/compose/compose-file/) |
| Amazon ECR — push images | [ECR — Pushing a Docker image](https://docs.aws.amazon.com/AmazonECR/latest/userguide/docker-push-ecr-image.html) |
| Amazon ECR — authenticate | [ECR — Private registry authentication](https://docs.aws.amazon.com/AmazonECR/latest/userguide/registry_auth.html) |
| Multi-stage Docker builds | [Docker — Multi-stage builds](https://docs.docker.com/build/building/multi-stage/) |

**This repo:** `docker-compose.yml`, `docker-compose.dev.yml`, `services/*/Dockerfile`, `push-to-ecr.sh`.

---

## 6. AWS CDK (infraestructura)

| Topic | Source |
|--------|--------|
| AWS CDK — Getting started | [AWS CDK — Getting started](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html) |
| EC2 instances | [CDK — aws-ec2](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2-readme.html) |
| Application Load Balancer | [CDK — aws-elasticloadbalancingv2](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_elasticloadbalancingv2-readme.html) |
| IAM roles & policies | [CDK — aws-iam](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam-readme.html) |

**Repo de infraestructura:** [fbook-cdk](https://github.com/Sergiovil64/fbook-cdk.git)

---

## 7. TypeScript & Node.js

| Topic | Source |
|--------|--------|
| Utility types (`Awaited`, `ReturnType`, etc.) | [TypeScript Handbook — Utility types](https://www.typescriptlang.org/docs/handbook/utility-types.html) |
| Nullish coalescing (`??`) | [MDN — Nullish coalescing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing) |
