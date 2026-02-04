# D2 UI 实现总结

## 📋 实现内容

在 `SettingsLayout.vue` 的 **Device & Platform Tab** 中添加了 D2 本地代理接口的 UI。

---

## ✅ 新增功能

### 1. API 函数（`deviceApi.js`）

- **`handshake()`** - POST `/local/device/handshake`
- **`getActivities()`** - GET `/local/device/activities`

### 2. UI 组件（`SettingsLayout.vue`）

#### 平台操作区域
- **Handshake 按钮**
  - 执行平台 handshake
  - 成功后自动 reload config（获取最新的 deviceId/token）
  - 显示 loading 状态

- **Fetch Activities 按钮**
  - 获取活动列表
  - 显示 loading 状态

#### Activities 列表展示
- **Activities 列表**
  - 直接渲染 JSON 格式（`JSON.stringify(activity, null, 2)`）
  - 支持多个活动项
  - 空列表时显示提示

- **缓存标记**
  - 当 `data.stale === true` 时显示
  - 显示 "Using cached data" badge
  - 显示 `cachedAt` 时间戳（格式化）

### 3. 错误处理

#### Toast 提示
- **401 错误**：`"Token invalid/expired, please handshake"`
- **503 错误**：`"Platform unreachable"`
- **其他错误**：显示后端返回的 `message` 或默认错误信息

#### 成功提示
- **Handshake 成功**：`"Handshake successful"` (success)
- **Activities 获取成功**：`"Activities fetched successfully"` (success)
- **使用缓存**：`"Using cached data"` (info)

---

## 🎨 UI 设计

### 布局结构
```
Device & Platform Tab
├── 平台配置表单
├── 设备信息（只读）
├── 平台操作
│   ├── Handshake 按钮
│   └── Fetch Activities 按钮
└── Activities 列表
    ├── 缓存标记（如果 stale=true）
    └── Activities 项（JSON 格式）
```

### 样式特点
- **Handshake 按钮**：蓝色主题（`#2d6cff`）
- **Fetch Activities 按钮**：绿色主题（`#44aa44`）
- **缓存标记**：橙色背景，黄色文字（`#ffaa00`）
- **Activities JSON**：等宽字体，深色背景

---

## 📝 代码变更

### 文件清单

1. **`src/api/deviceApi.js`**
   - 新增 `handshake()` 函数
   - 新增 `getActivities()` 函数

2. **`src/pages/SettingsLayout.vue`**
   - 导入新的 API 函数
   - 新增响应式状态：
     - `handshaking`
     - `fetchingActivities`
     - `activitiesList`
     - `activitiesStale`
     - `activitiesCachedAt`
   - 新增方法：
     - `handleHandshake()`
     - `handleFetchActivities()`
     - `formatCachedAt()`
   - 新增 UI 区域：
     - 平台操作区域
     - Activities 列表区域
   - 新增样式

---

## 🔄 工作流程

### Handshake 流程
1. 用户点击 "Handshake" 按钮
2. 调用 `POST /local/device/handshake`
3. 成功后显示 toast
4. 自动 reload config（获取最新 deviceId/token）

### Fetch Activities 流程
1. 用户点击 "Fetch Activities" 按钮
2. 调用 `GET /local/device/activities`
3. 处理响应：
   - 成功：显示 activities 列表
   - 如果 `stale=true`：显示缓存标记
   - 401：提示需要 handshake
   - 503：提示平台不可达

---

## ✅ 验收清单

- [x] Handshake 按钮正常工作
- [x] Handshake 成功后 reload config
- [x] Fetch Activities 按钮正常工作
- [x] Activities 列表正确展示（JSON 格式）
- [x] 缓存标记正确显示（stale=true）
- [x] cachedAt 时间戳格式化显示
- [x] 401 错误提示正确
- [x] 503 错误提示正确
- [x] Toast 提示区分不同场景
- [x] 不允许直连 platform（只调用 MVP 本地接口）

---

## 🚀 使用说明

1. **配置平台信息**
   - 在 "平台配置" 表单中填写 `platformBaseUrl`、`deviceCode`、`secret`
   - 点击 "保存配置"

2. **执行 Handshake**
   - 点击 "Handshake" 按钮
   - 等待成功后，设备信息会自动更新

3. **获取 Activities**
   - 点击 "Fetch Activities" 按钮
   - 查看活动列表
   - 如果显示缓存标记，说明使用了缓存数据

---

## 📌 注意事项

1. **不允许直连 platform**：所有请求都通过 MVP 的 `/local/device/*` 接口
2. **localhost-only**：后端接口只允许 localhost 访问
3. **错误处理**：根据 HTTP 状态码（401/503）显示不同的错误提示
4. **缓存标记**：只在 `stale=true` 时显示，帮助用户了解数据来源
