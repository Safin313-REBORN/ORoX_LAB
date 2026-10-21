from typing import Dict, List, Any, Optional
from pydantic import BaseModel

class PinDefinition(BaseModel):
    pin_number: int
    name: str # e.g. "GPIO2", "3V3", "GND", "EN"
    physical_label: str
    gpio_num: Optional[int] = None
    capabilities: List[str] # ["GPIO", "ADC1", "ADC2", "DAC", "PWM", "TOUCH", "I2C_SDA", "I2C_SCL", "SPI_MOSI", "SPI_MISO", "SPI_SCK", "UART_TX", "UART_RX", "I2S_BCLK", "I2S_LRC", "I2S_DOUT"]
    is_input_only: bool = False
    is_strapping: bool = False
    is_flash_reserved: bool = False
    description: str = ""

class BoardProfile(BaseModel):
    id: str
    name: str
    manufacturer: str
    chip_family: str # "ESP32", "ESP32-S2", "ESP32-S3", "ESP32-C3", "ESP32-C6", "ESP32-H2", "ESP32-P4"
    module: str # "ESP-WROOM-32", "ESP32-WROVER", "ESP32-S3-WROOM-1", etc.
    fqbn: str
    support_status: str # "fully_tested", "partially_supported", "compile_only", "definition_available"
    voltage_operating: float = 3.3
    flash_size_mb: int = 4
    has_psram: bool = False
    builtin_led_gpio: Optional[int] = None
    builtin_button_gpio: Optional[int] = None
    default_i2c: Dict[str, int] = {"sda": 21, "scl": 22}
    default_spi: Dict[str, int] = {"mosi": 23, "miso": 19, "sck": 18, "cs": 5}
    default_uart: Dict[str, int] = {"tx": 1, "rx": 3}
    default_i2s: Dict[str, int] = {"bclk": 26, "lrc": 25, "dout": 22}
    dac_channels: List[int] = []
    adc_channels: Dict[str, List[int]] = {"adc1": [], "adc2": []}
    strapping_pins: List[int] = []
    input_only_pins: List[int] = []
    flash_reserved_pins: List[int] = []
    pins: List[PinDefinition]
    description: str

