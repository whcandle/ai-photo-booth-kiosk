# Templates API 使用说明

## API 方法

### `getActivityTemplates(activityId)`

获取指定活动的模板列表。

**文件位置**：`src/api/deviceApi.js`

**方法签名**：
```javascript
export async function getActivityTemplates(activityId)
```

**参数**：
- `activityId` (number): 活动 ID

**返回值**：
```typescript
Promise<{
  success: boolean,
  data: {
    items: Array,           // 模板列表
    stale: boolean,         // 是否来自缓存
    cachedAt?: string       // 缓存时间（仅 stale=true 时存在）
  },
  message: string | null
}>
```

---

## 使用示例

### 基本用法

```javascript
import { getActivityTemplates } from '@/api/deviceApi'

// 获取活动 8 的模板列表
const result = await getActivityTemplates(8)

if (result.success && result.data) {
  const templates = result.data.items
  const isStale = result.data.stale
  const cachedAt = result.data.cachedAt
  
  console.log(`Found ${templates.length} templates`)
  console.log(`Stale: ${isStale}`)
  if (isStale && cachedAt) {
    console.log(`Cached at: ${cachedAt}`)
  }
}
```

### 在 Vue 组件中使用

```vue
<template>
  <div>
    <button @click="fetchTemplates">Fetch Templates</button>
    
    <div v-if="templatesList">
      <div v-if="isStale" class="cache-indicator">
        Using cached data (cachedAt: {{ cachedAt }})
      </div>
      
      <div v-for="template in templatesList" :key="template.templateId">
        <p>{{ template.name }} (v{{ template.version }})</p>
        <p v-if="template.updatedAt">Updated: {{ template.updatedAt }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getActivityTemplates } from '@/api/deviceApi'

const templatesList = ref(null)
const isStale = ref(false)
const cachedAt = ref(null)
const loading = ref(false)

const fetchTemplates = async (activityId = 8) => {
  loading.value = true
  templatesList.value = null
  isStale.value = false
  cachedAt.value = null
  
  try {
    const res = await getActivityTemplates(activityId)
    
    if (res.success && res.data) {
      templatesList.value = res.data.items || []
      isStale.value = res.data.stale === true
      cachedAt.value = res.data.cachedAt || null
      
      if (isStale.value) {
        console.log('Using cached data')
      }
    } else {
      console.error('Failed to fetch templates:', res.message)
    }
  } catch (error) {
    console.error('Error fetching templates:', error)
  } finally {
    loading.value = false
  }
}
</script>
```

---

## 响应结构示例

### 在线成功
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "templateId": 3,
        "name": "test001",
        "coverUrl": null,
        "version": "1",
        "downloadUrl": "testurl",
        "checksum": "1",
        "enabled": true,
        "updatedAt": "2026-01-28T08:04:49Z"
      }
    ],
    "stale": false
  },
  "message": null
}
```

### 缓存回退
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

## 错误处理

### HTTP 错误

```javascript
try {
  const result = await getActivityTemplates(8)
  // 处理成功响应
} catch (error) {
  if (error.response) {
    // HTTP 错误（401, 403, 503 等）
    const status = error.response.status
    const message = error.response.data?.message || error.message
    
    if (status === 401) {
      console.error('Token invalid/expired')
    } else if (status === 503) {
      console.error('Platform unreachable')
    } else {
      console.error(`Request failed: ${status} - ${message}`)
    }
  } else {
    // 网络错误
    console.error('Network error:', error.message)
  }
}
```

---

## 注意事项

1. **返回结构**：完全对齐后端原始结构，不引入新字段
2. **缓存标识**：通过 `data.stale` 判断是否来自缓存
3. **缓存时间**：`data.cachedAt` 仅在 `stale=true` 时存在
4. **错误处理**：需要处理 HTTP 错误和业务错误（success=false）

---

## 与 getActivities 的对比

| 特性 | getActivities | getActivityTemplates |
|------|--------------|---------------------|
| **URL** | `/local/device/activities` | `/local/device/activities/{activityId}/templates` |
| **参数** | 无 | `activityId` |
| **返回结构** | `{success, data: {items, stale, cachedAt?}, message}` | `{success, data: {items, stale, cachedAt?}, message}` |
| **缓存文件** | `activities_cache.json` | `templates_cache_{activityId}.json` |

**完全一致的协议和结构**。
