#!/bin/bash
set -e

DEPLOY=false
AWS_PROFILE="default"

for arg in "$@"; do
  case $arg in
    --deploy) DEPLOY=true ;;
    *) AWS_PROFILE="$arg" ;;
  esac
done

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
ECS_CLUSTER=${ECS_CLUSTER:-fbook-cluster}

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
echo "Las 3 imágenes fueron subidas a ECR con el perfil '$AWS_PROFILE'."

if [ "$DEPLOY" = true ]; then
  if [ -z "$ECS_CLUSTER" ]; then
    echo "Error: ECS_CLUSTER es obligatorio en .env para usar --deploy"
    exit 1
  fi
  echo ""
  echo "==> Forzando nuevo deployment en ECS (cluster: $ECS_CLUSTER)..."
  for SERVICE in "${SERVICES[@]}"; do
    echo "    → fbook-$SERVICE"
    aws ecs update-service \
      --cluster "$ECS_CLUSTER" \
      --service "fbook-$SERVICE" \
      --force-new-deployment \
      --profile "$AWS_PROFILE" \
      --output text \
      --query 'service.serviceName' > /dev/null
  done
  echo ""
  echo "Deployments iniciados. ECS levantará nuevas tasks con la imagen más reciente."
  echo "Monitorea en: https://console.aws.amazon.com/ecs/home?region=$AWS_REGION#/clusters/$ECS_CLUSTER/services"
fi
