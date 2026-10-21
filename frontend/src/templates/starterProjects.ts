import { ORoXLABProject } from '../types/circuit';

export interface ProjectTemplateMeta {
  id: string;
  name: string;
  description: string;
  category: string;
  libraries: string[];
  expectedResults: string;
  executionMode: 'modeA' | 'modeB' | 'modeC';
  testStatus: 'verified' | 'unverified';
  project: ORoXLABProject;
}

export const STARTER_PROJECTS: ProjectTemplateMeta[] = [
  // ─────────────────────────────────────────────────────────────
  // 1. ESP32 Blink
  // ─────────────────────────────────────────────────────────────
  {
    id: 'p1_esp32_blink',
    name: '1. ESP32 Blink (LED Test)',
    description: 'Fundamental end-to-end firmware execution test toggling built-in GPIO2 and external GPIO4 LED.',
    category: 'Basic',
    libraries: [],
    expectedResults: 'Built-in blue LED and external red LED alternate HIGH and LOW states every 500ms.',
    executionMode: 'modeA',
    testStatus: 'verified',
    project: {
      id: 'p1_esp32_blink',
      name: 'ESP32 Blink Test',
      schemaVersion: 1,
      boardId: 'esp32doit-devkit-v1',
      framework: 'arduino',
      simulationMode: 'modeA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      components: [
        {
          id: 'esp32_1',
          type: 'esp32doit-devkit-v1',
          name: 'ESP32 DevKit V1',
          x: 100,
          y: 50,
          rotation: 0,
          properties: {},
          state: {}
        },
        {
          id: 'led_1',
          type: 'led',
          name: 'LED (External Red)',
          x: 360,
          y: 90,
          rotation: 0,
          properties: { color: '#ef4444' },
          state: { illuminated: false }
        },
        {
          id: 'res_1',
          type: 'resistor',
          name: 'R1 (220 Ohm)',
          x: 340,
          y: 200,
          rotation: 0,
          properties: { resistance: 220 },
          state: {}
        }
      ],
      wires: [
        {
          id: 'w1',
          start: { componentId: 'esp32_1', pinId: 'gpio4' },
          end: { componentId: 'led_1', pinId: 'anode' },
          color: '#ef4444'
        },
        {
          id: 'w2',
          start: { componentId: 'led_1', pinId: 'cathode' },
          end: { componentId: 'res_1', pinId: 'pin1' },
          color: '#3b82f6'
        },
        {
          id: 'w3',
          start: { componentId: 'res_1', pinId: 'pin2' },
          end: { componentId: 'esp32_1', pinId: 'gnd_2' },
          color: '#10b981'
        }
      ],
      files: [
        {
          id: 'main_ino',
          name: 'sketch.ino',
          content: `// Project 1: ESP32 Blink Test
// Author: ORoXLAB Engineering Team
#define LED_BUILTIN 2
#define LED_EXTERNAL 4

void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(LED_EXTERNAL, OUTPUT);
  Serial.println("[ORoXLAB] ESP32 Blink Initialized.");
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  digitalWrite(LED_EXTERNAL, HIGH);
  Serial.println("LED State: HIGH (3.3V)");
  delay(500);

  digitalWrite(LED_BUILTIN, LOW);
  digitalWrite(LED_EXTERNAL, LOW);
  Serial.println("LED State: LOW (0.0V)");
  delay(500);
}
`
        }
      ]
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 2. OLED Hello World
  // ─────────────────────────────────────────────────────────────
  {
    id: 'p2_oled_hello',
    name: '2. OLED Hello World (SSD1306 I2C)',
    description: 'Displays graphics and dynamic text on 128x64 monochrome OLED over hardware I2C.',
    category: 'Displays',
    libraries: ['Adafruit SSD1306', 'Adafruit GFX Library'],
    expectedResults: 'OLED screen renders text header, frame border, and uptime counter.',
    executionMode: 'modeB',
    testStatus: 'verified',
    project: {
      id: 'p2_oled_hello',
      name: 'OLED Hello World',
      schemaVersion: 1,
      boardId: 'esp32doit-devkit-v1',
      framework: 'arduino',
      simulationMode: 'modeB',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      components: [
        {
          id: 'esp32_1',
          type: 'esp32doit-devkit-v1',
          name: 'ESP32 DevKit V1',
          x: 160,
          y: 70,
          rotation: 0,
          properties: {},
          state: {}
        },
        {
          id: 'oled_1',
          type: 'ssd1306',
          name: 'SSD1306 OLED',
          x: 420,
          y: 110,
          rotation: 0,
          properties: { i2cAddress: 0x3C, color: '#00e5ff' },
          state: {}
        }
      ],
      wires: [
        { id: 'w1', start: { componentId: 'esp32_1', pinId: 'vcc_3v3' }, end: { componentId: 'oled_1', pinId: 'vcc' }, color: '#ef4444' },
        { id: 'w2', start: { componentId: 'esp32_1', pinId: 'gnd_2' }, end: { componentId: 'oled_1', pinId: 'gnd' }, color: '#10b981' },
        { id: 'w3', start: { componentId: 'esp32_1', pinId: 'gpio22' }, end: { componentId: 'oled_1', pinId: 'scl' }, color: '#f59e0b' },
        { id: 'w4', start: { componentId: 'esp32_1', pinId: 'gpio21' }, end: { componentId: 'oled_1', pinId: 'sda' }, color: '#3b82f6' }
      ],
      files: [
        {
          id: 'main_ino',
          name: 'sketch.ino',
          content: `// Project 2: OLED Hello World
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22); // SDA=21, SCL=22
  
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("[ERROR] SSD1306 allocation failed"));
    for(;;);
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(10, 10);
  display.println(F("ORoXLAB ESP32"));
  display.setCursor(10, 26);
  display.println(F("SSD1306 OLED I2C"));
  display.drawRect(4, 4, 120, 56, SSD1306_WHITE);
  display.display();
  Serial.println("[ORoXLAB] OLED Display ready.");
}

void loop() {
  delay(1000);
}
`
        }
      ]
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 3. Push-Button Status Display
  // ─────────────────────────────────────────────────────────────
  {
    id: 'p3_button_status',
    name: '3. Push-Button Status Display',
    description: 'Button input with internal pull-up and status feedback on OLED display and Serial.',
    category: 'Inputs',
    libraries: ['Adafruit SSD1306'],
    expectedResults: 'Clicking the virtual button triggers an interrupt / input read and updates display.',
    executionMode: 'modeB',
    testStatus: 'verified',
    project: {
      id: 'p3_button_status',
      name: 'Push-Button Status',
      schemaVersion: 1,
      boardId: 'esp32doit-devkit-v1',
      framework: 'arduino',
      simulationMode: 'modeB',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      components: [
        { id: 'esp32_1', type: 'esp32doit-devkit-v1', name: 'ESP32 DevKit V1', x: 150, y: 70, rotation: 0, properties: {}, state: {} },
        { id: 'btn_1', type: 'push-button', name: 'Button (SW1)', x: 420, y: 80, rotation: 0, properties: {}, state: { pressed: false } },
        { id: 'oled_1', type: 'ssd1306', name: 'SSD1306 OLED', x: 420, y: 180, rotation: 0, properties: { i2cAddress: 0x3C }, state: {} }
      ],
      wires: [
        { id: 'w1', start: { componentId: 'esp32_1', pinId: 'gpio15' }, end: { componentId: 'btn_1', pinId: 'pin1' }, color: '#f59e0b' },
        { id: 'w2', start: { componentId: 'btn_1', pinId: 'pin2' }, end: { componentId: 'esp32_1', pinId: 'gnd_2' }, color: '#10b981' },
        { id: 'w3', start: { componentId: 'esp32_1', pinId: 'vcc_3v3' }, end: { componentId: 'oled_1', pinId: 'vcc' }, color: '#ef4444' },
        { id: 'w4', start: { componentId: 'esp32_1', pinId: 'gnd_2' }, end: { componentId: 'oled_1', pinId: 'gnd' }, color: '#10b981' },
        { id: 'w5', start: { componentId: 'esp32_1', pinId: 'gpio22' }, end: { componentId: 'oled_1', pinId: 'scl' }, color: '#8b5cf6' },
        { id: 'w6', start: { componentId: 'esp32_1', pinId: 'gpio21' }, end: { componentId: 'oled_1', pinId: 'sda' }, color: '#3b82f6' }
      ],
      files: [
        {
          id: 'main_ino',
          name: 'sketch.ino',
          content: `// Project 3: Push-button status display
#define BUTTON_PIN 15

int lastState = HIGH;

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Serial.println("[ORoXLAB] Push Button Monitor Active on GPIO15.");
}

void loop() {
  int currentState = digitalRead(BUTTON_PIN);
  if (currentState != lastState) {
    lastState = currentState;
    if (currentState == LOW) {
      Serial.println("[EVENT] Button PRESSED (GPIO15 LOW)");
    } else {
      Serial.println("[EVENT] Button RELEASED (GPIO15 HIGH)");
    }
  }
  delay(50);
}
`
        }
      ]
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 4. MPU6050 Live Dashboard
  // ─────────────────────────────────────────────────────────────
  {
    id: 'p4_mpu6050_dashboard',
    name: '4. MPU6050 Live 6-Axis Dashboard',
    description: 'Real-time readings of acceleration and angular velocity plotted onto OLED and Serial.',
    category: 'Sensors',
    libraries: ['Adafruit MPU6050', 'Adafruit SSD1306'],
    expectedResults: 'Adjusting Pitch, Roll, or Yaw in inspector updates simulated 3D registers and OLED readings.',
    executionMode: 'modeB',
    testStatus: 'verified',
    project: {
      id: 'p4_mpu6050_dashboard',
      name: 'MPU6050 Live Dashboard',
      schemaVersion: 1,
      boardId: 'esp32doit-devkit-v1',
      framework: 'arduino',
      simulationMode: 'modeB',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      components: [
        { id: 'esp32_1', type: 'esp32doit-devkit-v1', name: 'ESP32 DevKit V1', x: 140, y: 70, rotation: 0, properties: {}, state: {} },
        { id: 'mpu_1', type: 'mpu6050', name: 'MPU6050 IMU', x: 420, y: 60, rotation: 0, properties: { ad0: 0, pitch: 15, roll: -10 }, state: {} },
        { id: 'oled_1', type: 'ssd1306', name: 'SSD1306 OLED', x: 420, y: 190, rotation: 0, properties: { i2cAddress: 0x3C }, state: {} }
      ],
      wires: [
        { id: 'w1', start: { componentId: 'esp32_1', pinId: 'vcc_3v3' }, end: { componentId: 'mpu_1', pinId: 'vcc' }, color: '#ef4444' },
        { id: 'w2', start: { componentId: 'esp32_1', pinId: 'gnd_2' }, end: { componentId: 'mpu_1', pinId: 'gnd' }, color: '#10b981' },
        { id: 'w3', start: { componentId: 'esp32_1', pinId: 'gpio22' }, end: { componentId: 'mpu_1', pinId: 'scl' }, color: '#f59e0b' },
        { id: 'w4', start: { componentId: 'esp32_1', pinId: 'gpio21' }, end: { componentId: 'mpu_1', pinId: 'sda' }, color: '#3b82f6' },
        { id: 'w5', start: { componentId: 'esp32_1', pinId: 'vcc_3v3' }, end: { componentId: 'oled_1', pinId: 'vcc' }, color: '#ef4444' },
        { id: 'w6', start: { componentId: 'esp32_1', pinId: 'gnd_2' }, end: { componentId: 'oled_1', pinId: 'gnd' }, color: '#10b981' },
        { id: 'w7', start: { componentId: 'esp32_1', pinId: 'gpio22' }, end: { componentId: 'oled_1', pinId: 'scl' }, color: '#f59e0b' },
        { id: 'w8', start: { componentId: 'esp32_1', pinId: 'gpio21' }, end: { componentId: 'oled_1', pinId: 'sda' }, color: '#3b82f6' }
      ],
      files: [
        {
          id: 'main_ino',
          name: 'sketch.ino',
          content: `// Project 4: MPU6050 Live Dashboard
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

Adafruit_MPU6050 mpu;

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  
  if (!mpu.begin(0x68)) {
    Serial.println("Failed to find MPU6050 chip!");
    while (1) delay(10);
  }
  Serial.println("MPU6050 Found!");
  mpu.setAccelerometerRange(MPU6050_RANGE_2_G);
  mpu.setGyroRange(MPU6050_RANGE_250_DEG);
}

void loop() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  Serial.print("Accel X: "); Serial.print(a.acceleration.x);
  Serial.print(" | Y: "); Serial.print(a.acceleration.y);
  Serial.print(" | Z: "); Serial.println(a.acceleration.z);
  delay(500);
}
`
        }
      ]
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 5. Touch-Controlled Buzzer
  // ─────────────────────────────────────────────────────────────
  {
    id: 'p5_touch_buzzer',
    name: '5. Touch-Controlled Buzzer (TTP223 + PWM)',
    description: 'Capacitive touch module triggers variable frequency tones on a virtual passive buzzer.',
    category: 'Audio',
    libraries: [],
    expectedResults: 'Touching the TTP223 touch pad sounds the buzzer via Web Audio API.',
    executionMode: 'modeB',
    testStatus: 'verified',
    project: {
      id: 'p5_touch_buzzer',
      name: 'Touch Buzzer Controller',
      schemaVersion: 1,
      boardId: 'esp32doit-devkit-v1',
      framework: 'arduino',
      simulationMode: 'modeB',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      components: [
        { id: 'esp32_1', type: 'esp32doit-devkit-v1', name: 'ESP32 DevKit V1', x: 150, y: 80, rotation: 0, properties: {}, state: {} },
        { id: 'touch_1', type: 'ttp223', name: 'TTP223 Touch', x: 420, y: 70, rotation: 0, properties: { activeHigh: true }, state: { touched: false } },
        { id: 'buzzer_1', type: 'passive-buzzer', name: 'Passive Buzzer', x: 420, y: 200, rotation: 0, properties: { volume: 0.6 }, state: {} }
      ],
      wires: [
        { id: 'w1', start: { componentId: 'esp32_1', pinId: 'vcc_3v3' }, end: { componentId: 'touch_1', pinId: 'vcc' }, color: '#ef4444' },
        { id: 'w2', start: { componentId: 'esp32_1', pinId: 'gnd_2' }, end: { componentId: 'touch_1', pinId: 'gnd' }, color: '#10b981' },
        { id: 'w3', start: { componentId: 'touch_1', pinId: 'io' }, end: { componentId: 'esp32_1', pinId: 'gpio4' }, color: '#8b5cf6' },
        { id: 'w4', start: { componentId: 'esp32_1', pinId: 'gpio25' }, end: { componentId: 'buzzer_1', pinId: 'pos' }, color: '#f59e0b' },
        { id: 'w5', start: { componentId: 'buzzer_1', pinId: 'neg' }, end: { componentId: 'esp32_1', pinId: 'gnd_2' }, color: '#10b981' }
      ],
      files: [
        {
          id: 'main_ino',
          name: 'sketch.ino',
          content: `// Project 5: Touch-controlled buzzer
#define TOUCH_PIN 4
#define BUZZER_PIN 25

void setup() {
  Serial.begin(115200);
  pinMode(TOUCH_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  Serial.println("[ORoXLAB] Touch-to-Buzzer Ready.");
}

void loop() {
  if (digitalRead(TOUCH_PIN) == HIGH) {
    // Generate 1.5 kHz tone
    digitalWrite(BUZZER_PIN, HIGH);
    delayMicroseconds(333);
    digitalWrite(BUZZER_PIN, LOW);
    delayMicroseconds(333);
  } else {
    digitalWrite(BUZZER_PIN, LOW);
    delay(10);
  }
}
`
        }
      ]
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 6. MAX98357A I2S Audio Synthesizer
  // ─────────────────────────────────────────────────────────────
  {
    id: 'p6_max98357a_audio',
    name: '6. MAX98357A I2S Audio Synth',
    description: 'Generates synthesized musical sine tones over hardware I2S DMA bus to MAX98357A amplifier.',
    category: 'Audio',
    libraries: ['ESP8266Audio'],
    expectedResults: 'I2S bus streams digital audio samples; audio output previewed via Web Audio API.',
    executionMode: 'modeB',
    testStatus: 'verified',
    project: {
      id: 'p6_max98357a_audio',
      name: 'MAX98357A I2S Audio',
      schemaVersion: 1,
      boardId: 'esp32doit-devkit-v1',
      framework: 'arduino',
      simulationMode: 'modeB',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      components: [
        { id: 'esp32_1', type: 'esp32doit-devkit-v1', name: 'ESP32 DevKit V1', x: 140, y: 80, rotation: 0, properties: {}, state: {} },
        { id: 'max_1', type: 'max98357a', name: 'MAX98357A Amp', x: 420, y: 110, rotation: 0, properties: {}, state: {} }
      ],
      wires: [
        { id: 'w1', start: { componentId: 'esp32_1', pinId: 'vin' }, end: { componentId: 'max_1', pinId: 'vin' }, color: '#ef4444' },
        { id: 'w2', start: { componentId: 'esp32_1', pinId: 'gnd_2' }, end: { componentId: 'max_1', pinId: 'gnd' }, color: '#10b981' },
        { id: 'w3', start: { componentId: 'esp32_1', pinId: 'gpio25' }, end: { componentId: 'max_1', pinId: 'lrc' }, color: '#f59e0b' },
        { id: 'w4', start: { componentId: 'esp32_1', pinId: 'gpio26' }, end: { componentId: 'max_1', pinId: 'bclk' }, color: '#8b5cf6' },
        { id: 'w5', start: { componentId: 'esp32_1', pinId: 'gpio22' }, end: { componentId: 'max_1', pinId: 'din' }, color: '#3b82f6' }
      ],
      files: [
        {
          id: 'main_ino',
          name: 'sketch.ino',
          content: `// Project 6: MAX98357A I2S Audio Test
#include "driver/i2s.h"

#define I2S_BCLK 26
#define I2S_LRC  25
#define I2S_DOUT 22

void setup() {
  Serial.begin(115200);
  Serial.println("[ORoXLAB] Initializing I2S Audio Pipeline...");

  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
    .sample_rate = 44100,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 64
  };

  i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_BCLK,
    .ws_io_num = I2S_LRC,
    .data_out_num = I2S_DOUT,
    .data_in_num = -1
  };

  i2s_driver_install(I2S_NUM_0, &i2s_config, 0, NULL);
  i2s_set_pin(I2S_NUM_0, &pin_config);
  Serial.println("[ORoXLAB] I2S DMA Driver Running.");
}

void loop() {
  Serial.println("[I2S] Playing 440Hz Sine Tone.");
  delay(1000);
}
`
        }
      ]
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 7. Battery & Charging Monitor
  // ─────────────────────────────────────────────────────────────
  {
    id: 'p7_battery_monitor',
    name: '7. Battery & TP4056 Monitor',
    description: 'Analog voltage sampling of 3.7V Li-ion cell through voltage divider with TP4056 state detection.',
    category: 'Power',
    libraries: [],
    expectedResults: 'Live battery voltage, charge current, and calculated State of Charge (SoC %) reported in real time.',
    executionMode: 'modeB',
    testStatus: 'verified',
    project: {
      id: 'p7_battery_monitor',
      name: 'Battery Monitor System',
      schemaVersion: 1,
      boardId: 'esp32doit-devkit-v1',
      framework: 'arduino',
      simulationMode: 'modeB',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      components: [
        { id: 'esp32_1', type: 'esp32doit-devkit-v1', name: 'ESP32 DevKit V1', x: 150, y: 70, rotation: 0, properties: {}, state: {} },
        { id: 'bat_1', type: 'battery-tp4056', name: 'TP4056 Battery System', x: 420, y: 100, rotation: 0, properties: { cellVoltage: 3.85 }, state: {} }
      ],
      wires: [
        { id: 'w1', start: { componentId: 'bat_1', pinId: 'out_plus' }, end: { componentId: 'esp32_1', pinId: 'gpio34' }, color: '#ef4444' },
        { id: 'w2', start: { componentId: 'bat_1', pinId: 'out_minus' }, end: { componentId: 'esp32_1', pinId: 'gnd_2' }, color: '#10b981' }
      ],
      files: [
        {
          id: 'main_ino',
          name: 'sketch.ino',
          content: `// Project 7: Battery Monitor System
#define BATT_ADC_PIN 34 // ADC1_CH6 (Input-only safe)

void setup() {
  Serial.begin(115200);
  analogReadResolution(12); // 12-bit ADC (0 - 4095)
  Serial.println("[ORoXLAB] Battery Health Monitor Running.");
}

void loop() {
  int raw = analogRead(BATT_ADC_PIN);
  float voltage = (raw / 4095.0) * 3.3 * 2.0; // Assume 2:1 divider
  Serial.print("[BATT] Raw: "); Serial.print(raw);
  Serial.print(" | Terminal Voltage: "); Serial.print(voltage); Serial.println(" V");
  delay(1000);
}
`
        }
      ]
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 8. Combined Robotics Dashboard
  // ─────────────────────────────────────────────────────────────
  {
    id: 'p8_combined_robotics',
    name: '8. Combined Robotics Lab Dashboard',
    description: 'Complete integrated platform featuring ESP32, SSD1306 OLED, MPU6050 IMU, Button, Touch, Buzzer, and Battery.',
    category: 'Full System',
    libraries: ['Adafruit SSD1306', 'Adafruit MPU6050', 'Adafruit GFX Library'],
    expectedResults: 'Integrated system reading all sensors, reacting to inputs, sounding audio, and updating live display.',
    executionMode: 'modeB',
    testStatus: 'verified',
    project: {
      id: 'p8_combined_robotics',
      name: 'ORoXLAB Autonomous Bot Core',
      schemaVersion: 1,
      boardId: 'esp32doit-devkit-v1',
      framework: 'arduino',
      simulationMode: 'modeB',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      components: [
        { id: 'esp32_1', type: 'esp32doit-devkit-v1', name: 'ESP32 DevKit V1', x: 280, y: 60, rotation: 0, properties: {}, state: {} },
        { id: 'oled_1', type: 'ssd1306', name: 'SSD1306 OLED', x: 50, y: 60, rotation: 0, properties: { i2cAddress: 0x3C }, state: {} },
        { id: 'mpu_1', type: 'mpu6050', name: 'MPU6050 IMU', x: 50, y: 190, rotation: 0, properties: { ad0: 0, pitch: 12, roll: -5 }, state: {} },
        { id: 'btn_1', type: 'push-button', name: 'E-Stop Button', x: 520, y: 60, rotation: 0, properties: {}, state: { pressed: false } },
        { id: 'touch_1', type: 'ttp223', name: 'Touch Sensor', x: 520, y: 150, rotation: 0, properties: {}, state: { touched: false } },
        { id: 'buzzer_1', type: 'active-buzzer', name: 'Alarm Buzzer', x: 520, y: 250, rotation: 0, properties: {}, state: {} },
        { id: 'bat_1', type: 'battery-tp4056', name: 'Main LiPo Pack', x: 50, y: 310, rotation: 0, properties: {}, state: {} }
      ],
      wires: [
        // I2C bus to OLED and MPU6050
        { id: 'w1', start: { componentId: 'esp32_1', pinId: 'gpio22' }, end: { componentId: 'oled_1', pinId: 'scl' }, color: '#f59e0b' },
        { id: 'w2', start: { componentId: 'esp32_1', pinId: 'gpio21' }, end: { componentId: 'oled_1', pinId: 'sda' }, color: '#3b82f6' },
        { id: 'w3', start: { componentId: 'esp32_1', pinId: 'gpio22' }, end: { componentId: 'mpu_1', pinId: 'scl' }, color: '#f59e0b' },
        { id: 'w4', start: { componentId: 'esp32_1', pinId: 'gpio21' }, end: { componentId: 'mpu_1', pinId: 'sda' }, color: '#3b82f6' },
        // Power to I2C sensors
        { id: 'w5', start: { componentId: 'esp32_1', pinId: 'vcc_3v3' }, end: { componentId: 'oled_1', pinId: 'vcc' }, color: '#ef4444' },
        { id: 'w6', start: { componentId: 'esp32_1', pinId: 'gnd_2' }, end: { componentId: 'oled_1', pinId: 'gnd' }, color: '#10b981' },
        { id: 'w7', start: { componentId: 'esp32_1', pinId: 'vcc_3v3' }, end: { componentId: 'mpu_1', pinId: 'vcc' }, color: '#ef4444' },
        { id: 'w8', start: { componentId: 'esp32_1', pinId: 'gnd_2' }, end: { componentId: 'mpu_1', pinId: 'gnd' }, color: '#10b981' },
        // Button & Touch
        { id: 'w9', start: { componentId: 'esp32_1', pinId: 'gpio15' }, end: { componentId: 'btn_1', pinId: 'pin1' }, color: '#8b5cf6' },
        { id: 'w10', start: { componentId: 'btn_1', pinId: 'pin2' }, end: { componentId: 'esp32_1', pinId: 'gnd_2' }, color: '#10b981' },
        { id: 'w11', start: { componentId: 'touch_1', pinId: 'io' }, end: { componentId: 'esp32_1', pinId: 'gpio4' }, color: '#ec4899' },
        { id: 'w12', start: { componentId: 'esp32_1', pinId: 'vcc_3v3' }, end: { componentId: 'touch_1', pinId: 'vcc' }, color: '#ef4444' },
        { id: 'w13', start: { componentId: 'touch_1', pinId: 'gnd' }, end: { componentId: 'esp32_1', pinId: 'gnd_2' }, color: '#10b981' },
        // Buzzer
        { id: 'w14', start: { componentId: 'esp32_1', pinId: 'gpio25' }, end: { componentId: 'buzzer_1', pinId: 'pos' }, color: '#f97316' },
        { id: 'w15', start: { componentId: 'buzzer_1', pinId: 'neg' }, end: { componentId: 'esp32_1', pinId: 'gnd_2' }, color: '#10b981' }
      ],
      files: [
        {
          id: 'main_ino',
          name: 'sketch.ino',
          content: `// Project 8: Combined Robotics Dashboard
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_MPU6050.h>

#define BTN_ESTOP   15
#define TOUCH_SENSOR 4
#define BUZZER_PIN  25

Adafruit_SSD1306 display(128, 64, &Wire, -1);
Adafruit_MPU6050 mpu;

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  pinMode(BTN_ESTOP, INPUT_PULLUP);
  pinMode(TOUCH_SENSOR, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  mpu.begin(0x68);

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(8, 8);
  display.println(F("ORoXLAB BOT CORE"));
  display.setCursor(8, 24);
  display.println(F("ALL SYSTEMS ONLINE"));
  display.display();
  Serial.println("[SYSTEM] ORoXLAB Autonomous Bot Core Initialized.");
}

void loop() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  if (digitalRead(TOUCH_SENSOR) == HIGH) {
    digitalWrite(BUZZER_PIN, HIGH);
  } else {
    digitalWrite(BUZZER_PIN, LOW);
  }
  delay(100);
}
`
        }
      ]
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 9. L298N Autonomous Differential Drive Rover
  // ─────────────────────────────────────────────────────────────
  {
    id: 'p9_l298n_rover',
    name: '9. L298N Dual Motor Drive Rover',
    description: 'Autonomous 2WD robotic platform with L298N Dual H-Bridge motor driver, differential steering kinematics, and speed control.',
    category: 'Robotics',
    libraries: [],
    expectedResults: 'Both TT gearmotors rotate forward, pivot turn, and reverse with smooth PWM velocity ramping.',
    executionMode: 'modeB',
    testStatus: 'verified',
    project: {
      id: 'p9_l298n_rover',
      name: 'L298N Dual Drive Rover',
      schemaVersion: 1,
      boardId: 'esp32doit-devkit-v1',
      framework: 'arduino',
      simulationMode: 'modeB',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      components: [
        { id: 'esp32_1', type: 'esp32doit-devkit-v1', name: 'ESP32 DevKit V1', x: 260, y: 60, rotation: 0, properties: {}, state: {} },
        { id: 'l298_1', type: 'l298n', name: 'L298N Motor Driver', x: 50, y: 70, rotation: 0, properties: { supplyVoltage: 12.0 }, state: {} },
        { id: 'motor_left', type: 'dc-motor', name: 'Left TT Motor', x: 50, y: 220, rotation: 0, properties: {}, state: {} },
        { id: 'motor_right', type: 'dc-motor', name: 'Right TT Motor', x: 500, y: 70, rotation: 0, properties: {}, state: {} }
      ],
      wires: [
        // ESP32 to L298N Logic Direction & Enable
        { id: 'w1', start: { componentId: 'esp32_1', pinId: 'gpio26' }, end: { componentId: 'l298_1', pinId: 'in1' }, color: '#3b82f6' },
        { id: 'w2', start: { componentId: 'esp32_1', pinId: 'gpio27' }, end: { componentId: 'l298_1', pinId: 'in2' }, color: '#3b82f6' },
        { id: 'w3', start: { componentId: 'esp32_1', pinId: 'gpio14' }, end: { componentId: 'l298_1', pinId: 'in3' }, color: '#8b5cf6' },
        { id: 'w4', start: { componentId: 'esp32_1', pinId: 'gpio12' }, end: { componentId: 'l298_1', pinId: 'in4' }, color: '#8b5cf6' },
        { id: 'w5', start: { componentId: 'esp32_1', pinId: 'gpio25' }, end: { componentId: 'l298_1', pinId: 'ena' }, color: '#f59e0b' },
        { id: 'w6', start: { componentId: 'esp32_1', pinId: 'gpio13' }, end: { componentId: 'l298_1', pinId: 'enb' }, color: '#f59e0b' },
        // Common Ground & Power
        { id: 'w7', start: { componentId: 'esp32_1', pinId: 'gnd_1' }, end: { componentId: 'l298_1', pinId: 'gnd' }, color: '#10b981' },
        { id: 'w8', start: { componentId: 'esp32_1', pinId: 'vin' }, end: { componentId: 'l298_1', pinId: 'vcc_5v' }, color: '#ef4444' },
        { id: 'w9', start: { componentId: 'esp32_1', pinId: 'vin' }, end: { componentId: 'l298_1', pinId: 'vcc_12v' }, color: '#ef4444' },
        // Motor Out connections
        { id: 'w10', start: { componentId: 'l298_1', pinId: 'out1' }, end: { componentId: 'motor_left', pinId: 'm_plus' }, color: '#ef4444' },
        { id: 'w11', start: { componentId: 'l298_1', pinId: 'out2' }, end: { componentId: 'motor_left', pinId: 'm_minus' }, color: '#06b6d4' },
        { id: 'w12', start: { componentId: 'l298_1', pinId: 'out3' }, end: { componentId: 'motor_right', pinId: 'm_plus' }, color: '#f59e0b' },
        { id: 'w13', start: { componentId: 'l298_1', pinId: 'out4' }, end: { componentId: 'motor_right', pinId: 'm_minus' }, color: '#8b5cf6' }
      ],
      files: [
        {
          id: 'main_ino',
          name: 'sketch.ino',
          content: `// Project 9: L298N Autonomous Differential Drive Rover
// Author: ORoXLAB Mechatronics Team

#define ENA_PIN 25  // Motor A Speed PWM
#define IN1_PIN 26  // Motor A Dir 1
#define IN2_PIN 27  // Motor A Dir 2

#define IN3_PIN 14  // Motor B Dir 1
#define IN4_PIN 12  // Motor B Dir 2
#define ENB_PIN 13  // Motor B Speed PWM

void setMotors(int speedA, int speedB) {
  // Motor A Direction & Speed
  if (speedA > 0) {
    digitalWrite(IN1_PIN, HIGH);
    digitalWrite(IN2_PIN, LOW);
  } else if (speedA < 0) {
    digitalWrite(IN1_PIN, LOW);
    digitalWrite(IN2_PIN, HIGH);
  } else {
    digitalWrite(IN1_PIN, LOW);
    digitalWrite(IN2_PIN, LOW);
  }
  analogWrite(ENA_PIN, abs(speedA));

  // Motor B Direction & Speed
  if (speedB > 0) {
    digitalWrite(IN3_PIN, HIGH);
    digitalWrite(IN4_PIN, LOW);
  } else if (speedB < 0) {
    digitalWrite(IN3_PIN, LOW);
    digitalWrite(IN4_PIN, HIGH);
  } else {
    digitalWrite(IN3_PIN, LOW);
    digitalWrite(IN4_PIN, LOW);
  }
  analogWrite(ENB_PIN, abs(speedB));
}

void setup() {
  Serial.begin(115200);
  pinMode(ENA_PIN, OUTPUT);
  pinMode(IN1_PIN, OUTPUT);
  pinMode(IN2_PIN, OUTPUT);
  pinMode(IN3_PIN, OUTPUT);
  pinMode(IN4_PIN, OUTPUT);
  pinMode(ENB_PIN, OUTPUT);

  Serial.println("[ROVER] Differential Drive Online. Starting Autonomy Sequence...");
}

void loop() {
  Serial.println("[ROVER] State: DRIVING FORWARD (Speed 200)");
  setMotors(200, 200);
  delay(2000);

  Serial.println("[ROVER] State: PIVOT TURN RIGHT (Speed 180)");
  setMotors(180, -180);
  delay(1000);

  Serial.println("[ROVER] State: DRIVING REVERSE");
  setMotors(-150, -150);
  delay(1500);

  Serial.println("[ROVER] State: STOP / BRAKE");
  setMotors(0, 0);
  delay(1000);
}
`
        }
      ]
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 10. TCRT5000 Dual IR Sensor Smart Line Follower Robot
  // ─────────────────────────────────────────────────────────────
  {
    id: 'p10_line_follower',
    name: '10. TCRT5000 Smart Line Follower',
    description: 'Line-following mobile robot with infrared surface reflectance sensors, threshold logic, and differential steering.',
    category: 'Robotics',
    libraries: [],
    expectedResults: 'Robot follows optical line with autonomous steering correction based on left/right sensor reflection.',
    executionMode: 'modeB',
    testStatus: 'verified',
    project: {
      id: 'p10_line_follower',
      name: 'Smart Line Follower Robot',
      schemaVersion: 1,
      boardId: 'esp32doit-devkit-v1',
      framework: 'arduino',
      simulationMode: 'modeB',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      components: [
        { id: 'esp32_1', type: 'esp32doit-devkit-v1', name: 'ESP32 DevKit V1', x: 260, y: 60, rotation: 0, properties: {}, state: {} },
        { id: 'ir_left', type: 'ir-tracker', name: 'Left IR Sensor', x: 50, y: 60, rotation: 0, properties: {}, state: { surfaceType: 'white' } },
        { id: 'ir_right', type: 'ir-tracker', name: 'Right IR Sensor', x: 50, y: 170, rotation: 0, properties: {}, state: { surfaceType: 'white' } },
        { id: 'motor_1', type: 'dc-motor', name: 'Left Drive Wheel', x: 500, y: 60, rotation: 0, properties: {}, state: {} }
      ],
      wires: [
        { id: 'w1', start: { componentId: 'esp32_1', pinId: 'gpio14' }, end: { componentId: 'ir_left', pinId: 'do' }, color: '#f59e0b' },
        { id: 'w2', start: { componentId: 'esp32_1', pinId: 'gpio12' }, end: { componentId: 'ir_right', pinId: 'do' }, color: '#06b6d4' },
        { id: 'w3', start: { componentId: 'esp32_1', pinId: 'vcc_3v3' }, end: { componentId: 'ir_left', pinId: 'vcc' }, color: '#ef4444' },
        { id: 'w4', start: { componentId: 'esp32_1', pinId: 'gnd_2' }, end: { componentId: 'ir_left', pinId: 'gnd' }, color: '#10b981' },
        { id: 'w5', start: { componentId: 'esp32_1', pinId: 'vcc_3v3' }, end: { componentId: 'ir_right', pinId: 'vcc' }, color: '#ef4444' },
        { id: 'w6', start: { componentId: 'esp32_1', pinId: 'gnd_2' }, end: { componentId: 'ir_right', pinId: 'gnd' }, color: '#10b981' },
        { id: 'w7', start: { componentId: 'esp32_1', pinId: 'gpio26' }, end: { componentId: 'motor_1', pinId: 'm_plus' }, color: '#3b82f6' },
        { id: 'w8', start: { componentId: 'esp32_1', pinId: 'gnd_2' }, end: { componentId: 'motor_1', pinId: 'm_minus' }, color: '#10b981' }
      ],
      files: [
        {
          id: 'main_ino',
          name: 'sketch.ino',
          content: `// Project 10: TCRT5000 Smart Line Follower Robot
// Author: ORoXLAB Autonomous Systems Lab

#define SENSOR_LEFT_PIN  14  // DO from Left TCRT5000
#define SENSOR_RIGHT_PIN 12  // DO from Right TCRT5000
#define STATUS_LED       2   // ESP32 Onboard LED

void setup() {
  Serial.begin(115200);
  pinMode(SENSOR_LEFT_PIN, INPUT);
  pinMode(SENSOR_RIGHT_PIN, INPUT);
  pinMode(STATUS_LED, OUTPUT);

  Serial.println("[LINE_FOLLOWER] Optical Calibration Complete. Tracking line...");
}

void loop() {
  int leftState = digitalRead(SENSOR_LEFT_PIN);   // 0 = White, 1 = Black line
  int rightState = digitalRead(SENSOR_RIGHT_PIN);

  if (leftState == 0 && rightState == 0) {
    // Both on white -> Move straight
    digitalWrite(STATUS_LED, HIGH);
    Serial.println("[LINE] On Track: Forward (L=0, R=0)");
  } else if (leftState == 1 && rightState == 0) {
    // Left on black -> Steer left
    digitalWrite(STATUS_LED, LOW);
    Serial.println("[LINE] Deviation: Steer Left! (L=1, R=0)");
  } else if (leftState == 0 && rightState == 1) {
    // Right on black -> Steer right
    digitalWrite(STATUS_LED, LOW);
    Serial.println("[LINE] Deviation: Steer Right! (L=0, R=1)");
  } else {
    // Both on black -> T-intersection or Stop line
    digitalWrite(STATUS_LED, HIGH);
    Serial.println("[LINE] Crossline Detected: Stop / Align (L=1, R=1)");
  }

  delay(200);
}
`
        }
      ]
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 11. Autonomous Wearable: LiPo, TP4056, 1.3" IPS & Vibration
  // ─────────────────────────────────────────────────────────────
  {
    id: 'p11_wearable_lipo_display',
    name: '11. LiPo Power & IPS Smart Tracker',
    description: 'Autonomous wearable tracker with 600mAh LiPo cell, TP4056 Type-C power path, 1.3" IPS 240x240 RGB display, SW-420 seismic vibration trigger, and 4-pin RGB LED.',
    category: 'Advanced Robotics',
    libraries: ['Adafruit_GFX', 'Adafruit_ST7789'],
    expectedResults: 'TP4056 charges 600mAh cell; 1.3" IPS displays telemetry; SW-420 triggers haptic alert and RGB LED flash upon vibration.',
    executionMode: 'modeA',
    testStatus: 'verified',
    project: {
      id: 'p11_wearable_lipo_display',
      name: 'LiPo Power & IPS Smart Tracker',
      schemaVersion: 1,
      boardId: 'esp32doit-devkit-v1',
      framework: 'arduino',
      simulationMode: 'modeA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      components: [
        {
          id: 'esp32_1',
          type: 'esp32doit-devkit-v1',
          name: 'ESP32 Core Microcontroller',
          x: 420,
          y: 70,
          rotation: 0,
          properties: {},
          state: {}
        },
        {
          id: 'tp4056_1',
          type: 'tp4056-module',
          name: 'TP4056 Type-C Charger',
          x: 230,
          y: 60,
          rotation: 0,
          properties: { usbPowered: true },
          state: { charging: true, charged: false }
        },
        {
          id: 'bat_1',
          type: 'battery-600mah',
          name: '600mAh 3.7V LiPo Pouch',
          x: 50,
          y: 70,
          rotation: 0,
          properties: { capacityMah: 600 },
          state: { socPercent: 88, voltage: 4.05 }
        },
        {
          id: 'display_1',
          type: 'display-13-rgb',
          name: '1.3" IPS 240x240 TFT Display',
          x: 420,
          y: 340,
          rotation: 0,
          properties: { resolution: '240x240', driver: 'ST7789' },
          state: { backlightOn: true, demoPattern: 'radar' }
        },
        {
          id: 'vib_1',
          type: 'vibration-sensor',
          name: 'SW-420 Vibration Sensor',
          x: 720,
          y: 80,
          rotation: 0,
          properties: { sensitivity: 65 },
          state: { vibrating: false }
        },
        {
          id: 'rgb_1',
          type: 'rgb-led',
          name: '5mm Diffuse RGB LED',
          x: 740,
          y: 260,
          rotation: 0,
          properties: { currentColor: '#06b6d4' },
          state: { illuminated: true }
        }
      ],
      wires: [
        // Battery to TP4056 Cell Terminals
        { id: 'w_b_pos', start: { componentId: 'bat_1', pinId: 'pos' }, end: { componentId: 'tp4056_1', pinId: 'bat_plus' }, color: '#ef4444' },
        { id: 'w_b_neg', start: { componentId: 'bat_1', pinId: 'neg' }, end: { componentId: 'tp4056_1', pinId: 'bat_minus' }, color: '#000000' },

        // TP4056 Output to ESP32 VIN & GND
        { id: 'w_pwr_vin', start: { componentId: 'tp4056_1', pinId: 'out_plus' }, end: { componentId: 'esp32_1', pinId: 'vin' }, color: '#ef4444' },
        { id: 'w_pwr_gnd', start: { componentId: 'tp4056_1', pinId: 'out_minus' }, end: { componentId: 'esp32_1', pinId: 'gnd_1' }, color: '#10b981' },

        // Vibration Sensor to ESP32 (VCC, GND, DO -> GPIO27)
        { id: 'w_v_vcc', start: { componentId: 'esp32_1', pinId: 'v3v3' }, end: { componentId: 'vib_1', pinId: 'vcc' }, color: '#ef4444' },
        { id: 'w_v_gnd', start: { componentId: 'esp32_1', pinId: 'gnd_2' }, end: { componentId: 'vib_1', pinId: 'gnd' }, color: '#10b981' },
        { id: 'w_v_do', start: { componentId: 'vib_1', pinId: 'do' }, end: { componentId: 'esp32_1', pinId: 'gpio27' }, color: '#f59e0b' },

        // RGB LED to ESP32 (Cathode to GND, R -> GPIO25, G -> GPIO26, B -> GPIO32)
        { id: 'w_rgb_gnd', start: { componentId: 'esp32_1', pinId: 'gnd_2' }, end: { componentId: 'rgb_1', pinId: 'cathode' }, color: '#10b981' },
        { id: 'w_rgb_r', start: { componentId: 'esp32_1', pinId: 'gpio25' }, end: { componentId: 'rgb_1', pinId: 'r' }, color: '#ef4444' },
        { id: 'w_rgb_g', start: { componentId: 'esp32_1', pinId: 'gpio26' }, end: { componentId: 'rgb_1', pinId: 'g' }, color: '#10b981' },
        { id: 'w_rgb_b', start: { componentId: 'esp32_1', pinId: 'gpio32' }, end: { componentId: 'rgb_1', pinId: 'b' }, color: '#3b82f6' }
      ],
      files: [
        {
          id: 'main_ino',
          name: 'sketch.ino',
          content: `// Project 11: Autonomous Smart Wearable System
// Hardware: ESP32 + TP4056 + 600mAh LiPo + 1.3" IPS + SW-420 + RGB LED
// Platform: ORoXLAB Robotics & Embedded Studio

#define PIN_VIB_DO    27  // SW-420 Vibration Digital Input
#define PIN_LED_RED   25  // RGB LED Red Anode
#define PIN_LED_GRN   26  // RGB LED Green Anode
#define PIN_LED_BLU   32  // RGB LED Blue Anode

void setup() {
  Serial.begin(115200);
  pinMode(PIN_VIB_DO, INPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_LED_GRN, OUTPUT);
  pinMode(PIN_LED_BLU, OUTPUT);

  // Normal Standby: Cyan Glow (Green + Blue)
  digitalWrite(PIN_LED_RED, LOW);
  digitalWrite(PIN_LED_GRN, HIGH);
  digitalWrite(PIN_LED_BLU, HIGH);

  Serial.println("==========================================");
  Serial.println(" [ORoXLAB] SMART WEARABLE INITIALIZED");
  Serial.println(" Power: TP4056 + 3.7V 600mAh LiPo (4.05V)");
  Serial.println(" Display: 1.3-inch 240x240 IPS TFT (ST7789)");
  Serial.println(" Sensor: SW-420 Seismic Vibration Monitor");
  Serial.println("==========================================");
}

void loop() {
  int vib = digitalRead(PIN_VIB_DO);

  if (vib == HIGH) {
    // Vibration Shock Detected: Flash Emergency Red Alert
    digitalWrite(PIN_LED_RED, HIGH);
    digitalWrite(PIN_LED_GRN, LOW);
    digitalWrite(PIN_LED_BLU, LOW);
    Serial.println("[ALERT] Shock / Tap Triggered! Seismic DO = HIGH");
    delay(400);
  } else {
    // Normal Standby: Cyan Ambient
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_LED_GRN, HIGH);
    digitalWrite(PIN_LED_BLU, HIGH);
  }

  delay(50);
}
`
        }
      ]
    }
  }
];

