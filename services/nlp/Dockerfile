# ============================================================
# Dockerfile — Fbook NLP Service
# Imagen base: ECR Public (igual que el resto de servicios de Fbook)
# para evitar los rate limits de Docker Hub en CodeBuild/ECS.
# ============================================================

# --- Etapa base: Python 3.11 slim ---
FROM public.ecr.aws/docker/library/python:3.11-slim AS base

WORKDIR /app

# Dependencias del sistema necesarias para compilar fasttext:
#   gcc / g++      → compilador C++ requerido por el paquete fasttext
#   python3-dev    → cabeceras de Python requeridas para compilar extensiones C
#   curl           → para descargar el modelo fastText LID durante el build
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    python3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*


# --- Etapa de dependencias: instalar paquetes Python ---
FROM base AS deps

COPY requirements.txt .

# Paso 1: instalar PyTorch CPU-only (~500 MB en vez de ~2 GB de la versión CUDA).
# Se usa --index-url (no --extra-index-url) para que pip busque SOLO en el índice
# de CPU de PyTorch y no descargue accidentalmente la versión CUDA desde PyPI.
RUN pip install --no-cache-dir \
    --index-url https://download.pytorch.org/whl/cpu \
    torch==2.5.1+cpu

# Paso 2: instalar el resto de dependencias (fasttext, transformers, fastapi, etc.)
RUN pip install --no-cache-dir -r requirements.txt

# Paso 3: descargar el modelo fastText LID (lid.176.ftz, ~917 KB)
# Se hace aquí para que no ocurra en runtime y el contenedor arranque offline
RUN curl -L -o /app/lid.176.ftz \
    https://dl.fbaipublicfiles.com/fasttext/supervised-models/lid.176.ftz

# Paso 4: pre-descargar el modelo Helsinki-NLP/opus-mt-es-en (~300 MB)
# Se cachea en /app/model_cache para que el contenedor no necesite internet al arrancar
RUN python -c "\
from transformers import MarianMTModel, MarianTokenizer; \
MarianTokenizer.from_pretrained('Helsinki-NLP/opus-mt-es-en', cache_dir='/app/model_cache'); \
MarianMTModel.from_pretrained('Helsinki-NLP/opus-mt-es-en', cache_dir='/app/model_cache'); \
print('Modelos descargados correctamente.')"


# --- Etapa de producción ---
FROM deps AS production

COPY app/ ./app/

EXPOSE 8000

# 1 worker porque los modelos NLP son pesados en RAM.
# El escalado horizontal lo maneja ECS con múltiples tareas Fargate.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]


# --- Etapa de desarrollo (hot-reload para docker-compose.dev.yml) ---
FROM deps AS development

COPY app/ ./app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
