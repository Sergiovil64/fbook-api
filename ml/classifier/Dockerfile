# Contenedor real del clasificador de cyberbullying (SageMaker BYOC).
# Base desde ECR Public para evitar el rate-limit de Docker Hub en CodeBuild.
FROM public.ecr.aws/docker/library/python:3.11-slim

WORKDIR /opt/program

COPY requirements.txt .

# Paso 1: PyTorch CPU-only (~500 MB en vez de ~2 GB de la versión CUDA).
RUN pip install --no-cache-dir \
    --index-url https://download.pytorch.org/whl/cpu \
    torch==2.5.1+cpu

# Paso 2: resto de dependencias (transformers, flask, gunicorn, etc.).
RUN pip install --no-cache-dir -r requirements.txt

# Paso 3: modelo entrenado (DistilBERT binario) horneado en la imagen.
# El contenido de model/ lo aporta el equipo de ML (ver README.md).
COPY model/ ./model/
COPY app.py .

EXPOSE 8080

# SageMaker invoca el contenedor con el argumento "serve".
# 1 worker: DistilBERT es pesado en RAM; el escalado horizontal lo maneja SageMaker.
ENTRYPOINT ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--threads", "2", "--timeout", "120", "--preload", "app:app"]
