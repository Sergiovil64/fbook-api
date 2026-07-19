# Contenedor real del traductor ES→EN (SageMaker BYOC).
# Base desde ECR Public para evitar el rate-limit de Docker Hub en CodeBuild
# (misma decisión que los Dockerfiles de los microservicios y los dummies).
FROM public.ecr.aws/docker/library/python:3.11-slim

WORKDIR /opt/program

# Dependencias del sistema para compilar fasttext:
#   gcc / g++    -> compilador C++ requerido por el paquete fasttext
#   python3-dev  -> cabeceras de Python para compilar extensiones C
#   curl         -> descarga del modelo fastText LID durante el build
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    python3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Paso 1: PyTorch CPU-only (~500 MB en vez de ~2 GB de la versión CUDA).
# --index-url (no --extra-index-url) para que pip busque SOLO en el índice CPU
# de PyTorch y no descargue accidentalmente la versión CUDA desde PyPI.
RUN pip install --no-cache-dir \
    --index-url https://download.pytorch.org/whl/cpu \
    torch==2.5.1+cpu

# Paso 2: resto de dependencias (fasttext, transformers, flask, gunicorn, etc.).
RUN pip install --no-cache-dir -r requirements.txt

# Paso 3: modelo fastText LID (lid.176.ftz, ~917 KB). Se descarga en build para que
# el contenedor arranque sin depender de internet.
RUN curl -L -o /opt/program/lid.176.ftz \
    https://dl.fbaipublicfiles.com/fasttext/supervised-models/lid.176.ftz

# Paso 4: pre-descarga del modelo Helsinki-NLP/opus-mt-es-en (~300 MB) a la caché
# para que el contenedor no necesite internet al arrancar.
RUN python -c "\
from transformers import MarianMTModel, MarianTokenizer; \
MarianTokenizer.from_pretrained('Helsinki-NLP/opus-mt-es-en', cache_dir='/opt/program/model_cache'); \
MarianMTModel.from_pretrained('Helsinki-NLP/opus-mt-es-en', cache_dir='/opt/program/model_cache'); \
print('Modelos descargados correctamente.')"

COPY models/ ./models/
COPY app.py .

EXPOSE 8080

# SageMaker invoca el contenedor con el argumento "serve".
# 1 worker: los modelos son pesados en RAM (MarianMT ~300 MB); el escalado horizontal
# lo maneja SageMaker con más instancias. --preload carga los pesos una sola vez antes
# de forkear. --timeout amplio para tolerar la latencia de traducción en CPU.
ENTRYPOINT ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--threads", "2", "--timeout", "120", "--preload", "app:app"]