def get_esp32_devkit_v1_pins() -> List[PinDefinition]:
    """DOIT ESP32 DEVKIT V1 30-pin / 36-pin layout."""
    # Standard 30-pin DOIT ESP32 DevKit V1
    raw = [
        # Left side
        (1, "EN", "EN", None, ["RESET"], False, False, False, "Chip Enable / Reset"),
        (2, "GPIO36", "VP", 36, ["GPIO", "ADC1"], True, False, False, "ADC1_CH0, RTC_GPIO0 (Input only)"),
        (3, "GPIO39", "VN", 39, ["GPIO", "ADC1"], True, False, False, "ADC1_CH3, RTC_GPIO3 (Input only)"),
        (4, "GPIO34", "D34", 34, ["GPIO", "ADC1"], True, False, False, "ADC1_CH6, RTC_GPIO4 (Input only)"),
        (5, "GPIO35", "D35", 35, ["GPIO", "ADC1"], True, False, False, "ADC1_CH7, RTC_GPIO5 (Input only)"),
        (6, "GPIO32", "D32", 32, ["GPIO", "ADC1", "TOUCH", "PWM"], False, False, False, "ADC1_CH4, TOUCH9"),
        (7, "GPIO33", "D33", 33, ["GPIO", "ADC1", "TOUCH", "PWM"], False, False, False, "ADC1_CH5, TOUCH8"),
        (8, "GPIO25", "D25", 25, ["GPIO", "ADC2", "DAC", "PWM", "I2S_LRC"], False, False, False, "DAC1, ADC2_CH8"),
        (9, "GPIO26", "D26", 26, ["GPIO", "ADC2", "DAC", "PWM", "I2S_BCLK"], False, False, False, "DAC2, ADC2_CH9"),
        (10, "GPIO27", "D27", 27, ["GPIO", "ADC2", "TOUCH", "PWM"], False, False, False, "ADC2_CH7, TOUCH7"),
        (11, "GPIO14", "D14", 14, ["GPIO", "ADC2", "TOUCH", "PWM", "SPI_SCK"], False, False, False, "HSPI_CLK, ADC2_CH6"),
        (12, "GPIO12", "D12", 12, ["GPIO", "ADC2", "TOUCH", "PWM", "SPI_MISO"], False, True, False, "MTDI strapping pin, HSPI_MISO"),
        (13, "GPIO13", "D13", 13, ["GPIO", "ADC2", "TOUCH", "PWM", "SPI_MOSI"], False, False, False, "HSPI_MOSI, ADC2_CH4"),
        (14, "GND", "GND", None, ["GROUND"], False, False, False, "Power Ground"),
        (15, "VIN", "VIN", None, ["POWER_IN"], False, False, False, "5V External Input"),
        
        # Right side
        (16, "GPIO23", "D23", 23, ["GPIO", "PWM", "SPI_MOSI"], False, False, False, "VSPI_MOSI"),
        (17, "GPIO22", "D22", 22, ["GPIO", "PWM", "I2C_SCL"], False, False, False, "Default Wire I2C SCL"),
        (18, "GPIO1", "TX0", 1, ["GPIO", "UART_TX"], False, False, False, "UART0 TX / Serial Monitor"),
        (19, "GPIO3", "RX0", 3, ["GPIO", "UART_RX"], False, False, False, "UART0 RX / Serial Monitor"),
        (20, "GPIO21", "D21", 21, ["GPIO", "PWM", "I2C_SDA"], False, False, False, "Default Wire I2C SDA"),
        (21, "GPIO19", "D19", 19, ["GPIO", "PWM", "SPI_MISO"], False, False, False, "VSPI_MISO"),
        (22, "GPIO18", "D18", 18, ["GPIO", "PWM", "SPI_SCK"], False, False, False, "VSPI_CLK"),
        (23, "GPIO5", "D5", 5, ["GPIO", "PWM", "SPI_CS"], False, True, False, "VSPI_CS, Boot strapping"),
        (24, "GPIO4", "D4", 4, ["GPIO", "ADC2", "TOUCH", "PWM"], False, False, False, "ADC2_CH0, TOUCH0"),
        (25, "GPIO0", "D0", 0, ["GPIO", "ADC2", "TOUCH", "PWM"], False, True, False, "Boot mode strapping (pull-up for normal boot)"),
        (26, "GPIO2", "D2", 2, ["GPIO", "ADC2", "TOUCH", "PWM"], False, True, False, "Built-in LED, Boot strapping"),
        (27, "GPIO15", "D15", 15, ["GPIO", "ADC2", "TOUCH", "PWM"], False, True, False, "MTDO strapping pin"),
        (28, "GPIO8", "SD1", 8, ["FLASH"], False, False, True, "Connected to SPI Flash (Do not use)"),
        (29, "GPIO7", "SD0", 7, ["FLASH"], False, False, True, "Connected to SPI Flash (Do not use)"),
        (30, "GPIO6", "CLK", 6, ["FLASH"], False, False, True, "Connected to SPI Flash (Do not use)"),
        (31, "3V3", "3V3", None, ["POWER_OUT"], False, False, False, "Regulated 3.3V Output (max 500mA)"),
    ]

    return [
        PinDefinition(
            pin_number=item[0],
            name=item[1],
            physical_label=item[2],
            gpio_num=item[3],
            capabilities=item[4],
            is_input_only=item[5],
            is_strapping=item[6],
            is_flash_reserved=item[7],
            description=item[8]
        )
        for item in raw
    ]

