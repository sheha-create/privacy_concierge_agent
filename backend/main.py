import uvicorn
from app.core.config import settings


if __name__ == "__main__":
    uvicorn.run(
        "app.api.routes:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )