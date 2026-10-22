import shutil
import subprocess
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import compile, boards, simulation

app = FastAPI(
    title="ORoXLAB — Virtual Robotics & Embedded Systems API",
    version="1.0.0",
    description="Backend services for compiling ESP32 firmware, managing board profiles, and streaming simulation runtime events."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(compile.router)
app.include_router(boards.router)
app.include_router(simulation.router)

@app.get("/")
async def root():
    return {
        "app": "ORoXLAB API",
        "version": "1.0.0",
        "status": "operational",
        "docs_url": "/docs"
    }

@app.get("/health")
@app.get("/api/health")
async def health():
    cli_path = shutil.which("arduino-cli") or "/home/safin313/.local/bin/arduino-cli"
    cli_version = "unavailable"
    cores = []
    
    try:
        proc = subprocess.run([cli_path, "version"], capture_output=True, text=True, timeout=5)
        if proc.returncode == 0:
            cli_version = proc.stdout.strip()
            
        core_proc = subprocess.run([cli_path, "core", "list"], capture_output=True, text=True, timeout=5)
        if core_proc.returncode == 0:
            cores = [line for line in core_proc.stdout.splitlines() if line.strip() and not line.startswith("ID")]
    except Exception as e:
        cli_version = f"Error: {e}"

    return {
        "status": "healthy",
        "arduino_cli": {
            "path": cli_path,
            "version": cli_version,
            "cores": cores
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
