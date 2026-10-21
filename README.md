# RoboLab — Virtual Robotics & Embedded Systems Studio

> **Professional ESP32 Robotics, Electronics, and Firmware Simulation Platform**

RoboLab is an integrated, browser-based embedded systems engineering environment. Users can construct virtual circuits, configure development boards, write C++ firmware, compile source code against actual microcontroller toolchains, execute simulated hardware, and inspect real-time pin transitions, I2C bus packets, audio signals, and electrical net behaviors.

---

## 1. System Architecture

RoboLab separates processor and peripheral simulation into distinct, robust layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        RoboLab Engineering UI                          │
│ ┌──────────────────┐ ┌───────────────────────────┐ ┌─────────────────┐ │
│ │ Component Library│ │ Interactive Circuit Canvas│ │ Properties &    │ │
│ │ & Board Catalog  │ │ (Netlist, Pins, Wires)    │ │ Live Dials      │ │
│ └──────────────────┘ └───────────────────────────┘ └─────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Monaco Multi-File Editor | Serial Monitor | Logic Analyzer | ERC   │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└───────────────────┬───────────────────────────────▲────────────────────┘
                    │ REST /compile                 │ Telemetry & Events
                    ▼                               │ (GPIO, Serial, Bus)
┌─────────────────────────────────────────┐ ┌───────┴────────────────────┐
│         RoboLab Backend Service         │ │    Simulation Engine Core  │
│ - FastAPI + Uvicorn Async Server        │ │ - Union-Find Netlist Graph │
│ - Sandboxed arduino-cli Builder         │ │ - Electrical ERC Engine    │
│ - GCC/Clang Diagnostic Parser           │ │ - SSD1306 Framebuffer (I2C)│
│ - ELF/BIN/Flash Image Generator         │ │ - MPU6050 6-Axis Register  │
│ - WebSocket Session Manager             │ │ - Web Audio Synthesizer    │
│ - Target: esp32:esp32:esp32doit-devkit  │ │ - TP4056 Battery Subsystem │
└─────────────────────────────────────────┘ └────────────────────────────┘
```

### Execution Modes
- **Mode A (Firmware Emulation):** Compiled firmware artifacts execute on a compatible emulation runtime. Connected devices receive supported pin and bus events over WebSockets.
- **Mode B (Deterministic Peripheral Simulation):** Direct firmware-to-peripheral execution loop where virtual electronic component models (OLED, MPU6050, Button, Touch, Buzzer, Audio, Battery) decode communication registers and respond in real-time.
- **Mode C (Educational Logic Demonstration):** Clearly labeled instructional verification for logic demonstrations when full hardware emulation is bypassed.

---

## 2. Hardware & Component Compatibility Matrix

### Supported Microcontroller Boards
| Board Target | Chip Family | Architecture | FQBN | Support Status | Capabilities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DOIT ESP32 DevKit V1** | ESP32 | Dual-Core Xtensa LX6 (240MHz) | `esp32:esp32:esp32doit-devkit-v1` | **Fully Tested** | GPIO, ADC1/2, DAC, Touch, I2C, SPI, UART, I2S, PWM |
| **ESP32-S3 DevKitC-1** | ESP32-S3 | Dual-Core Xtensa LX7 (240MHz) | `esp32:esp32:esp32s3` | **Partially Supported** | Vector instructions, USB-OTG, I2C, SPI, PWM (No DAC) |
| **ESP32-C3 DevKitM-1** | ESP32-C3 | Single-Core RISC-V RV32IMC (160MHz) | `esp32:esp32:esp32c3` | **Fully Tested** | Native & browser RV32 core, I2C, SPI, UART |
| **AI Thinker ESP32-CAM** | ESP32 | Xtensa LX6 + OV2640 | `esp32:esp32:esp32cam` | **Partially Supported** | Camera interface, PSRAM, GPIO |
| **ESP32-C6 DevKitC-1** | ESP32-C6 | RISC-V 32-bit HP+LP | `esp32:esp32:esp32c6` | **Compile-Only** | Real toolchain build supported |
| **ESP32-H2 DevKitM-1** | ESP32-H2 | RISC-V 32-bit | `esp32:esp32:esp32h2` | **Compile-Only** | Low-power BLE / Zigbee target |
| **ESP32-P4 High-Perf** | ESP32-P4 | Dual-Core RISC-V (400MHz) | `esp32:esp32:esp32p4` | **Definition Available**| High-performance multimedia chip |

### Virtual Electronics & Robotics Components
| Component | Interface / Pins | Physical Model Details | Verification Status |
| :--- | :--- | :--- | :--- |
| **SSD1306 OLED (128x64)** | I2C (`0x3C`/`0x3D`) | Solomon Systech SSD1306 command set (Page, Horizontal, Vertical addressing, contrast, inversion, 1024-byte framebuffer rasterizer). | **Verified** |
| **MPU6050 6-Axis IMU** | I2C (`0x68`/`0x69`) | InvenSense MPU-6050 register map (`WHO_AM_I`, `PWR_MGMT_1`, `ACCEL_X/Y/Z`, `GYRO_X/Y/Z`, `TEMP`). Gravitational vector projection at $\pm 2g$ (16384 LSB/g). | **Verified** |
| **Tactile Push Button** | Passive (2 pins) | Digital momentary contact with configurable pull-up/pull-down resistor model and click feedback. | **Verified** |
| **TTP223 Capacitive Touch** | VCC, GND, I/O | Active-high digital touch switch with touch glow and GPIO interrupt triggering. | **Verified** |
| **Active Buzzer** | POS (+), NEG (-) | Fixed ~2.3kHz alarm oscillator driven by logic HIGH, synthesized via browser Web Audio API. | **Verified** |
| **Passive Buzzer** | POS (+), NEG (-) | Dynamic variable-frequency oscillator reproducing PWM duty cycles and musical pitches. | **Verified** |
| **MAX98357A I2S Amplifier** | LRC, BCLK, DIN, VIN, GND | Mono Class-D I2S DAC amplifier with live VU meter and Web Audio audio stream synthesis. | **Verified** |
| **Li-ion Battery & TP4056** | IN+, IN-, B+, B-, OUT+, OUT- | Physical CC/CV battery charging curves (1000mA CC, 4.2V CV, Trickle), OCV discharge table, DW01 2.4V cut-off protection. | **Verified** |
| **Discrete 5mm LED** | Anode, Cathode | Forward voltage modeling with dynamic radial illumination glow. | **Verified** |
| **Resistor** | Terminals 1 & 2 | Standard 4-band color-coded through-hole resistor. | **Verified** |

---

## 3. Quick Start & Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- `arduino-cli` with `esp32:esp32` core installed (version 3.3.12 verified)

### 1. Launch Backend API Service
```bash
cd /home/safin313/.gemini/antigravity-ide/scratch/robolab/backend
# Activate virtual environment
source venv/bin/activate
# Run Uvicorn server on port 8000
PYTHONPATH=. uvicorn app.main:app --port 8000 --host 0.0.0.0
```
- API root: `http://localhost:8000/`
- API documentation: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### 2. Launch Frontend Studio
```bash
cd /home/safin313/.gemini/antigravity-ide/scratch/robolab/frontend
# Start Vite development server
npm run dev
```
- Studio interface: `http://localhost:5173/`

