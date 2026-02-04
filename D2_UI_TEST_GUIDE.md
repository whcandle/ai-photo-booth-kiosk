# D2 UI 测试指南

## 📋 测试前准备

### 1. 启动 MVP 服务

```bash
cd D:\workspace\ai-photo-booth-mvp
mvn spring-boot:run
```

**等待启动完成**，看到：
```
Started AiPhotoBoothApplication in X.XXX seconds
```

### 2. 启动 Kiosk 前端

打开新的终端窗口：

```bash
cd D:\workspace\ai-photo-booth-kiosk
npm run dev
```

**等待启动完成**，通常会在 `http://localhost:5173` 或类似地址。

---

## 🧪 测试步骤

### 步骤 1：打开设置页面

1. 在浏览器中打开 Kiosk 应用（通常是 `http://localhost:5173`）
2. 进入设置页面（Settings）
3. 切换到 **"Device & Platform"** Tab

---

### 步骤 2：配置平台信息

1. 在 "平台配置" 表单中填写：
   - **平台地址**：`http://127.0.0.1:8089`（或你的平台地址）
   - **设备代码**：`dev_001`（或你的设备代码）
   - **密钥**：你的设备密钥

2. 点击 **"保存配置"** 按钮

3. **验证**：
   - ✅ 显示 "设备配置保存成功" toast
   - ✅ 表单数据已保存

---

### 步骤 3：测试 Handshake 按钮

1. 点击 **"Handshake"** 按钮

2. **预期行为**：
   - ✅ 按钮显示 "Handshaking..."（禁用状态）
   - ✅ 等待几秒钟
   - ✅ 显示 "Handshake successful" toast（绿色）
   - ✅ "设备信息" 区域自动更新：
     - `设备 ID` 显示新的 ID（如 "4"）
     - `设备 Token` 显示部分 token（如 "***xxxxxxxx"）
     - `Token 过期时间` 显示过期时间

3. **如果失败**：
   - ❌ 检查平台服务是否运行
   - ❌ 检查 `platformBaseUrl` 是否正确
   - ❌ 检查 `deviceCode` 和 `secret` 是否正确

---

### 步骤 4：测试 Fetch Activities 按钮（在线场景）

1. **确保平台服务运行**（如果还没有运行，先启动平台服务）

2. 点击 **"Fetch Activities"** 按钮

3. **预期行为**：
   - ✅ 按钮显示 "Fetching..."（禁用状态）
   - ✅ 等待几秒钟
   - ✅ 显示 "Activities fetched successfully" toast（绿色）
   - ✅ 下方显示 **"Activities List"** 区域
   - ✅ 显示活动列表（JSON 格式）
   - ✅ **不显示**缓存标记（因为 `stale=false`）

4. **验证 Activities 列表**：
   - ✅ 每个活动项显示为 JSON 格式
   - ✅ 包含活动字段（如 `activityId`、`name`、`status` 等）

---

### 步骤 5：测试缓存标记（离线场景）

#### 方法 1：修改 platformBaseUrl 为无效地址

1. 在 "平台配置" 表单中，将 **平台地址** 改为无效地址：
   - 例如：`http://invalid.example.com:8089`

2. 点击 **"保存配置"**

3. 点击 **"Fetch Activities"** 按钮

4. **预期行为**：
   - ✅ 显示 **"Using cached data"** toast（蓝色 info）
   - ✅ 显示 **缓存标记**（橙色背景）：
     - "Using cached data" badge
     - "cachedAt: [时间戳]"
   - ✅ 显示活动列表（来自缓存）

#### 方法 2：停止平台服务

1. 停止平台服务（如果正在运行）

2. 点击 **"Fetch Activities"** 按钮

3. **预期行为**：
   - ✅ 显示缓存标记（如果有缓存）
   - ✅ 或显示 "Platform unreachable" toast（如果没有缓存）

---

### 步骤 6：测试错误处理

#### 测试 401 错误（Token 过期）

1. **方法 1**：修改 deviceToken 为无效值
   - 在 MVP 的 `device.json` 中，将 `deviceToken` 改为 `"invalid_token"`
   - 重启 MVP 服务

