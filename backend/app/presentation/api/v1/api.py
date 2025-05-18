# app/presentation/api/v1/api.py
# 이 파일은 이전 'presentation_layer_v1' 문서의 내용과 동일하게 유지하는 것이 좋습니다.
# 문제가 있다면 아래 내용으로 덮어쓰세요.
from fastapi import APIRouter

from app.presentation.api.v1.endpoints import users, stories, game # 각 엔드포인트 라우터 임포트

api_router_v1 = APIRouter()

# 각 엔드포인트 라우터를 /api/v1 경로 아래에 포함
# 여기서 사용되는 prefix가 각 엔드포인트의 기본 경로가 됩니다.
api_router_v1.include_router(users.router, prefix="/users", tags=["Users"])
api_router_v1.include_router(stories.router, prefix="/stories", tags=["Stories & Creative Elements"])
api_router_v1.include_router(game.router, prefix="/game", tags=["Game Play"])
