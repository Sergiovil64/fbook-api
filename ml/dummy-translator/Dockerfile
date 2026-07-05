# Contenedor dummy del traductor ES→EN (placeholder SageMaker BYOC).
FROM public.ecr.aws/docker/library/python:3.11-slim

WORKDIR /opt/program

RUN pip install --no-cache-dir flask==3.0.3 gunicorn==22.0.0

COPY app.py .

EXPOSE 8080

ENTRYPOINT ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "app:app"]
