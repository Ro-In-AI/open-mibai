# 🔧 ESP32 项目中如何优雅加载大 JSON 配置文件（支持自动缓冲区管理与 fallback）
在嵌入式开发中，我们常常需要通过 SPIFFS 载入 JSON 文件作为配置来源。在基于 [ArduinoJson](https://arduinojson.org/) 的 ESP32 项目中，如果不合理管理 `DynamicJsonDocument` 的内存缓冲区，很容易出现 “NoMemory” 错误，导致配置加载失败。

本文将分享一种通用且鲁棒的做法，支持：

- 用户通过 JSON 文件配置 `ble_json_buffer_size` 缓冲区大小
- 自动 fallback 到估算大小，保证解析成功
- 日志完整，便于排查
## 📁 JSON 配置示例（`/ble_config.json`）

```json
{
  "ble_json_buffer_size": 4096,
  "services": [
    {
      "name": "MotorService",
      "uuid": "ff010000-1000-8000-0080-5f9b34fb0000",
      "characteristics": [...]
    }
  ]
}
```

---

## 🎯 目标

我们希望：

1. **先读取用户配置的 `ble_json_buffer_size`** 作为主文档的缓冲区大小；
2. 如果解析失败（如用户设置得太小），就自动回退使用 `file.size() * 1.3` 的大小重试。

---

## 🧠 为什么不直接用默认大小？

因为 JSON 文件大小可能增长，硬编码 4096 不一定适配所有场景。而 SPIFFS 又不能动态扩展文档 buffer，因此我们需要“预读配置字段，再动态分配内存”。

---

## ✅ 推荐实现方式（完整代码）

```cpp
SPIFFS.begin(true);
File file = SPIFFS.open("/ble_config.json");
if (!file) {
    DEBUG_ERROR("❌ Failed to open ble_config.json");
    return;
}

size_t estimatedSize = file.size();          // 文件实际大小
size_t jsonBufferSize = 4096;                // 默认缓冲区大小

// Step 1: 尝试读取 ble_json_buffer_size 字段
{
    DynamicJsonDocument docHead(2048);       // 临时较小 buffer 读取头部
    DeserializationError headErr = deserializeJson(docHead, file);

    if (docHead.containsKey("ble_json_buffer_size")) {
        jsonBufferSize = docHead["ble_json_buffer_size"].as<size_t>();
        DEBUG_INFOF("📦 使用配置指定 JSON 缓冲区大小: %d 字节（状态: %s）", jsonBufferSize, headErr.c_str());
    } else {
        DEBUG_INFOF("📦 使用默认 JSON 缓冲区大小: %d 字节（文件大小约 %d 字节）", jsonBufferSize, estimatedSize);
    }

    file.seek(0);  // 重置文件指针
}

// Step 2: 尝试使用配置大小解析整个 JSON
DynamicJsonDocument doc(jsonBufferSize);
DeserializationError err = deserializeJson(doc, file);

// Step 3: fallback 机制
if (err) {
    size_t fallbackSize = static_cast<size_t>(estimatedSize * 1.3);
    DEBUG_WARNF("⚠️ JSON 解析失败，尝试使用估算缓冲区（%d 字节）", fallbackSize);

    file.seek(0);
    DynamicJsonDocument fallbackDoc(fallbackSize);
    DeserializationError fallbackErr = deserializeJson(fallbackDoc, file);

    if (fallbackErr) {
        DEBUG_ERRORF("❌ fallback 解析也失败（%d 字节）: %s", fallbackSize, fallbackErr.c_str());
        return;
    }

    doc = std::move(fallbackDoc);
    DEBUG_INFOF("✅ fallback 解析成功，使用估算缓冲区 %d 字节", fallbackSize);
}
```

---

## 🧪 典型日志输出

```
📦 使用配置指定 JSON 缓冲区大小: 2048 字节（状态: NoMemory）
⚠️ JSON 解析失败，尝试使用估算缓冲区（3092 字节）
✅ fallback 解析成功，使用估算缓冲区 3092 字节
```

---

## ✅ 总结

| 功能 | 说明 |
| --- | --- |
| ✅ 支持配置 JSON 缓冲区大小 | 用户可在 JSON 顶部定义 `ble_json_buffer_size` |
| ✅ 自动 fallback | 若大小不够，自动切换到文件大小估算值 |
| ✅ 日志清晰 | 输出错误类型与状态，便于问题定位 |
| ✅ 结构清晰、适配性强 | 支持未来文件变大、用户误填等情况 |

---

## 💬 建议与实践

- `ble_json_buffer_size` 应放在 JSON 顶部（越靠前越容易在小 buffer 下被读取）
- 推荐估算比例为 `file.size() * 1.2 ~ 1.5`，根据内容结构适配
- `ArduinoJson` 的 `NoMemory` 不等于崩溃，可照常访问已解析字段