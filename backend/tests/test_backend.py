import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "ORoXLAB API"
    assert data["status"] == "operational"

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "arduino_cli" in data
    assert "version" in data["arduino_cli"]

def test_boards_endpoint():
    response = client.get("/api/boards")
    assert response.status_code == 200
    boards = response.json()
    assert len(boards) > 0
    
    devkit = next((b for b in boards if b["id"] == "esp32doit-devkit-v1"), None)
    assert devkit is not None
    assert devkit["chip_family"] == "ESP32"
    assert devkit["builtin_led_gpio"] == 2
    assert devkit["support_status"] == "fully_tested"
    assert len(devkit["pins"]) > 0

def test_compile_valid_sketch_and_cache_performance():
    payload = {
        "files": [
            {
                "name": "sketch.ino",
                "content": """
void setup() {
  pinMode(2, OUTPUT);
}
void loop() {
  digitalWrite(2, HIGH);
  delay(100);
  digitalWrite(2, LOW);
  delay(100);
}
"""
            }
        ],
        "board_fqbn": "esp32:esp32:esp32doit-devkit-v1"
    }
    # 1. Initial build (invokes actual arduino-cli toolchain)
    response = client.post("/api/compile", json=payload)
    assert response.status_code == 200
    result = response.json()
    assert result["success"] is True
    assert len(result["errors"]) == 0
    assert len(result["binaries"]) > 0

    # 2. Re-compile identical sketch -> Instant cache hit!
    cached_response = client.post("/api/compile", json=payload)
    assert cached_response.status_code == 200
    cached_result = cached_response.json()
    assert cached_result["success"] is True
    assert cached_result["duration_ms"] <= 10.0 # Instantaneous (<10ms)
    assert "Cache" in cached_result["output"]

def test_compile_invalid_sketch_syntax():
    payload = {
        "files": [
            {
                "name": "sketch.ino",
                "content": """
void setup() {
  pinMode(2, OUTPUT) // Missing semicolon syntax error
}
void loop() {}
"""
            }
        ],
        "board_fqbn": "esp32:esp32:esp32doit-devkit-v1"
    }
    response = client.post("/api/compile", json=payload)
    assert response.status_code == 200
    result = response.json()
    assert result["success"] is False
    assert len(result["errors"]) > 0
    assert any("expected" in e["message"].lower() or ";" in e["message"] for e in result["errors"])

def test_compile_fqbn_injection_protection():
    payload = {
        "files": [{"name": "sketch.ino", "content": "void setup(){}"}],
        "board_fqbn": "esp32;rm -rf /"
    }
    response = client.post("/api/compile", json=payload)
    assert response.status_code == 200
    result = response.json()
    assert result["success"] is False
    assert "Invalid board FQBN format" in result["output"]
