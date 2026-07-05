# Contenedor dummy del clasificador de cyberbullying (placeholder SageMaker BYOC).
# Base desde ECR Public para evitar el rate-limit de Docker Hub en CodeBuild
# (misma decisión que los Dockerfiles de los microservicios).
FROM public.ecr.aws/docker/library/python:3.11-slim

WORKDIR /opt/program

RUN pip install --no-cache-dir flask==3.0.3 gunicorn==22.0.0

COPY app.py .

EXPOSE 8080

# SageMaker invoca el contenedor con el argumento "serve".
ENTRYPOINT ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "app:app"]
