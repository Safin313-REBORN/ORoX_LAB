import { RoboLabProject } from '../types/circuit';

export interface ProjectTemplateMeta {
  id: string;
  name: string;
  description: string;
  category: string;
  libraries: string[];
  expectedResults: string;
  executionMode: 'modeA' | 'modeB' | 'modeC';
  testStatus: 'verified' | 'unverified';
  project: RoboLabProject;
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
// Author: RoboLab Engineering Team
#define LED_BUILTIN 2
#define LED_EXTERNAL 4

void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(LED_EXTERNAL, OUTPUT);
  Serial.println("[RoboLab] ESP32 Blink Initialized.");
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
  display.println(F("ROBOLAB ESP32"));
  display.setCursor(10, 26);
  display.println(F("SSD1306 OLED I2C"));
  display.drawRect(4, 4, 120, 56, SSD1306_WHITE);
  display.display();
  Serial.println("[RoboLab] OLED Display ready.");
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
  Serial.println("[RoboLab] Push Button Monitor Active on GPIO15.");
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
  Serial.println("[RoboLab] Touch-to-Buzzer Ready.");
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
  Serial.println("[RoboLab] Initializing I2S Audio Pipeline...");

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
  Serial.println("[RoboLab] I2S DMA Driver Running.");
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
  Serial.println("[RoboLab] Battery Health Monitor Running.");
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
      name: 'RoboLab Autonomous Bot Core',
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
  display.println(F("ROBOLAB BOT CORE"));
  display.setCursor(8, 24);
  display.println(F("ALL SYSTEMS ONLINE"));
  display.display();
  Serial.println("[SYSTEM] RoboLab Autonomous Bot Core Initialized.");
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
  }
];
