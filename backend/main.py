from __future__ import annotations

from fastapi import FastAPI

from backend.api.routes import router


def create_app() -> FastAPI:
    app = FastAPI(
        title="Real-Time Coordinated Misinformation Campaign Detection System",
        version="1.0.0",
        description="Backend AI services for content, network, campaign, and threat analysis.",
    )
    app.include_router(router)
    return app


app = create_app()
