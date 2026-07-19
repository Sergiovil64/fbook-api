"""
Módulo de detección de idioma usando fastText LID.

Reutilizado del servicio NLP (PR #11 feature/nlp-fase1); aquí vive dentro del
contenedor BYOC del endpoint SageMaker `fbook-translator`, no como microservicio aparte.
La única adaptación respecto al original es la ruta por defecto del modelo
(/opt/program en vez de /app), para alinearla con el WORKDIR del contenedor.

Modelo utilizado: lid.176.ftz (Meta/Facebook)
  - Detecta 176 idiomas con alta precisión (~99.6% en benchmark)
  - Muy rápido: latencia < 1ms por texto
  - Tamaño comprimido: ~917 KB

El modelo se descarga una sola vez durante el build del Docker
y se almacena en /opt/program/lid.176.ftz dentro del contenedor.

El archivo del modelo se descarga desde:
  https://dl.fbaipublicfiles.com/fasttext/supervised-models/lid.176.ftz
"""

import io
import os
import sys
from typing import Any

import fasttext

# Ruta al archivo del modelo dentro del contenedor
# Se puede sobreescribir con la variable de entorno FASTTEXT_MODEL_PATH
RUTA_MODELO = os.getenv("FASTTEXT_MODEL_PATH", "/opt/program/lid.176.ftz")

# Idiomas contemplados en el alcance del proyecto
IDIOMAS_SOPORTADOS = {"es", "en"}

# Instancia singleton del modelo (se carga una sola vez en memoria)
# Se usa Any porque _FastText es una clase interna privada de fasttext
# que no está garantizada como parte de la API pública del paquete
_modelo: Any = None


def cargar_modelo() -> Any:
    """
    Carga el modelo fastText en memoria la primera vez que se invoca.
    Las llamadas siguientes devuelven la instancia ya cargada (singleton).
    Suprimir el log de fastText que muestra un aviso al cargar el modelo.
    """
    global _modelo
    if _modelo is None:
        # Redirigir stderr durante la carga para suprimir el aviso de fastText:
        # "Warning: load_model does not return WordVectorModel or SupervisedModel any more..."
        # que aparece siempre al cargar modelos cuantizados (.ftz). No indica un error real.
        _stderr_original = sys.stderr
        sys.stderr = io.StringIO()
        try:
            _modelo = fasttext.load_model(RUTA_MODELO)
        finally:
            sys.stderr = _stderr_original
    return _modelo


def detectar_idioma(texto: str) -> dict:
    """
    Detecta el idioma de un texto dado.

    Parámetros:
        texto: El contenido del post o comentario a analizar.

    Retorna un diccionario con:
        - idioma: Código ISO 639-1 del idioma detectado (ej: 'es', 'en')
        - confianza: Probabilidad asignada por el modelo (0.0 a 1.0)
        - soportado: Si el idioma está dentro del alcance del proyecto
    """
    if not texto or not texto.strip():
        raise ValueError("El texto no puede estar vacío")

    modelo = cargar_modelo()

    # fastText devuelve etiquetas con formato '__label__es'
    # Se solicita solo la predicción más probable (k=1)
    texto_limpio = texto.strip().replace("\n", " ")
    etiquetas, probabilidades = modelo.predict(texto_limpio, k=1)

    # Extraer el código ISO eliminando el prefijo '__label__'
    idioma = etiquetas[0].replace("__label__", "")
    confianza = float(probabilidades[0])

    return {
        "idioma": idioma,
        "confianza": confianza,
        "soportado": idioma in IDIOMAS_SOPORTADOS,
    }
