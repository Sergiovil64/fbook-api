"""
Contenedor real del traductor ES→EN (SageMaker BYOC).

Contenedor de inferencia del endpoint `fbook-translator` con los modelos reales aportados
en el PR #11 (feature/nlp-fase1): detección de idioma con fastText LID y traducción
ES→EN con Helsinki-NLP/opus-mt-es-en (MarianMT). En vez de exponerlos como un
microservicio FastAPI aparte, se envuelven en el contrato SageMaker del proyecto
para que el MS de publicación siga invocándolos vía `InvokeEndpoint` sin cambios.

Respeta `ml/CONTRACT.md` sección 1:
  - GET  /ping         -> 200 (health check)
  - POST /invocations  -> { "text": "<texto en inglés>", "srcLang": "es" | "en" | ... }

La detección de idioma vive aquí (contrato: `srcLang`). Solo se traduce cuando el
idioma detectado es español; si ya está en inglés (u otro idioma) se devuelve el
texto original con su `srcLang` detectado.
"""
from flask import Flask, request, jsonify

from models.language_detector import cargar_modelo as cargar_detector, detectar_idioma
from models.translator import cargar_modelo as cargar_traductor, traducir_al_ingles

app = Flask(__name__)

# Precarga de ambos modelos al importar el módulo (gunicorn --preload). Así /ping
# responde sano solo cuando los pesos están en memoria y la primera /invocations no
# paga la latencia de carga (~300 MB de MarianMT).
cargar_detector()
cargar_traductor()


@app.get("/ping")
def ping():
    return "", 200


@app.post("/invocations")
def invocations():
    payload = request.get_json(force=True, silent=True) or {}
    text = payload.get("text") or ""

    # Texto vacío: nada que detectar/traducir. Se devuelve intacto marcado como 'en'
    # (el clasificador lo tratará como no-tóxico; ver ModerationService).
    if not text.strip():
        return jsonify({"text": text, "srcLang": "en"})

    deteccion = detectar_idioma(text)
    src_lang = deteccion["idioma"]

    # Solo traducimos el español; inglés u otros idiomas se pasan tal cual al clasificador.
    text_en = traducir_al_ingles(text) if src_lang == "es" else text

    return jsonify({"text": text_en, "srcLang": src_lang})


if __name__ == "__main__":
    # SageMaker espera el servidor de inferencia en el puerto 8080.
    app.run(host="0.0.0.0", port=8080)