2. **方法 2**：等待 token 过期（如果设置了过期时间）

3. 点击 **"Fetch Activities"** 按钮

4. **预期行为**：
   - ✅ 显示 **"Token invalid/expired, please handshake"** toast（红色 error）
   - ✅ HTTP 状态码：401

#### 测试 503 错误（平台不可达且无缓存）

1. 确保没有缓存（删除 `activities_cache.json` 文件）

2. 修改 platformBaseUrl 为无效地址或停止平台服务

3. 点击 **"Fetch Activities"** 按钮

4. **预期行为**：
   - ✅ 显示 **"Platform unreachable"** toast（红色 error）
   - ✅ HTTP 状态码：503
   - ✅ 不显示 Activities 列表

---

## ✅ 完整验收清单

### Handshake 功能
- [ ] Handshake 按钮可以点击
- [ ] 点击后显示 loading 状态
- [ ] 成功后显示 success toast
- [ ] 设备信息自动更新（deviceId/token/tokenExpiresAt）
- [ ] 失败时显示错误 toast

### Fetch Activities 功能
- [ ] Fetch Activities 按钮可以点击
- [ ] 点击后显示 loading 状态
- [ ] 成功获取后显示 activities 列表
- [ ] Activities 列表以 JSON 格式展示
- [ ] 空列表时显示提示

### 缓存标记
- [ ] 当 `stale=true` 时显示缓存标记
- [ ] 缓存标记包含 "Using cached data" badge
- [ ] 缓存标记显示 `cachedAt` 时间戳
- [ ] 当 `stale=false` 时不显示缓存标记

### 错误处理
- [ ] 401 错误显示 "Token invalid/expired, please handshake"
- [ ] 503 错误显示 "Platform unreachable"
- [ ] 其他错误显示后端返回的 message

### UI/UX
- [ ] 按钮样式正确（Handshake 蓝色，Fetch Activities 绿色）
- [ ] 缓存标记样式正确（橙色背景）
- [ ] Activities JSON 格式清晰可读
- [ ] Toast 提示正确显示

---

## 🔍 调试技巧

### 查看浏览器控制台

打开浏览器开发者工具（F12），查看：
- Network 标签：检查 API 请求和响应
- Console 标签：查看错误日志

### 检查 API 请求

在 Network 标签中，查看：
- `POST /local/device/handshake` - Handshake 请求
- `GET /local/device/activities` - Activities 请求

### 常见问题

1. **Handshake 失败**
   - 检查 MVP 服务是否运行
   - 检查平台服务是否运行
   - 检查 `platformBaseUrl`、`deviceCode`、`secret` 是否正确

2. **Fetch Activities 失败**
   - 确保先执行过 Handshake
   - 检查平台服务是否运行
   - 检查 token 是否有效

3. **缓存标记不显示**
   - 确保先在线获取过 activities（创建缓存）
   - 然后让平台不可达，再次获取

---

## 📝 快速测试脚本

### PowerShell 快速验证后端接口

```powershell
# 1. 测试 Handshake
Invoke-WebRequest -Uri "http://127.0.0.1:8080/local/device/handshake" `
    -Method POST -UseBasicParsing | Select-Object -ExpandProperty Content

# 2. 测试 Activities
Invoke-WebRequest -Uri "http://127.0.0.1:8080/local/device/activities" `
    -Method GET -UseBasicParsing | Select-Object -ExpandProperty Content
```

---

## 🎯 测试场景总结

| 场景 | 操作 | 预期结果 |
|------|------|----------|
| Handshake 成功 | 点击 Handshake | 显示 success toast，设备信息更新 |
| Activities 在线 | 点击 Fetch Activities | 显示列表，无缓存标记 |
| Activities 离线（有缓存） | 平台不可达 + 点击 Fetch | 显示列表 + 缓存标记 |
| Activities 离线（无缓存） | 平台不可达 + 无缓存 + 点击 Fetch | 显示 503 错误 |
| Token 过期 | Token 无效 + 点击 Fetch | 显示 401 错误 |

---

## ✅ 完成标准

所有测试场景通过后，D2 UI 实现完成！
