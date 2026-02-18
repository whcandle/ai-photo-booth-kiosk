# Templates UI 实现说明

## 新增功能

在 Settings 的 Device & Platform Tab 中新增 Templates 相关 UI。

---

## 实现内容

### 1. Activities 列表选中功能

- **选中状态**：点击 activity item 可选中
- **视觉反馈**：
  - 选中项：蓝色背景高亮（`activity-item-selected`）
  - 悬停效果：鼠标悬停时背景变亮
- **状态管理**：`selectedActivityId` ref

### 2. Fetch Templates 按钮

- **位置**：在 "Fetch Activities" 按钮旁边
- **禁用条件**：
  - `fetchingTemplates === true`（正在加载）
  - `selectedActivityId === null`（未选中 activity）
- **样式**：紫色渐变按钮，与现有按钮风格一致

### 3. Templates 列表展示

**显示字段**：
- `templateId`
- `name`
- `version`
- `downloadUrl`（如果为空显示 "N/A"）
- `checksum`（如果为空显示 "N/A"）
- `enabled`
- `updatedAt`（如果存在则显示）

**布局**：每个 template 以卡片形式展示，字段以 label-value 对显示。

### 4. 缓存提示

- **条件**：`data.stale === true`
- **显示内容**：
  - Badge："缓存数据"
  - 时间：`cachedAt` 格式化显示
- **样式**：与 activities 的缓存提示一致（橙色背景）

### 5. 错误提示

- **401 Unauthorized**：
  - Toast 消息："Token invalid/expired, please handshake first"
  - 类型：error

- **503 Service Unavailable**：
  - Toast 消息："Platform unreachable and no cache"
  - 类型：error

- **其他错误**：
  - 显示 `errorData.message` 或 `err.message`

---

## 代码变更

### 新增状态变量

```javascript
const selectedActivityId = ref(null)
const fetchingTemplates = ref(false)
const templatesList = ref(null)
const templatesStale = ref(false)
const templatesCachedAt = ref(null)
```

### 新增函数

```javascript
const handleFetchTemplates = async () => {
  // 验证选中
  // 调用 API
  // 处理响应
  // 错误处理
}
```

### 新增 UI 组件

1. **Activities 列表选中**：
   ```vue
   :class="['activity-item', { 'activity-item-selected': selectedActivityId === activity.activityId }]"
   @click="selectedActivityId = activity.activityId"
   ```

2. **Fetch Templates 按钮**：
   ```vue
   <button 
     @click="handleFetchTemplates"
     :disabled="fetchingTemplates || !selectedActivityId"
   >
   ```

3. **Templates 列表**：
   - 缓存提示（stale=true 时）
   - 字段列表展示

### 新增样式

- `.activity-item-selected` - 选中状态样式
- `.btn-fetch-templates` - Fetch Templates 按钮样式
- `.device-templates-section` - Templates 区域样式
- `.template-item` - Template 卡片样式
- `.template-field` - 字段展示样式

---

## 使用流程

1. **Fetch Activities** → 获取活动列表
2. **点击 Activity** → 选中一个 activity（高亮显示）
3. **Fetch Templates** → 获取该 activity 的模板列表
4. **查看结果**：
   - 在线数据：显示模板列表
   - 缓存数据：显示 "缓存数据" badge + cachedAt

---

## 响应结构处理

### 成功响应（在线）
```json
{
  "success": true,
  "data": {
    "items": [...],
    "stale": false
  },
  "message": null
}
```

### 成功响应（缓存）
```json
{
  "success": true,
  "data": {
    "items": [...],
    "stale": true,
    "cachedAt": "2026-02-06T01:15:42.820Z"
  },
  "message": "using cached data"
}
```

### 错误响应
```json
{
  "success": false,
  "data": null,
  "message": "error message"
}
```

---

## 注意事项

1. **字段名**：使用 `activity.activityId` 作为选中标识
2. **容错**：`downloadUrl` 和 `checksum` 为空时显示 "N/A"
3. **可选字段**：`updatedAt` 仅在存在时显示
4. **错误处理**：完全对齐 activities 的错误处理逻辑

---

## 测试验证

### 基本流程
1. 打开 Settings → Device & Platform Tab
2. 点击 "Fetch Activities"
3. 点击一个 activity（应该高亮）
4. 点击 "Fetch Templates"
5. 查看模板列表

### 缓存测试
1. 先在线拉取一次（生成缓存）
2. 停止 Platform 服务
3. 再次点击 "Fetch Templates"
4. 应该显示 "缓存数据" badge

### 错误测试
1. 使用无效 token → 应该提示 401
2. 停止 Platform 且无缓存 → 应该提示 503
