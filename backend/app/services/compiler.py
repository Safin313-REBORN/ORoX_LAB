import asyncio
import base64
import hashlib
import json
import logging
import os
import re
import shutil
import signal
import tempfile
import time
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)

# Locate arduino-cli
DEFAULT_CLI_PATHS = [
    "/home/safin313/.local/bin/arduino-cli",
    shutil.which("arduino-cli"),
    "/usr/local/bin/arduino-cli",
    "/usr/bin/arduino-cli",
]

ARDUINO_CLI = next((p for p in DEFAULT_CLI_PATHS if p and os.path.isfile(p)), "arduino-cli")

# Concurrency throttle to prevent system overload
COMPILER_SEMAPHORE = asyncio.Semaphore(2)

# Strict FQBN format validation
FQBN_REGEX = re.compile(r"^[a-zA-Z0-9_\-]+:[a-zA-Z0-9_\-]+:[a-zA-Z0-9_\-]+$")

# Safe file name format
SAFE_FILENAME_REGEX = re.compile(r"^[a-zA-Z0-9_\-\.]+$")

class CompileResult:
    def __init__(
        self,
        success: bool,
        output: str,
        errors: List[Dict[str, Any]],
        warnings: List[Dict[str, Any]],
        binaries: Optional[Dict[str, Any]] = None,
        duration_ms: float = 0.0,
        from_cache: bool = False
    ):
        self.success = success
        self.output = output
        self.errors = errors
        self.warnings = warnings
        self.binaries = binaries or {}
        self.duration_ms = duration_ms
        self.from_cache = from_cache

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "output": self.output,
            "errors": self.errors,
            "warnings": self.warnings,
            "binaries": self.binaries,
            "duration_ms": self.duration_ms,
            "from_cache": self.from_cache
        }

# In-memory build cache (hash -> CompileResult)
class CompilationCache:
    def __init__(self, max_items: int = 50, ttl_sec: int = 3600):
        self._cache: Dict[str, tuple[float, CompileResult]] = {}
        self._max_items = max_items
        self._ttl_sec = ttl_sec

    def _compute_key(self, board_fqbn: str, files: List[Dict[str, str]]) -> str:
        h = hashlib.sha256()
        h.update(board_fqbn.encode("utf-8"))
        for f in sorted(files, key=lambda x: x.get("name", "")):
            h.update(f.get("name", "").encode("utf-8"))
            h.update(f.get("content", "").encode("utf-8"))
        return h.hexdigest()

    def get(self, board_fqbn: str, files: List[Dict[str, str]]) -> Optional[CompileResult]:
        key = self._compute_key(board_fqbn, files)
        if key in self._cache:
            ts, result = self._cache[key]
            if time.time() - ts < self._ttl_sec:
                # Cache hit!
                return CompileResult(
                    success=result.success,
                    output=result.output + "\n[ORoXLAB Cache] Instant build hit (0s).",
                    errors=result.errors,
                    warnings=result.warnings,
                    binaries=result.binaries,
                    duration_ms=2.0,
                    from_cache=True
                )
            else:
                del self._cache[key]
        return None

    def set(self, board_fqbn: str, files: List[Dict[str, str]], result: CompileResult):
        if not result.success:
            return # Only cache successful builds
        if len(self._cache) >= self._max_items:
            # Purge oldest
            oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k][0])
            del self._cache[oldest_key]
        key = self._compute_key(board_fqbn, files)
        self._cache[key] = (time.time(), result)

_build_cache = CompilationCache()

