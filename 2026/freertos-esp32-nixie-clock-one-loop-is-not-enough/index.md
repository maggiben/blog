---
title: "When One loop() Is Not Enough: FreeRTOS on the ESP32 for a Nixie Clock"
subtitle: FreeRTOS · ESP32 · nixie.os
description: "Why I moved a nixie clock from a blocking Arduino loop to FreeRTOS on the ESP32—tasks, queues, and an I2C mutex for a DS3231, OLED, MCP23017, DHT21, WiFi, and NTP. Lessons from nixie.os and earlier sensor projects."
date: 2026-05-19
published: true
language: en
coverImage: assets/cover.webp
tags:
  - freertos
  - esp32
  - embedded
  - nixie
  - hardware
  - iot
  - arduino
canonical: https://www.linkedin.com/posts/maggiben_introduction-to-rtos-part-1-what-is-a-real-time-activity-6829815379645251584-Wm6y
repo: https://github.com/maggiben/nixie.os
---

![FreeRTOS logo](assets/cover.webp)

**FreeRTOS on ESP32**

---

I was playing with the ESP32 for a [nixie clock](2026/nixie-clock-multiplexing-experiment/) and quickly discovered how hard it is to keep every peripheral in sync inside a single `loop()`. Read the humidity sensor, refresh the OLED, poll NTP, drive the tubes, handle WiFi, don't block the I2C bus—everything wanted attention at once, and `delay()` is not a scheduling policy.

