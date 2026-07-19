"""
Contenedor real del clasificador de cyberbullying (SageMaker BYOC).

Modelo: DistilBERT (`distilbert-base-uncased`) fine-tuneado en binario por el equipo
(ver ml/training/train_classifier.ipynb). El artefacto entrenado se hornea en la imagen
bajo /opt/program/model (ver ml/classifier/README.md).

Respeta `ml/CONTRACT.md` sección 2:
  - GET  /ping         -> 200 (health check)
  - POST /invocations  -> { "label": "bullying" | "ok", "score": 0.0–1.0 }

El texto entra en inglés (lo traduce antes el endpoint fbook-translator). Se replica el
mismo `clean_text` del entrenamiento para mantener paridad train/inferencia.
"""
import html
import os
import re

import torch
from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModelForSequenceClassification

MODEL_DIR = os.getenv("MODEL_DIR", "/opt/program/model")
MAX_LENGTH = 128

# id2label del entrenamiento: {0: not_cyberbullying, 1: cyberbullying}.
# El índice 1 es la clase "cyberbullying" → su probabilidad es el toxicityScore.
BULLYING_INDEX = 1

app = Flask(__name__)

# Carga única del modelo + tokenizer (baked en la imagen, sin acceso a internet).
tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
model.eval()


def clean_text(text: str) -> str:
    """Misma limpieza que en el entrenamiento (train_classifier.ipynb)."""
    text = html.unescape(str(text))
    text = re.sub(r"http\S+|www\S+", " ", text)   # URLs
    text = re.sub(r"@\w+", "@user", text)          # menciones
    text = re.sub(r"#", "", text)                   # quitar solo el símbolo #
    text = re.sub(r"\s+", " ", text)                # espacios
    return text.strip()


@app.get("/ping")
def ping():
    return "", 200


@app.post("/invocations")
def invocations():
    payload = request.get_json(force=True, silent=True) or {}
    text = payload.get("text") or ""

    # Texto vacío: nada que clasificar → no tóxico.
    if not text.strip():
        return jsonify({"label": "ok", "score": 0.0})

    inputs = tokenizer(
        clean_text(text),
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=MAX_LENGTH,
    )
    # DistilBERT no acepta token_type_ids (no usa segment embeddings); algunos
    # tokenizer_config.json no declaran model_input_names y el tokenizer rápido
    # lo agrega igual, así que se descarta explícitamente antes de invocar el modelo.
    inputs.pop("token_type_ids", None)

    with torch.no_grad():
        logits = model(**inputs).logits

    probabilities = torch.softmax(logits, dim=-1)[0]
    score = probabilities[BULLYING_INDEX].item()
    label = "bullying" if torch.argmax(probabilities).item() == BULLYING_INDEX else "ok"

    return jsonify({"label": label, "score": round(score, 4)})


if __name__ == "__main__":
    # SageMaker espera el servidor de inferencia en el puerto 8080.
    app.run(host="0.0.0.0", port=8080)
