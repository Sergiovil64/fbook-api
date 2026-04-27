#!/bin/bash
set -e

AWS_PROFILE=${1:-default}

if [ ! -f .env ]; then
  echo "Error: no se encontró el archivo .env. Copia .env.example y llena los valores."
  exit 1
fi

source .env

if [ -z "$ECR_REGISTRY" ] || [ -z "$AWS_REGION" ]; then
  echo "Error: ECR_REGISTRY y AWS_REGION son obligatorios en el archivo .env"
  exit 1
fi

IMAGE_TAG=${IMAGE_TAG:-latest}

SERVICES=("usuario" "amistad" "publicacion")

echo "==> Usando perfil AWS: $AWS_PROFILE"

echo "==> Login a ECR..."
aws ecr get-login-password --region "$AWS_REGION" --profile "$AWS_PROFILE" \
  | docker login --username AWS --password-stdin "$ECR_REGISTRY"

for SERVICE in "${SERVICES[@]}"; do
  echo ""
  echo "==> Build: fbook-service-$SERVICE"
  docker build \
    --file "services/$SERVICE/Dockerfile" \
    --target production \
    --tag "fbook-service-$SERVICE:$IMAGE_TAG" \
    .

  echo "==> Tag: $ECR_REGISTRY/fbook-service-$SERVICE:$IMAGE_TAG"
  docker tag \
    "fbook-service-$SERVICE:$IMAGE_TAG" \
    "$ECR_REGISTRY/fbook-service-$SERVICE:$IMAGE_TAG"

  echo "==> Push: $ECR_REGISTRY/fbook-service-$SERVICE:$IMAGE_TAG"
  docker push "$ECR_REGISTRY/fbook-service-$SERVICE:$IMAGE_TAG"
done

echo ""
echo "Listo. Las 3 imágenes fueron subidas a ECR con el perfil '$AWS_PROFILE'."