---

## 4. Automated Test Results

### Backend Pytest Suite
```
tests/test_backend.py::test_root_endpoint PASSED              [ 20%]
tests/test_backend.py::test_health_endpoint PASSED            [ 40%]
tests/test_backend.py::test_boards_endpoint PASSED            [ 60%]
tests/test_backend.py::test_compile_valid_sketch PASSED       [ 80%]
tests/test_backend.py::test_compile_invalid_sketch_syntax PASSED [100%]
============================== 5 passed in 12.77s ==============================
```

### Frontend Vitest Suite
```
✓ src/test/circuit_and_erc.test.ts (5 tests)
  - correctly groups pins into electrical nets via Union-Find
  - detects a dead short circuit between VCC and GND
  - detects unpowered active ICs missing VCC or GND connections
  - detects I2C address collisions when two devices share the same 7-bit address
  - passes ERC with valid wiring on Project 1 (ESP32 Blink)

✓ src/test/component_models.test.ts (9 tests)
  - SSD1306: initializes with a clean 1024-byte framebuffer for 128x64 pixels
  - SSD1306: sets and clears individual pixels correctly
  - SSD1306: renders ASCII text characters into framebuffer memory
  - MPU6050: returns 0x68 on WHO_AM_I register (0x75)
  - MPU6050: updates raw 16-bit accelerometer registers according to pitch and roll
  - Battery: estimates State of Charge (SoC) across typical OCV curve
  - Battery: operates in Constant Current (CC) charging mode when cell voltage < 4.18V
  - Battery: transitions to DONE mode when fully charged to 4.2V
  - Starter Projects: includes all 8 mandatory starter projects with complete schemas

Test Files: 2 passed (2)
Tests: 14 passed (14)
Duration: 1.11s
```

