from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from app.services.compiler import compile_sketch, CompileResult

router = APIRouter(prefix="/api/compile", tags=["compile"])

class SketchFile(BaseModel):
    name: str = Field(..., description="File name e.g. sketch.ino or sensor.h")
    content: str = Field(..., description="Source code content")

class CompileRequest(BaseModel):
    files: List[SketchFile] = Field(..., description="List of source files")
    board_fqbn: str = Field(default="esp32:esp32:esp32doit-devkit-v1", description="Arduino FQBN target")
    build_properties: Optional[List[str]] = Field(default=None, description="Optional compiler flags")

class DiagnosticItem(BaseModel):
    file: str
    line: int
    column: int
    message: str
    severity: str

class CompileResponse(BaseModel):
    success: bool
    output: str
    errors: List[DiagnosticItem]
    warnings: List[DiagnosticItem]
    binaries: Dict[str, Any]
    duration_ms: float

@router.post("", response_model=CompileResponse)
async def compile_code(request: CompileRequest):
    if not request.files:
        raise HTTPException(status_code=400, detail="At least one source file must be provided.")
    
    file_dicts = [{"name": f.name, "content": f.content} for f in request.files]
    result: CompileResult = await compile_sketch(
        files=file_dicts,
        board_fqbn=request.board_fqbn,
        build_properties=request.build_properties
    )

    return CompileResponse(
        success=result.success,
        output=result.output,
        errors=[DiagnosticItem(**e) for e in result.errors],
        warnings=[DiagnosticItem(**w) for w in result.warnings],
        binaries=result.binaries,
        duration_ms=result.duration_ms
    )
