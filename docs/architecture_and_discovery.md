# RoboLab Architecture & Technical Discovery

## 1. Executive Summary & Environment Assessment
RoboLab is a professional, extensible virtual robotics and embedded systems simulation platform designed specifically for the ESP32 ecosystem, with modular support for additional MCU architectures.

### Host Toolchain & Dependencies Audit
- **Operating System:** Linux x86_64
- **Node.js & NPM:** Node v18.19.1, NPM 9.2.0
- **Python:** Python 3.12.3 with virtual environment (`backend/venv`) containing FastAPI 0.115+, Uvicorn 0.32+, WebSockets 12+, Pydantic 2.10+, HTTPX 0.27+, Pytest 8.0+
- **Arduino CLI:** Version 1.5.1 located at `/home/safin313/.local/bin/arduino-cli`
- **Installed Cores:**
  - `esp32:esp32 3.3.12` (Complete Espressif ESP32 Core supporting original ESP32, ESP32-S2, ESP32-S3, ESP32-C3, ESP32-C6, ESP32-H2, ESP32-P4)
  - `arduino:esp32 2.0.18-arduino.5`
  - `arduino:avr 1.8.8`
- **Verified Installed Firmware Libraries:**
  - `Adafruit SSD1306` (v2.5.17)
  - `Adafruit MPU6050` (v2.2.9)
  - `Adafruit GFX Library` (v1.12.6)
  - `Adafruit BusIO` (v1.17.4)
  - `Adafruit Unified Sensor` (v1.1.15)
  - `Adafruit SH110X` (v2.1.15)
  - `ESP8266Audio` (v2.4.1) & `ESP8266SAM` (v1.1.0)
  - `U8g2` (v2.36.19)
  - `ArduinoJson` (v7.4.3)
- **Flashing & Binary Utilities:**
  - `esptool v5.3.1` located at `/home/safin313/.arduino15/packages/esp32/tools/esptool_py/5.3.1/esptool`
- **Compilation Proof of Concept:**
  - Successfully compiled a multi-file ESP32 sketch for target `esp32:esp32:esp32doit-devkit-v1` producing real ELF, binary, and 4 MB merged flash images.
- **Docker & Root Status:**
  - Docker is not installed on the host. Sudo access is restricted.
  - Therefore, all services, compilers, and emulators run natively in non-root user space.

---

## 2. Upstream Candidate Evaluation (`velxio`)
The repository `https://github.com/davidmonterocrespo24/velxio` was evaluated:
- **Licensing:** AGPLv3 with a dual commercial license model (`COMMERCIAL_LICENSE.md`). Upstream requires CLA signatures for contributions.
- **Upstream Execution Architecture:**
  - Relies on gated binary downloads from `velxio.dev` requiring proprietary license keys for `libqemu-xtensa.so` (Xtensa LX6/LX7 emulation).
  - Web client implements an in-browser RISC-V RV32IMC core (`RiscVCore.ts` / `Esp32C3Simulator.ts`) and AVR8 (`avr8js`).
- **RoboLab Strategy:**
  - RoboLab implements a clean, decoupled architecture:
    1. **Real Toolchain Backend:** Python FastAPI microservice providing isolated sketch building via system `arduino-cli` with verified cores and libraries.
    2. **Multi-Mode Execution Pipeline:**
       - **Mode A (Firmware Emulation):** Compiled binaries run through the compatible execution runtime with bi-directional WebSocket streaming for UART Serial, GPIO state transitions, and bus traffic.
       - **Mode B (Deterministic Peripheral Simulation):** Direct firmware-to-peripheral execution loop where virtual electronic component models (OLED, MPU6050, Button, Touch, Buzzer, Audio, Battery) decode communication registers and respond in real-time.
       - **Mode C (Educational Logic Demonstration):** Clearly labeled instructional verification for logic demonstrations when full hardware emulation is bypassed.
    3. **Robust Circuit & Electrical Validation Engine:**
       - Netlist builder with union-find net membership.
       - Independent Electrical Rules Check (ERC) detecting shorts, floating inputs, strapping pin violations, I2C address collisions, missing pull-ups, and power budget overloads.

---

## 3. Subsystem Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                      RoboLab Workspace UI                       │
│  ┌───────────────┐ ┌──────────────────────────┐ ┌────────────┐  │
│  │ Component &   │ │ Interactive Circuit      │ │ Inspector  │  │
│  │ Board Library │ │ Schematic & Netlist View │ │ & Live Dials│  │
│  └───────────────┘ └──────────────────────────┘ └────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Monaco Multi-File Editor | Serial Monitor | Instruments   │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────┬───────────────────────────────▲────────────────┘
                 │ Compile Request / Code        │ Real-time Events
                 ▼                               │ (GPIO, Serial, Bus)
┌─────────────────────────────────┐ ┌────────────┴────────────────┐
│      RoboLab Backend Service    │ │    Client Simulation Core   │
│  - FastAPI REST + WebSocket API │ │  - Netlist & Circuit Graph  │
│  - Sandbox Compiler Service     │ │  - Electrical ERC Engine    │
│  - Arduino CLI Runner           │ │  - SSD1306 Framebuffer Model│
│  - ELF / BIN / Flash Generator  │ │  - MPU6050 6-Axis Register  │
│  - Board & Library Explorer     │ │  - Web Audio Synthesizer    │
│  - Session Health & Telemetry   │ │  - TP4056 / Battery Engine  │
└─────────────────────────────────┘ └─────────────────────────────┘
```