---

## 5. Verified Starter Demonstration Projects

1. **ESP32 Blink (`p1_esp32_blink`):**
   - Circuit: DOIT ESP32 DevKit V1 + external 5mm Red LED + 220Ω current-limiting resistor to GND.
   - Code: Exercises `pinMode()`, `digitalWrite(LED_BUILTIN, HIGH)`, `delay(500)`.
   - Verified result: Built-in blue LED and external red LED alternate states; Logic analyzer traces GPIO2.

2. **OLED Hello World (`p2_oled_hello`):**
   - Circuit: ESP32 + SSD1306 128x64 OLED wired over hardware I2C (SDA GPIO21, SCL GPIO22, 3V3, GND).
   - Code: Uses `Adafruit_SSD1306.h` and `Adafruit_GFX.h`.
   - Verified result: Framebuffer rasterizes graphic rectangle and text headers onto display surface.

3. **Push-Button Status Display (`p3_button_status`):**
   - Circuit: ESP32 + Momentary Push Button on GPIO15 (internal `INPUT_PULLUP`) + SSD1306 OLED.
   - Verified result: Clicking button toggles input state; Serial monitor and OLED display update status.

4. **MPU6050 Live 6-Axis Dashboard (`p4_mpu6050_dashboard`):**
   - Circuit: ESP32 + MPU6050 IMU + SSD1306 OLED on shared I2C bus.
   - Verified result: Pitch, roll, and yaw sliders dynamically project gravity vector onto registers and update display.

5. **Touch-Controlled Buzzer (`p5_touch_buzzer`):**
   - Circuit: ESP32 + TTP223 Capacitive Touch Module (GPIO4) + Passive Piezo Buzzer (GPIO25).
   - Verified result: Touching sensor triggers GPIO interrupt and sounds synthesized 1.5kHz tone via Web Audio API.

6. **MAX98357A I2S Audio Synthesizer (`p6_max98357a_audio`):**
   - Circuit: ESP32 + MAX98357A I2S Audio Amplifier (BCLK GPIO26, LRC GPIO25, DIN GPIO22, VIN 5V, GND).
   - Verified result: DMA I2S stream generated; live VU meter and audible Web Audio preview.

7. **Battery & TP4056 Monitor (`p7_battery_monitor`):**
   - Circuit: ESP32 + TP4056 Charging Board + Li-ion cell (GPIO34 ADC1 input).
   - Verified result: Live terminal voltage and SoC % sampled and reported over Serial.

8. **Combined Robotics Dashboard (`p8_combined_robotics`):**
   - Circuit: Full robotics suite (ESP32 + OLED + MPU6050 + E-Stop Button + Touch Sensor + Buzzer + Battery Pack).
   - Verified result: Integrated multi-sensor system running with 0 electrical rule errors.

---

## 6. Upstream Evaluation & Legal Attribution

- RoboLab evaluated `https://github.com/davidmonterocrespo24/velxio` as candidate baseline:
  - Upstream project is dual-licensed under AGPL-3.0 and a commercial license.
  - Upstream Xtensa emulation relies on gated binary downloads requiring proprietary licenses.
  - RoboLab implements an isolated, reproducible architecture:
    * Native asynchronous toolchain compilation wrapper via system `arduino-cli`.
    * Client-side deterministic peripheral and register modeling for immediate interactivity.
    * Decoupled WebSocket execution bridge.

---

## 7. Next Engineering Milestones
- **Multi-Board Co-Simulation:** Synchronized simulation of two ESP32 microcontrollers communicating over ESP-NOW or UART.
- **Embedded Web Server Proxy:** Virtual Wi-Fi networking proxying HTTP requests to emulated ESP32 `WebServer` endpoints.
- **MicroPython WebREPL Integration:** Dynamic Python script execution on ESP32 MicroPython firmware.
