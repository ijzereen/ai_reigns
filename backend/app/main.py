# app/main.py
from fastapi import FastAPI
# from starlette.middleware.cors import CORSMiddleware # CORS 설정 시 필요

from app.presentation.api.v1.api import api_router_v1 # v1 API 라우터 임포트
# from app.core.config import settings # 프로젝트 설정 로드

app = FastAPI(
    title="Interactive Story Game API", # 프로젝트 제목
    openapi_url="/api/v1/openapi.json" # OpenAPI 스키마 경로
)

# CORS 미들웨어 설정 (프론트엔드와 다른 도메인에서 API 호출 시 필요)
# if settings.BACKEND_CORS_ORIGINS:
#     app.add_middleware(
#         CORSMiddleware,
#         allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
#         allow_credentials=True,
#         allow_methods=["*"],
#         allow_headers=["*"],
#     )

# /v1 경로로 API 라우터 포함
app.include_router(api_router_v1, prefix="/api/v1")

@app.get("/") # 루트 경로 핸들러 (선택 사항)
async def root():
    return {"message": "인터랙티브 스토리 게임 API에 오신 것을 환영합니다!"}
