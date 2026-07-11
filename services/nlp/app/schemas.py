from pydantic import BaseModel, Field


# Esquema de la solicitud que llega al endpoint /v1/nlp/analyze
class SolicitudAnalisis(BaseModel):
    texto: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Texto del post o comentario a analizar",
        examples=["Eres un idiota y nadie te quiere"],
    )


# Esquema de la respuesta devuelta al microservicio que llama (publicacion/comentarios)
class RespuestaAnalisis(BaseModel):
    idioma_detectado: str = Field(
        description="Código ISO 639-1 del idioma detectado (ej: 'es', 'en')"
    )
    confianza: float = Field(
        description="Nivel de confianza de la detección, entre 0.0 y 1.0"
    )
    texto_original: str = Field(
        description="Texto tal como llegó en la solicitud, sin modificar"
    )
    texto_en: str = Field(
        description="Texto en inglés: traducido si venía en español, o el original si ya estaba en inglés"
    )
    traducido: bool = Field(
        description="Indica si se realizó traducción (True) o el texto ya estaba en inglés (False)"
    )
    idioma_soportado: bool = Field(
        description="Indica si el idioma detectado está dentro del alcance del proyecto (español o inglés)"
    )
