"""
Contenedor dummy del traductor ES→EN (placeholder).

Respeta el contrato de fbook-api/ml/CONTRACT.md sección 1. La detección de idioma vive aquí:
si el texto parece inglés, se devuelve intacto con srcLang='en'; si parece español, se marca
srcLang='es'. Este dummy NO traduce de verdad (devuelve el texto tal cual): solo desbloquea la
integración E2E hasta que el integrante de ML entrene el modelo de traducción real y reemplace
esta imagen en el repo ECR `fbook-ml-translator`.

Formato SageMaker BYOC:
  - GET  /ping         -> 200 (health check)
  - POST /invocations  -> traducción + idioma detectado
"""
import re
from flask import Flask, request, jsonify

app = Flask(__name__)

# Heurística mínima de detección de español (solo para el placeholder).
SPANISH_MARKERS = re.compile(
    r"[ñáéíóú¿¡]|\b(el|la|los|las|un|una|que|de|eres|nadie|te|quiere|tu|muy|no)\b",
    re.IGNORECASE,
)


def detect_lang(text: str) -> str:
    return "es" if SPANISH_MARKERS.search(text or "") else "en"


@app.get("/ping")
def ping():
    return "", 200


@app.post("/invocations")
def invocations():
    payload = request.get_json(force=True, silent=True) or {}
    text = payload.get("text") or ""
    src_lang = detect_lang(text)
    # Dummy: no traduce; el modelo real devolverá aquí el texto en inglés.
    return jsonify({"text": text, "srcLang": src_lang})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