def parse_compiler_diagnostics(raw_output: str) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Parse GCC/Clang diagnostic lines into structured objects."""
    errors = []
    warnings = []
    
    diag_pattern = re.compile(r"^(.*?):(\d+):(\d+):\s+(fatal error|error|warning):\s+(.*)$", re.MULTILINE)
    
    for match in diag_pattern.finditer(raw_output):
        file_path, line, col, severity, msg = match.groups()
        diag = {
            "file": os.path.basename(file_path),
            "line": int(line),
            "column": int(col),
            "message": msg.strip(),
            "severity": severity.lower()
        }
        if "error" in severity:
            errors.append(diag)
        else:
            warnings.append(diag)
            
    return errors, warnings

async def compile_sketch(
    files: List[Dict[str, str]],
    board_fqbn: str = "esp32:esp32:esp32doit-devkit-v1",
    build_properties: Optional[List[str]] = None,
    timeout_sec: int = 60
) -> CompileResult:
    """Compile a multi-file Arduino/ESP32 sketch with concurrency control, caching, and sandboxing."""
    # 1. Validation & Security Checks
    if not FQBN_REGEX.match(board_fqbn):
        return CompileResult(
            success=False,
            output=f"Invalid board FQBN format: {board_fqbn}",
            errors=[{"file": "board", "line": 0, "column": 0, "message": "Invalid FQBN format.", "severity": "error"}],
            warnings=[]
        )

    if len(files) > 25:
        return CompileResult(
            success=False,
            output="Too many files in sketch (max 25).",
            errors=[{"file": "project", "line": 0, "column": 0, "message": "File limit exceeded.", "severity": "error"}],
            warnings=[]
        )

    # 2. Check compilation cache
    cached_result = _build_cache.get(board_fqbn, files)
    if cached_result:
        logger.info(f"Compilation cache hit for {board_fqbn}")
        return cached_result

    # 3. Acquire concurrency semaphore
    async with COMPILER_SEMAPHORE:
        start_time = asyncio.get_event_loop().time()
        temp_dir = tempfile.mkdtemp(prefix="robolab_sketch_")
        build_dir = os.path.join(temp_dir, "build")
        sketch_dir = os.path.join(temp_dir, "sketch")
        os.makedirs(build_dir, exist_ok=True)
        os.makedirs(sketch_dir, exist_ok=True)
        
        try:
            main_ino_found = False
            total_size = 0

            for f in files:
                fname = os.path.basename(f.get("name", "").strip())
                content = f.get("content", "")
                
                # Check for path traversal or invalid names
                if not fname or not SAFE_FILENAME_REGEX.match(fname) or ".." in fname:
                    continue
                
                total_size += len(content.encode("utf-8"))
                if total_size > 5 * 1024 * 1024:
                    return CompileResult(
                        success=False,
                        output="Sketch size exceeds 5MB limit.",
                        errors=[{"file": "project", "line": 0, "column": 0, "message": "Source limit exceeded.", "severity": "error"}],
                        warnings=[]
                    )
                
                target_path = os.path.join(sketch_dir, fname)
                with open(target_path, "w", encoding="utf-8") as out:
                    out.write(content)

                if fname.endswith(".ino"):
                    main_ino_found = True

            if not main_ino_found:
                with open(os.path.join(sketch_dir, "sketch.ino"), "w", encoding="utf-8") as out:
                    out.write("// Empty sketch\nvoid setup() {}\nvoid loop() {}\n")

            cmd = [
                ARDUINO_CLI,
                "compile",
                "--fqbn", board_fqbn,
                sketch_dir,
                "--output-dir", build_dir,
                "--verbose"
            ]

            # Run in isolated process group for clean kill
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
                start_new_session=True
            )

            try:
                stdout_data, _ = await asyncio.wait_for(proc.communicate(), timeout=timeout_sec)
                raw_output = stdout_data.decode("utf-8", errors="replace")
            except asyncio.TimeoutError:
                try:
                    os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
                except Exception:
                    proc.kill()
                await proc.wait()
                return CompileResult(
                    success=False,
                    output=f"Compilation timed out after {timeout_sec} seconds.",
                    errors=[{"file": "sketch", "line": 0, "column": 0, "message": "Compilation timed out.", "severity": "error"}],
                    warnings=[],
                    duration_ms=(asyncio.get_event_loop().time() - start_time) * 1000
                )

            duration_ms = (asyncio.get_event_loop().time() - start_time) * 1000
            success = (proc.returncode == 0)
            errors, warnings = parse_compiler_diagnostics(raw_output)

            if not success and len(errors) == 0:
                errors.append({
                    "file": "sketch.ino",
                    "line": 1,
                    "column": 1,
                    "message": raw_output.strip().splitlines()[-1] if raw_output.strip() else "Compilation failed.",
                    "severity": "error"
                })

            # Collect binaries
            binaries: Dict[str, Any] = {}
            if success and os.path.exists(build_dir):
                for fname in os.listdir(build_dir):
                    fpath = os.path.join(build_dir, fname)
                    if not os.path.isfile(fpath):
                        continue
                    size = os.path.getsize(fpath)
                    
                    if fname.endswith(".bin") or fname.endswith(".hex") or fname.endswith(".elf"):
                        with open(fpath, "rb") as bf:
                            data = bf.read()
                            b64 = base64.b64encode(data).decode("ascii") if size <= 4 * 1024 * 1024 else None
                            binaries[fname] = {
                                "size": size,
                                "data_b64": b64
                            }

            result = CompileResult(
                success=success,
                output=raw_output,
                errors=errors,
                warnings=warnings,
                binaries=binaries,
                duration_ms=duration_ms
            )

            # Store in cache
            if success:
                _build_cache.set(board_fqbn, files, result)

            return result

        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)
