from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field # Import Field for default factory
from typing import List, Dict, Any, Set, Optional
import json
import os

app = FastAPI()

# --- CORS 설정 ---
origins = [
    "http://localhost:3000", # React 앱 주소 (create-react-app 기본)
    "http://localhost:3001", # 필요시 다른 프론트엔드 주소 추가
    "http://localhost:5173", # Vite React 기본 주소 추가
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 데이터 저장 파일 정의 ---
DATA_FILE = "graph_db.json"

# --- Pydantic 모델 정의 ---
# Node 모델은 React Flow에서 보내는 모든 필드를 포함하거나 Optional로 처리
class Node(BaseModel):
    id: str
    type: Optional[str] = None
    data: Dict[str, Any]
    position: Dict[str, float]
    style: Optional[Dict[str, Any]] = None
    width: Optional[int] = None
    height: Optional[int] = None
    selected: Optional[bool] = False
    positionAbsolute: Optional[Dict[str, float]] = None
    dragging: Optional[bool] = False
    # React Flow가 추가할 수 있는 다른 필드도 Optional로 추가 가능
    sourcePosition: Optional[str] = None
    targetPosition: Optional[str] = None


class Edge(BaseModel):
    id: str
    source: str
    target: str
    type: Optional[str] = None # 엣지 타입 추가 (e.g., 'smoothstep')
    animated: Optional[bool] = False
    style: Optional[Dict[str, Any]] = None
    markerEnd: Optional[Dict[str, Any]] = None


class GraphPayload(BaseModel):
    # nodes와 edges를 리스트로 받음, 기본값으로 빈 리스트 설정
    nodes: List[Node] = Field(default_factory=list)
    edges: List[Edge] = Field(default_factory=list)

# --- 인메모리 데이터 저장소 (리스트 사용) ---
# 초기 상태는 빈 리스트로 설정
graph_data: GraphPayload = GraphPayload(nodes=[], edges=[])

# --- 데이터 파일 관련 함수 ---
def load_graph_from_file():
    """애플리케이션 시작 시 JSON 파일에서 그래프 데이터를 로드합니다."""
    global graph_data
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                loaded_data = json.load(f)
                # Pydantic 모델을 사용하여 로드된 데이터 유효성 검사 및 변환
                graph_data = GraphPayload(**loaded_data)
                print(f"Graph data loaded from {DATA_FILE}. Nodes: {len(graph_data.nodes)}, Edges: {len(graph_data.edges)}")
        except json.JSONDecodeError:
            print(f"Error decoding JSON from {DATA_FILE}. Starting with empty graph.")
            graph_data = GraphPayload() # 파일 손상 시 빈 GraphPayload 사용
        except Exception as e:
            print(f"Could not load graph data from {DATA_FILE}: {e}. Starting with empty graph.")
            graph_data = GraphPayload() # 기타 오류 발생 시 빈 GraphPayload 사용
    else:
        print(f"{DATA_FILE} not found. Starting with empty graph.")
        graph_data = GraphPayload() # 파일 없을 시 빈 GraphPayload 사용

def save_graph_to_file():
    """현재 그래프 데이터를 JSON 파일에 저장합니다."""
    global graph_data
    try:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            # Pydantic 모델을 dict로 변환하여 저장
            json.dump(graph_data.dict(), f, ensure_ascii=False, indent=4)
        print(f"Graph data saved to {DATA_FILE}")
    except Exception as e:
        print(f"Error saving graph data to {DATA_FILE}: {e}")

# --- 애플리케이션 시작 시 데이터 로드 ---
@app.on_event("startup")
async def startup_event():
    load_graph_from_file()

# --- 조상 찾기 함수 (백엔드 로직) ---
def find_ancestors_backend(target_node_id: str, all_edges: List[Edge]) -> Set[str]:
    """주어진 노드 ID의 모든 조상 노드 ID를 찾습니다 (백엔드 버전)."""
    ancestors = set()
    queue = [target_node_id]
    visited_for_search = set() # 순환 방지를 위한 방문 기록

    # 엣지 정보를 target -> [source list] 맵으로 변환 (효율적인 탐색 위함)
    target_to_sources: Dict[str, List[str]] = {}
    for edge in all_edges:
        target = edge.target
        source = edge.source
        if target not in target_to_sources:
            target_to_sources[target] = []
        target_to_sources[target].append(source)

    # BFS(너비 우선 탐색) 또는 DFS(깊이 우선 탐색)로 조상 찾기
    while queue:
        current_node_id = queue.pop(0) # BFS 방식

        # 이미 방문한 노드는 건너뜀 (순환 그래프 처리)
        # if current_node_id in visited_for_search:
        #     continue
        # visited_for_search.add(current_node_id) # BFS에서는 여기서 방문 처리하지 않음

        # 현재 노드를 가리키는 부모(source) 노드들을 찾음
        parent_ids = target_to_sources.get(current_node_id, [])

        for parent_id in parent_ids:
            # 아직 발견되지 않은 조상이고, 탐색 큐에 아직 없다면 추가
            if parent_id not in ancestors and parent_id not in visited_for_search:
                ancestors.add(parent_id)
                queue.append(parent_id)
                visited_for_search.add(parent_id) # 큐에 추가할 때 방문 처리 (BFS 최적화)

    return ancestors

# --- API 엔드포인트 ---
@app.get("/")
async def read_root():
    return {"message": "Graph API Backend with File Persistence"}

@app.get("/graph", response_model=GraphPayload)
async def get_graph():
    """현재 저장된 그래프 데이터(노드 및 엣지 리스트) 전체를 반환합니다."""
    global graph_data
    # graph_data는 이미 GraphPayload 타입이므로 그대로 반환
    return graph_data

@app.post("/graph")
async def update_graph(payload: GraphPayload):
    """프론트엔드에서 받은 그래프 데이터로 백엔드 상태를 업데이트하고 파일에 저장합니다."""
    global graph_data
    # 받은 payload로 graph_data를 직접 업데이트
    graph_data = payload
    save_graph_to_file() # 변경 사항을 파일에 저장
    print(f"Graph data updated and saved. Nodes: {len(graph_data.nodes)}, Edges: {len(graph_data.edges)}")
    return {"status": "Graph updated and saved successfully"}

@app.get("/nodes/{node_id}/ancestors")
async def get_node_ancestors(node_id: str):
    """특정 노드의 모든 조상 노드 ID 목록을 반환합니다."""
    global graph_data

    # 노드 존재 여부 확인 (리스트에서 ID로 검색)
    node_exists = any(node.id == node_id for node in graph_data.nodes)
    if not node_exists:
        raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found")

    # graph_data.edges는 이미 Edge 모델의 리스트임
    ancestor_ids = find_ancestors_backend(node_id, graph_data.edges)
    print(f"Ancestors found for node {node_id}: {ancestor_ids}")
    return {"node_id": node_id, "ancestors": list(ancestor_ids)}

# FastAPI 실행 방법:
# 1. 파일 저장 (예: main.py)
# 2. pip install fastapi "uvicorn[standard]" pydantic
# 3. uvicorn main:app --reload --host 0.0.0.0 --port 8000
