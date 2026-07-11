"""
Microservicio NLP — Fbook
Fase 1: Detección de idioma y traducción al inglés

Responsabilidades de este servicio:
  1. Recibir el texto de un post o comentario (enviado por el servicio publicacion)
  2. Detectar si el texto está en español o inglés usando fastText LID
  3. Traducir al inglés si el texto está en español usando Helsinki-NLP/opus-mt-es-en
  4. Devolver el resultado listo para ser procesado por el modelo de ciberbullying (Fase 2)

Puerto: 8000 (en contenedor y en ECS)
Cloud Map: nlp.fbook.local:8000
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

from app.health import router as health_router
from app.models.language_detector import _cargar_modelo as cargar_detector
from app.models.language_detector import detectar_idioma
from app.models.translator import _cargar_modelo as cargar_traductor
from app.models.translator import traducir_al_ingles
from app.schemas import RespuestaAnalisis, SolicitudAnalisis


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Al arrancar el contenedor se pre-cargan ambos modelos en memoria.
    Así la primera solicitud real no sufre la latencia de carga del modelo.
    """
    cargar_detector()
    cargar_traductor()
    yield


app = FastAPI(
    title="Fbook NLP Service",
    description=(
        "Fase 1 del sistema de detección de ciberbullying en Fbook. "
        "Detecta el idioma de posts y comentarios y los traduce al inglés "
        "para su posterior clasificación por el modelo NLP (Fase 2)."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(health_router)


@app.post("/v1/nlp/analyze", response_model=RespuestaAnalisis)
async def analizar_texto(solicitud: SolicitudAnalisis):
    """
    Recibe el texto de un post o comentario, detecta su idioma
    y lo traduce al inglés si está en español.

    El servicio 'publicacion' llama a este endpoint antes de guardar
    el contenido en DynamoDB, almacenando también 'idioma' y 'contenido_en'
    para que la Fase 2 (clasificación de ciberbullying) opere siempre en inglés.
    """
    try:
        # Paso 1: detectar el idioma del texto recibido
        deteccion = detectar_idioma(solicitud.texto)

        idioma = deteccion["idioma"]
        texto_en = solicitud.texto
        traducido = False

        # Paso 2: traducir al inglés solo si el texto está en español
        # Si ya está en inglés, se usa el texto original directamente
        if idioma == "es":
            texto_en = traducir_al_ingles(solicitud.texto)
            traducido = True

        return RespuestaAnalisis(
            idioma_detectado=idioma,
            confianza=deteccion["confianza"],
            texto_original=solicitud.texto,
            texto_en=texto_en,
            traducido=traducido,
            idioma_soportado=deteccion["soportado"],
        )

    except ValueError as e:
        # Error de validación de entrada (texto vacío, etc.)
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        # Error inesperado en los modelos
        raise HTTPException(
            status_code=500,
            detail=f"Error interno al procesar el texto: {str(e)}",
        )