BOARD_REGISTRY: Dict[str, BoardProfile] = {
    "esp32doit-devkit-v1": BoardProfile(
        id="esp32doit-devkit-v1",
        name="ESP32 DevKit V1 (DOIT)",
        manufacturer="DOIT / Espressif",
        chip_family="ESP32",
        module="ESP-WROOM-32",
        fqbn="esp32:esp32:esp32doit-devkit-v1",
        support_status="fully_tested",
        voltage_operating=3.3,
        flash_size_mb=4,
        has_psram=False,
        builtin_led_gpio=2,
        builtin_button_gpio=0,
        default_i2c={"sda": 21, "scl": 22},
        default_spi={"mosi": 23, "miso": 19, "sck": 18, "cs": 5},
        default_uart={"tx": 1, "rx": 3},
        default_i2s={"bclk": 26, "lrc": 25, "dout": 22},
        dac_channels=[25, 26],
        adc_channels={
            "adc1": [36, 37, 38, 39, 32, 33, 34, 35],
            "adc2": [4, 0, 2, 15, 13, 12, 14, 27, 25, 26] # Note: ADC2 unavailable when Wi-Fi is active
        },
        strapping_pins=[0, 2, 5, 12, 15],
        input_only_pins=[34, 35, 36, 39],
        flash_reserved_pins=[6, 7, 8, 9, 10, 11],
        pins=get_esp32_devkit_v1_pins(),
        description="The primary target board for RoboLab. Xtensa dual-core 32-bit LX6 microprocessor, 240MHz, 520KB SRAM, complete peripheral suite."
    ),
    "esp32cam": BoardProfile(
        id="esp32cam",
        name="AI Thinker ESP32-CAM",
        manufacturer="AI Thinker",
        chip_family="ESP32",
        module="ESP32-S",
        fqbn="esp32:esp32:esp32cam",
        support_status="partially_supported",
        voltage_operating=3.3,
        flash_size_mb=4,
        has_psram=True,
        builtin_led_gpio=33,
        default_i2c={"sda": 26, "scl": 27},
        pins=[],
        description="ESP32 with OV2640 camera interface and external PSRAM."
    ),
    "esp32s3": BoardProfile(
        id="esp32s3",
        name="ESP32-S3 DevKitC-1",
        manufacturer="Espressif",
        chip_family="ESP32-S3",
        module="ESP32-S3-WROOM-1",
        fqbn="esp32:esp32:esp32s3",
        support_status="partially_supported",
        voltage_operating=3.3,
        flash_size_mb=8,
        has_psram=True,
        builtin_led_gpio=48, # RGB WS2812
        default_i2c={"sda": 8, "scl": 9},
        default_spi={"mosi": 11, "miso": 13, "sck": 12, "cs": 10},
        default_uart={"tx": 43, "rx": 44},
        dac_channels=[], # S3 has no DAC!
        pins=[],
        description="Xtensa dual-core 32-bit LX7, vector instructions for AI acceleration, native USB OTG."
    ),
    "esp32c3": BoardProfile(
        id="esp32c3",
        name="ESP32-C3 DevKitM-1",
        manufacturer="Espressif",
        chip_family="ESP32-C3",
        module="ESP32-C3-MINI-1",
        fqbn="esp32:esp32:esp32c3",
        support_status="fully_tested",
        voltage_operating=3.3,
        flash_size_mb=4,
        has_psram=False,
        builtin_led_gpio=8,
        default_i2c={"sda": 8, "scl": 9},
        default_spi={"mosi": 6, "miso": 5, "sck": 4, "cs": 7},
        default_uart={"tx": 21, "rx": 20},
        dac_channels=[], # C3 has no DAC!
        pins=[],
        description="Single-core 32-bit RISC-V RV32IMC processor @ 160MHz. Tested in both native and browser RV32 simulation."
    ),
    "esp32c6": BoardProfile(
        id="esp32c6",
        name="ESP32-C6 DevKitC-1",
        manufacturer="Espressif",
        chip_family="ESP32-C6",
        module="ESP32-C6-WROOM-1",
        fqbn="esp32:esp32:esp32c6",
        support_status="compile_only",
        voltage_operating=3.3,
        flash_size_mb=4,
        has_psram=False,
        builtin_led_gpio=8,
        pins=[],
        description="RISC-V 32-bit HP core + LP core, Wi-Fi 6 (802.11ax), Zigbee/Thread IEEE 802.15.4."
    ),
    "esp32h2": BoardProfile(
        id="esp32h2",
        name="ESP32-H2 DevKitM-1",
        manufacturer="Espressif",
        chip_family="ESP32-H2",
        module="ESP32-H2-MINI-1",
        fqbn="esp32:esp32:esp32h2",
        support_status="compile_only",
        voltage_operating=3.3,
        flash_size_mb=4,
        has_psram=False,
        builtin_led_gpio=8,
        pins=[],
        description="Ultra-low-power RISC-V with Bluetooth 5.2 and IEEE 802.15.4 (Thread/Zigbee)."
    ),
    "esp32p4": BoardProfile(
        id="esp32p4",
        name="ESP32-P4 High-Performance",
        manufacturer="Espressif",
        chip_family="ESP32-P4",
        module="ESP32-P4",
        fqbn="esp32:esp32:esp32p4",
        support_status="definition_available",
        voltage_operating=3.3,
        flash_size_mb=16,
        has_psram=True,
        pins=[],
        description="Dual-core RISC-V @ 400MHz with MIPI-CSI/DSI, H.264 video encoding, high-performance multimedia."
    )
}

def list_boards() -> List[Dict[str, Any]]:
    return [b.model_dump() for b in BOARD_REGISTRY.values()]

def get_board(board_id: str) -> Optional[BoardProfile]:
    return BOARD_REGISTRY.get(board_id)
