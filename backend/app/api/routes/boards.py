from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.services.boards import list_boards, get_board

router = APIRouter(prefix="/api/boards", tags=["boards"])

@router.get("", response_model=List[Dict[str, Any]])
async def get_all_boards():
    return list_boards()

@router.get("/{board_id}")
async def get_board_by_id(board_id: str):
    board = get_board(board_id)
    if not board:
        raise HTTPException(status_code=404, detail=f"Board '{board_id}' not found.")
    return board.model_dump()