That frustration sent me down the RTOS rabbit hole. I shared the moment on [LinkedIn](https://www.linkedin.com/posts/maggiben_introduction-to-rtos-part-1-what-is-a-real-time-activity-6829815379645251584-Wm6y) and pointed people at Shawn Hymel's excellent [Introduction to RTOS](https://www.youtube.com/playlist?list=PLEBQazB0HUyQ4hAPU1cJED6t3DU0h34bz) series on Digi-Key—a clear path from "what is real time?" to tasks, queues, and mutexes. The code that came out of that learning curve lives in [**nixie.os**](https://github.com/maggiben/nixie.os): a nixie clock "operating system" running **FreeRTOS** on the ESP32 to keep internal and external real-time clocks aligned with **NTP**.

This post is the longer version of that story: what an RTOS buys you on a crowded bench, and what still hurts when you wire half a lab onto one chip.

## The problem: one loop, many masters

On a typical ESP32 clock build you quickly accumulate:

| Device | Bus / link | Job |
|--------|------------|-----|
| **DS3231** RTC | I2C | Battery-backed time when WiFi is down |
| **SSD1306** OLED | I2C | Status, date, sensor readouts |
| **MCP23017** GPIO expander | I2C | Nixie digit drivers |
| **DHT21** | One-wire-ish timing | Temperature & humidity |
| **WiFi + NTP** | Network | Accurate epoch time |
| **ESP32 internal RTC** (`ESP32Time`) | Software | Fast reads without hitting the wire |

In a **single `loop()`**, every `delay(500)` for a GPIO test pattern is half a second where you are not updating NTP, not refreshing the display, and not trusting that your RTC drift correction still runs on schedule. My earlier [**humidity-sensor**](https://github.com/maggiben/humidity-sensor) sketch does exactly that: NTP, DHT, OLED, MCP outputs, and RTC logging all march through one `loop()` with blocking `delay()` calls between digit tests. It works—until you add one more device or one more network edge case.

That is the wall I hit. Not "RTOS because resume-driven development," but **RTOS because the bench kept growing**.

## What FreeRTOS gives you (on this project)

The ESP32 Arduino core ships with **FreeRTOS**. You do not install a separate kernel; you learn its primitives and stop fighting the default `setup()` / `loop()` model.

On [nixie.os](https://github.com/maggiben/nixie.os), `setup()` becomes a bootstrap: initialize hardware, create synchronization objects, spawn tasks, start software timers, then **`vTaskDelete(NULL)`** so the Arduino setup task exits and real work happens in FreeRTOS land.

### 1. Separate concerns into tasks

Instead of one loop juggling everything, dedicated tasks own narrow jobs:

- **`syncRtckWithNtp`** — consume NTP timestamps from a queue and align both RTCs (DS3231 + ESP32 internal) under mutex protection
- **`displayMessages`** — pull DHT samples from another queue and paint the OLED
- **`printMessages`** — periodic serial logging of system time
- **`testOutput`** — cycle digits on the nixie drivers (the fun task)

Each task blocks on its own inputs (`xQueueReceive`, `vTaskDelay`) instead of blocking the entire firmware.

### 2. Timers for periodic work without busy-waiting

NTP sync and DHT reads run on **`xTimerCreate`** callbacks (`syncNtpDateTimeCallback`, `syncDhtSensorCallback`). The timer fires, the callback does a small amount of work (fetch NTP, read the sensor), and pushes results into a **queue** for tasks to consume. That pattern keeps network retries and sensor minimum-delay requirements out of your display path.

### 3. Queues decouple producers and consumers

```cpp
ntp_datetime_queue = xQueueCreate(ntp_datetime_queue_len, sizeof(DATETIME));
dht_queue = xQueueCreate(dht_queue_len, sizeof(DHTSENSORDATA));
```

When the NTP timer gets a fresh epoch, it **`xQueueSend`s** a `DATETIME` struct. The RTC sync task **`xQueueReceive`s** it when ready. If the queue fills up, you get an explicit log line (`ntp_datetime_queue queue full`) instead of silent corruption—crude backpressure, but honest.

### 4. Mutexes for shared buses

Several peripherals share **I2C**. The OLED, RTC, and MCP23017 must not stomp each other mid-transaction. An **`i2c_mutex`** wraps every multi-step sequence:

```cpp
if (xSemaphoreTake(i2c_mutex, portMAX_DELAY) == pdTRUE) {
  rtc.adjust(DateTime(dateTime.epochTime));
  // ...
  xSemaphoreGive(i2c_mutex);
}
```

Without that, a display refresh can interleave with an RTC write and you chase ghosts on the bus for hours.

### 5. Core pinning (when you need it)

`main.h` respects unicore vs dual-core builds:

```cpp
#if CONFIG_FREERTOS_UNICORE
 static const BaseType_t app_cpu = 0;
#else
 static const BaseType_t app_cpu = 1;
#endif
```

Tasks are created with **`xTaskCreatePinnedToCore(..., app_cpu)`** so you can keep WiFi stack behavior and your application tasks separated on the ESP32's two Xtensa cores—a small knob that matters when the radio and your digit multiplexing compete for CPU.

## The hard part: connecting everything together

An RTOS does not make the wiring diagram simpler. It makes the **software** diagram tractable. The hardware integration challenges stayed real:

### Three clocks that must agree

This project juggles **NTP** (network truth), a **DS3231** (battery-backed when offline), and **ESP32Time** (fast internal reads). Boot logic copies DS3231 → internal RTC; periodic NTP updates push network time back to both when they drift. Getting that wrong means a beautiful nixie display showing the wrong century with confidence.

### WiFi is still blocking (from everyone's perspective)

NTP callbacks wait in a loop until `WiFi.status() == WL_CONNECTED`. That is correct but fragile: captive portals, weak APs, and reconnect storms still stall time sync. I started a companion [**nixie-os-ap**](https://github.com/maggiben/nixie-os-ap) captive-portal page for WiFi provisioning—the AP setup task is in the repo but commented out in firmware, a reminder that **joining the network** is its own subsystem.

### One bus, many personalities

I2C is shared; DHT timing is picky; nixie high-voltage drivers care about GPIO patterns. The mutex fixes bus collisions, not **logic** collisions: you still have to decide priority (time sync vs user-visible display vs tube exercise for [cathode poisoning](2026/nixie-clock-multiplexing-experiment/)).

### Debugging is a skill upgrade

Preemptive tasks mean serial logs interleave, race bugs hide in queue depths, and `portMAX_DELAY` can mask starvation. You learn to watch **heap** (`xPortGetFreeHeapSize` was in the code for a reason), name your tasks, and treat "it works on the bench" as phase one.

## Other ESP32 experiments in the same family

RTOS is not the only way I approached embedded clocks and sensors—it's the response when **`loop()`** stopped scaling:

| Repo | Role |
|------|------|
| [**nixie.os**](https://github.com/maggiben/nixie.os) | FreeRTOS firmware: NTP, dual RTC sync, DHT, OLED, MCP23017 nixie drivers |
| [**humidity-sensor**](https://github.com/maggiben/humidity-sensor) | Earlier DHT21 + NTP logger—same peripherals, **single blocking loop** |
| [**smart-water-tank**](https://github.com/maggiben/smart-water-tank) | ESP8266 IoT tank level (PlatformIO)—another "many concerns, small MCU" problem |
| [**nixie-os-ap**](https://github.com/maggiben/nixie-os-ap) | Captive portal / WiFi setup UI for the clock |
| [**monitor-os**](https://github.com/maggiben/monitor-os) | Python utilities to watch remote Raspberry Pi sensors—RTOS on the edge, classic Linux scheduling at the hub |

The through-line: **time**, **sensors**, and **actuators** rarely stay polite if you schedule them by hand.

## Was it worth it?

For a blinking LED? No—`loop()` is fine.

For a clock that must stay accurate, talk to the network, refresh a display, read environmental sensors, and eventually multiplex nixie tubes without glitches? **Yes.** FreeRTOS gave me:

- Predictable timing via tasks and timers instead of nested `delay()`
- Safe I2C sharing via a mutex
- Clear boundaries between "fetch NTP" and "apply to RTC"
- Room to add cathode-poisoning routines and WiFi provisioning without rewriting the universe

If you are staring at an ESP32 project where every new feature makes the main loop longer and scarier, you are not alone—that is exactly where I was when I posted about Shawn Hymel's series. Start with [Part 1: What is an RTOS?](https://www.youtube.com/watch?v=F321087yYy4), then look at how [**nixie.os**](https://github.com/maggiben/nixie.os) maps those ideas onto real hardware.

The tubes still glow orange. The software finally has a scheduler worthy of the mess on the breadboard.

Originally shared on [LinkedIn](https://www.linkedin.com/posts/maggiben_introduction-to-rtos-part-1-what-is-a-real-time-activity-6829815379645251584-Wm6y).
