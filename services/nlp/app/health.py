from fastapi import APIRouter

router = APIRouter()


# Endpoint de salud requerido por el ALB y ECS para verificar que el servicio está activo
# Sigue el mismo patrón que el resto de microservicios de Fbook
@router.get("/health")
async def health():
    return {"status": "ok"}
