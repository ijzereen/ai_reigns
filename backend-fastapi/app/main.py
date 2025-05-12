from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Set
import json # JSON 처리를 위한 모듈 추가
import os   # 파일 존재 여부 확인을 위한 모듈 추가

app = FastAPI()

# --- CORS 설정 ---
origins = [
    "http://localhost:3000", # React 앱 주소
    "http://localhost:3001", # 다른 프론트엔드 주소가 있다면 추가
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

# --- 인메모리 데이터 저장소 (애플리케이션 시작 시 파일에서 로드) ---
graph_data = {
    "nodes": {}, # {node_id: node_data}
    "edges": []  # [{id: edge_id, source: source_id, target: target_id, ...}]
}

# --- Pydantic 모델 정의 ---
class Node(BaseModel):
    id: str
    type: str | None = None
    data: Dict[str, Any]
    position: Dict[str, float]
    style: Dict[str, Any] | None = None
    width: int | None = None
    height: int | None = None
    selected: bool | None = False
    positionAbsolute: Dict[str, float] | None = None # React Flow에서 오는 positionAbsolute
    dragging: bool | None = False

class Edge(BaseModel):
    id: str
    source: str
    target: str
    animated: bool | None = False
    style: Dict[str, Any] | None = None
    markerEnd: Dict[str, Any] | None = None

class GraphPayload(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

# --- 데이터 파일 관련 함수 ---
def load_graph_from_file():
    """애플리케이션 시작 시 JSON 파일에서 그래프 데이터를 로드합니다."""
    global graph_data
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                loaded_data = json.load(f)
                # Pydantic 모델로 유효성 검사 및 변환 (선택 사항, 데이터 무결성을 위해 권장)
                # 여기서는 간단하게 직접 할당합니다.
                graph_data["nodes"] = loaded_data.get("nodes", {})
                graph_data["edges"] = loaded_data.get("edges", [])
                print(f"Graph data loaded from {DATA_FILE}")
        except json.JSONDecodeError:
            print(f"Error decoding JSON from {DATA_FILE}. Starting with empty graph.")
            graph_data = {"nodes": {}, "edges": []} # 파일 손상 시 초기화
        except Exception as e:
            print(f"Could not load graph data from {DATA_FILE}: {e}. Starting with empty graph.")
            graph_data = {"nodes": {}, "edges": []} # 기타 오류 발생 시 초기화
    else:
        print(f"{DATA_FILE} not found. Starting with empty graph.")
        graph_data = {"nodes": {}, "edges": []} # 파일 없을 시 초기화

def save_graph_to_file():
    """현재 그래프 데이터를 JSON 파일에 저장합니다."""
    global graph_data
    try:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(graph_data, f, ensure_ascii=False, indent=4)
        print(f"Graph data saved to {DATA_FILE}")
    except Exception as e:
        print(f"Error saving graph data to {DATA_FILE}: {e}")

# --- 애플리케이션 시작 시 데이터 로드 ---
@app.on_event("startup")
async def startup_event():
    load_graph_from_file()

# --- 조상 찾기 함수 (백엔드 로직) ---
def find_ancestors_backend(target_node_id: str, all_edges: List[Dict]) -> Set[str]:
    """주어진 노드 ID의 모든 조상 노드 ID를 찾습니다 (백엔드 버전)."""
    ancestors = set()
    queue = [target_node_id]
    visited_for_search = set()

    target_to_sources = {}
    for edge in all_edges:
        target = edge.get("target")
        source = edge.get("source")
        if target not in target_to_sources:
            target_to_sources[target] = []
        target_to_sources[target].append(source)

    while queue:
        current_node_id = queue.pop(0)
        if current_node_id in visited_for_search:
            continue
        visited_for_search.add(current_node_id)
        parent_ids = target_to_sources.get(current_node_id, [])
        for parent_id in parent_ids:
            if parent_id not in ancestors:
                ancestors.add(parent_id)
                queue.append(parent_id)
    return ancestors

# --- API 엔드포인트 ---
@app.get("/")
async def read_root():
    return {"message": "Graph API Backend with Ancestor Search and File Persistence"}

@app.get("/graph")
async def get_graph():
    """현재 저장된 그래프 데이터(노드 및 엣지) 전체를 반환합니다."""
    global graph_data
    # Pydantic 모델을 사용하여 응답 형식을 명확히 할 수도 있습니다.
    # 여기서는 graph_data를 직접 반환합니다.
    return graph_data

@app.post("/graph")
async def update_graph(payload: GraphPayload):
    """프론트엔드에서 받은 그래프 데이터로 백엔드 상태를 업데이트하고 파일에 저장합니다."""
    global graph_data
    # React Flow에서 오는 노드 데이터에는 positionAbsolute 등이 있을 수 있습니다.
    # 이를 Node 모델에 맞게 처리합니다.
    processed_nodes = {}
    for node_model in payload.nodes:
        node_dict = node_model.dict()
        # positionAbsolute 필드가 Node 모델에 없으면 제거하거나, 모델에 추가해야 합니다.
        # 현재 Node 모델에는 positionAbsolute가 있으므로 그대로 사용합니다.
        processed_nodes[node_model.id] = node_dict

    graph_data["nodes"] = processed_nodes
    graph_data["edges"] = [edge.dict() for edge in payload.edges]
    
    save_graph_to_file() # 변경 사항을 파일에 저장
    print(f"Graph data updated and saved. Nodes: {len(graph_data['nodes'])}, Edges: {len(graph_data['edges'])}")
    return {"status": "Graph updated and saved successfully"}

@app.get("/nodes/{node_id}/ancestors")
async def get_node_ancestors(node_id: str):
    """특정 노드의 모든 조상 노드 ID 목록을 반환합니다."""
    global graph_data
    if node_id not in graph_data["nodes"]:
        raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found")

    ancestor_ids = find_ancestors_backend(node_id, graph_data["edges"])
    print(f"Ancestors found for node {node_id}: {ancestor_ids}")
    return {"node_id": node_id, "ancestors": list(ancestor_ids)}

# FastAPI 실행 방법:
# 1. 파일 저장 (예: main.py)
# 2. pip install fastapi "uvicorn[standard]" pydantic
# 3. uvicorn main:app --reload
