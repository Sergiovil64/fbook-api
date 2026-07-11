"""
Módulo de traducción español → inglés usando Helsinki-NLP/opus-mt-es-en.

Modelo utilizado: Helsinki-NLP/opus-mt-es-en (HuggingFace Hub)
  - Arquitectura: MarianMT (transformer seq2seq optimizado para traducción)
  - Tamaño: ~300 MB
  - Latencia en CPU: ~100–300ms por oración
  - Licencia: Apache 2.0
  - Específicamente entrenado para el par español → inglés

El modelo y el tokenizer se descargan durante el build del Docker
y se almacenan en caché en /app/model_cache para que no se vuelvan
a descargar en cada arranque del contenedor.

Este módulo está separado de la API para que el amigo que despliega
en SageMaker pueda reutilizarlo directamente en su inference.py,
apuntando a un SageMaker Endpoint con el contenedor HuggingFace nativo.
"""

import os

import torch
from transformers import MarianMTModel, MarianTokenizer

# Nombre del modelo en HuggingFace Hub
# Se puede sobreescribir si en el futuro se cambia el modelo de traducción
NOMBRE_MODELO = os.getenv("MODELO_TRADUCCION", "Helsinki-NLP/opus-mt-es-en")

# Directorio de caché del modelo (se pre-descarga en el build de Docker)
CACHE_DIR = os.getenv("TRANSFORMERS_CACHE", "/app/model_cache")

# Longitud máxima de tokens permitida por el modelo MarianMT
MAX_LONGITUD_TOKENS = 512

# Instancias singleton del tokenizer y el modelo (se cargan una sola vez en memoria)
_tokenizer: MarianTokenizer | None = None
_modelo: MarianMTModel | None = None


def _cargar_modelo() -> tuple[MarianTokenizer, MarianMTModel]:
    """
    Carga el tokenizer y el modelo MarianMT en memoria la primera vez que se invoca.
    Las llamadas siguientes devuelven las instancias ya cargadas (singleton).
    """
    global _tokenizer, _modelo
    if _tokenizer is None or _modelo is None:
        _tokenizer = MarianTokenizer.from_pretrained(NOMBRE_MODELO, cache_dir=CACHE_DIR)
        _modelo = MarianMTModel.from_pretrained(NOMBRE_MODELO, cache_dir=CACHE_DIR)
        _modelo.eval()  # modo inferencia: desactiva dropout y gradientes
    return _tokenizer, _modelo


def traducir_al_ingles(texto: str) -> str:
    """
    Traduce un texto del español al inglés.

    Parámetros:
        texto: El contenido del post o comentario en español.

    Retorna:
        El texto traducido al inglés como string.

    Notas:
        - Se usa truncation=True para respetar el límite de 512 tokens del modelo.
        - Textos muy largos se truncarán; para Fase 2 se puede implementar
          segmentación por oraciones si fuera necesario.
    """
    tokenizer, modelo = _cargar_modelo()

    # Tokenizar el texto de entrada
    tokens = tokenizer(
        [texto],
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=MAX_LONGITUD_TOKENS,
    )

    # Generar la traducción sin calcular gradientes (ahorra memoria y acelera la inferencia)
    with torch.no_grad():
        ids_traduccion = modelo.generate(**tokens)

    # Decodificar los tokens de salida al texto en inglés
    texto_en = tokenizer.decode(ids_traduccion[0], skip_special_tokens=True)

    return texto_en
