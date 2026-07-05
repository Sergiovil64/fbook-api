"""
Contenedor dummy del clasificador de cyberbullying (placeholder).

Respeta el contrato de fbook-api/ml/CONTRACT.md sección 2. Sirve para probar la integración
E2E y demostrar un caso FLAGGED mientras el integrante de ML entrena el modelo real. Cuando el
modelo real esté listo, se reemplaza esta imagen en el repo ECR `fbook-ml-classifier` sin tocar
el backend.

Formato SageMaker BYOC:
  - GET  /ping         -> 200 (health check)
  - POST /invocations  -> clasificación

Heurística placeholder: marca 'bullying' si el texto (en inglés) contiene alguna palabra de una
lista básica. NO es un modelo real; solo desbloquea la demo.
"""
from flask import Flask, request, jsonify

app = Flask(__name__)

# Lista mínima de términos tóxicos (en inglés) solo para la demo del placeholder.
TOXIC_WORDS = {
    "idiot", "stupid", "loser", "ugly", "hate", "kill", "dumb",
    "worthless", "moron", "trash", "nobody likes you",
}


@app.get("/ping")
def ping():
    return "", 200


@app.post("/invocations")
def invocations():
    payload = request.get_json(force=True, silent=True) or {}
    text = (payload.get("text") or "").lower()

    hits = sum(1 for w in TOXIC_WORDS if w in text)
    if hits > 0:
        score = min(0.5 + 0.15 * hits, 0.99)
        return jsonify({"label": "bullying", "score": round(score, 2)})
    return jsonify({"label": "ok", "score": 0.02})


if __name__ == "__main__":
    # SageMaker espera el servidor de inferencia en el puerto 8080.
    app.run(host="0.0.0.0", port=8080)
