<template>
  <div class="settings-layout">
    <div class="settings-header">
      <h1>设置</h1>
      <button @click="handleExit" class="btn-exit">退出</button>
    </div>
    
    <div class="settings-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="['tab-button', { active: activeTab === tab.id }]"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="settings-content">
      <div v-if="activeTab === 'camera'" class="tab-content camera-tab">
        <div class="camera-header">
          <h2>相机设置</h2>
          <button 
            @click="loadCameraData" 
            :disabled="loading"
            class="btn-refresh"
          >
            {{ loading ? '加载中...' : '刷新' }}
          </button>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading && !cameraConfig" class="loading-state">
          <p>正在加载相机配置...</p>
        </div>

        <!-- 错误状态 -->
        <div v-if="error && !loading" class="error-state">
          <p class="error-message">{{ error }}</p>
        </div>

        <!-- 相机状态 -->
        <div v-if="cameraStatus" class="status-section">
          <h3>相机状态</h3>
          <div class="status-grid">
            <div class="status-item">
              <span class="status-label">连接状态:</span>
              <span :class="['status-value', getConnectionStatusClass()]">
                {{ getConnectionStatusText() }}
              </span>
            </div>
            <div class="status-item">
              <span class="status-label">SDK 初始化:</span>
              <span :class="['status-value', cameraStatus.sdkInitialized ? 'status-ok' : 'status-error']">
                {{ cameraStatus.sdkInitialized ? '是' : '否' }}
              </span>
            </div>
            <div class="status-item">
              <span class="status-label">会话已打开:</span>
              <span :class="['status-value', cameraStatus.sessionOpened ? 'status-ok' : 'status-error']">
                {{ cameraStatus.sessionOpened ? '是' : '否' }}
              </span>
            </div>
            <div class="status-item" v-if="cameraStatus.cameraModel">
              <span class="status-label">相机型号:</span>
              <span class="status-value">{{ cameraStatus.cameraModel }}</span>
            </div>
          </div>
        </div>

        <!-- 预览区域 -->
        <div class="preview-section">
          <div class="preview-header">
            <h3>实时预览</h3>
            <div class="preview-controls">
              <label class="preview-toggle">
                <input 
                  type="checkbox" 
                  v-model="previewOn"
                  @change="handlePreviewToggle"
                />
                <span class="toggle-label">{{ previewOn ? 'ON' : 'OFF' }}</span>
              </label>
              <button 
                v-if="previewError && !previewOn"
                @click="handleRetryPreview"
                class="btn-retry-preview"
              >
                重试
              </button>
            </div>
          </div>
          
          <div class="preview-content">
            <div v-if="previewOn" class="preview-image-wrapper">
              <img 
                :src="previewImageSrc"
                @error="handlePreviewError"
                @load="handlePreviewLoad"
                alt="Camera Preview"
                class="preview-image"
              />
              <div v-if="previewError" class="preview-error-overlay">
                <p class="preview-error-message">{{ previewError }}</p>
              </div>
            </div>
            <div v-else class="preview-placeholder">
              <p>预览已关闭</p>
            </div>
            
            <div class="preview-status">
              <span class="preview-status-item">
                状态: <strong>{{ previewOn ? 'ON' : 'OFF' }}</strong>
              </span>
              <span v-if="previewOn && previewFps > 0" class="preview-status-item">
                FPS: <strong>{{ previewFps.toFixed(1) }}</strong>
              </span>
              <span v-if="previewOn && lastPreviewTime" class="preview-status-item">
                最后更新: {{ formatPreviewTime(lastPreviewTime) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 当前配置 -->
        <div v-if="cameraConfig" class="config-section">
          <h3>当前配置</h3>
          
          <!-- 激活的预设 -->
          <div class="active-preset">
            <span class="label">当前配置:</span>
            <span class="value">{{ getCurrentPresetDisplayText() }}</span>
          </div>

          <!-- 当前参数 -->
          <div class="params-section">
            <h4>当前参数</h4>
            <div class="params-grid">
              <div class="param-item">
                <span class="param-label">ISO:</span>
                <span class="param-value">{{ formatIso(cameraConfig.params?.iso) }}</span>
              </div>
              <div class="param-item">
                <span class="param-label">白平衡:</span>
                <span class="param-value">{{ cameraConfig.params?.whiteBalance || 'N/A' }}</span>
              </div>
              <div class="param-item">
                <span class="param-label">曝光补偿:</span>
                <span class="param-value">{{ formatEv(cameraConfig.params?.exposureCompensationEv) }}</span>
              </div>
              <div class="param-item">
                <span class="param-label">图片风格:</span>
                <span class="param-value">{{ cameraConfig.params?.pictureStyle || 'N/A' }}</span>
              </div>
              <div class="param-item">
                <span class="param-label">光圈:</span>
                <span class="param-value">{{ cameraConfig.params?.aperture || 'N/A' }}</span>
              </div>
              <div class="param-item">
                <span class="param-label">快门速度:</span>
                <span class="param-value">{{ cameraConfig.params?.shutterSpeed || 'N/A' }}</span>
              </div>
              <div class="param-item">
                <span class="param-label">测光模式:</span>
                <span class="param-value">{{ cameraConfig.params?.meteringMode || 'N/A' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 预设列表 -->
        <div v-if="cameraConfig && cameraConfig.presets" class="presets-section">
          <h3>预设列表 ({{ cameraConfig.presets.length }})</h3>
          <div class="presets-list">
            <div 
              v-for="preset in cameraConfig.presets" 
              :key="preset.id"
              :class="['preset-item', { active: preset.id === cameraConfig.activePresetId }]"
            >
              <div class="preset-header">
                <div class="preset-name">
                  <span class="preset-display-name">{{ preset.displayName || preset.name }}</span>
                  <span v-if="preset.id === cameraConfig.activePresetId" class="preset-active-badge">当前</span>
                </div>
                <div class="preset-meta">
                  <span class="preset-category">{{ preset.category }}</span>
                  <span v-if="preset.tags && preset.tags.length > 0" class="preset-tags">
                    <span v-for="tag in preset.tags" :key="tag" class="tag">{{ tag }}</span>
                  </span>
                </div>
              </div>
              <div v-if="preset.params" class="preset-preview">
                <span class="preview-label">参数预览:</span>
                <span class="preview-value">
                  ISO: {{ formatIso(preset.params.iso) }}, 
                  WB: {{ preset.params.whiteBalance }}, 
                  EV: {{ formatEv(preset.params.exposureCompensationEv) }}
                </span>
              </div>
              <div class="preset-actions">
                <button 
                  @click="handleApplyPreset(preset.id)"
                  :disabled="applyingPreset === preset.id || !cameraStatus"
                  class="btn-apply-preset"
                >
                  {{ applyingPreset === preset.id ? '应用中...' : '应用' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 参数编辑区 -->
        <div v-if="cameraConfig" class="params-edit-section">
          <h3>参数编辑</h3>
          <form @submit.prevent="handleApplyParams" class="params-form">
            <div class="form-grid">
              <!-- ISO -->
              <div class="form-item">
                <label class="form-label" :class="{ 'label-modified': isParamModified('iso') }">
                  ISO:
                  <span v-if="isParamModified('iso')" class="modified-indicator">*</span>
                </label>
                <select v-model.number="editParams.iso" :class="['form-select', { 'input-modified': isParamModified('iso') }]">
                  <option :value="0">AUTO</option>
                  <option :value="100">100</option>
                  <option :value="200">200</option>
                  <option :value="400">400</option>
                  <option :value="800">800</option>
                  <option :value="1600">1600</option>
                  <option :value="3200">3200</option>
                  <option :value="6400">6400</option>
                </select>
              </div>

              <!-- White Balance -->
              <div class="form-item">
                <label class="form-label" :class="{ 'label-modified': isParamModified('whiteBalance') }">
                  白平衡:
                  <span v-if="isParamModified('whiteBalance')" class="modified-indicator">*</span>
                </label>
                <select v-model="editParams.whiteBalance" :class="['form-select', { 'input-modified': isParamModified('whiteBalance') }]">
                  <option value="AUTO">AUTO</option>
                  <option value="DAYLIGHT">DAYLIGHT</option>
                  <option value="SHADE">SHADE</option>
                  <option value="CLOUDY">CLOUDY</option>
                  <option value="TUNGSTEN">TUNGSTEN</option>
                  <option value="FLUORESCENT">FLUORESCENT</option>
                  <option value="FLASH">FLASH</option>
                  <option value="KELVIN">KELVIN</option>
                </select>
              </div>

              <!-- Exposure Compensation -->
              <div class="form-item">
                <label class="form-label" :class="{ 'label-modified': isParamModified('exposureCompensationEv') }">
                  曝光补偿 (EV):
                  <span v-if="isParamModified('exposureCompensationEv')" class="modified-indicator">*</span>
                </label>
                <input 
                  type="number" 
                  v-model.number="editParams.exposureCompensationEv"
                  step="0.3"
                  min="-3.0"
                  max="3.0"
                  :class="['form-input', { 'input-modified': isParamModified('exposureCompensationEv') }]"
                />
              </div>

              <!-- Picture Style -->
              <div class="form-item">
                <label class="form-label" :class="{ 'label-modified': isParamModified('pictureStyle') }">
                  图片风格:
                  <span v-if="isParamModified('pictureStyle')" class="modified-indicator">*</span>
                </label>
                <select v-model="editParams.pictureStyle" :class="['form-select', { 'input-modified': isParamModified('pictureStyle') }]">
                  <option value="STANDARD">STANDARD</option>
                  <option value="PORTRAIT">PORTRAIT</option>
                  <option value="LANDSCAPE">LANDSCAPE</option>
                  <option value="NEUTRAL">NEUTRAL</option>
                  <option value="FAITHFUL">FAITHFUL</option>
                  <option value="MONOCHROME">MONOCHROME</option>
                </select>
              </div>

              <!-- Aperture -->
              <div class="form-item">
                <label class="form-label" :class="{ 'label-modified': isParamModified('aperture') }">
                  光圈:
                  <span v-if="isParamModified('aperture')" class="modified-indicator">*</span>
                </label>
                <select v-model="editParams.aperture" :class="['form-select', { 'input-modified': isParamModified('aperture') }]">
                  <option value="F2.8">F2.8</option>
                  <option value="F4.0">F4.0</option>
                  <option value="F5.6">F5.6</option>
                  <option value="F8.0">F8.0</option>
                  <option value="F11">F11</option>
                  <option value="F16">F16</option>
                  <option value="F22">F22</option>
                </select>
              </div>

              <!-- Shutter Speed -->
              <div class="form-item">
                <label class="form-label" :class="{ 'label-modified': isParamModified('shutterSpeed') }">
                  快门速度:
                  <span v-if="isParamModified('shutterSpeed')" class="modified-indicator">*</span>
                </label>
                <select v-model="editParams.shutterSpeed" :class="['form-select', { 'input-modified': isParamModified('shutterSpeed') }]">
                  <option value="1/30">1/30</option>
                  <option value="1/60">1/60</option>
                  <option value="1/125">1/125</option>
                  <option value="1/250">1/250</option>
                  <option value="1/500">1/500</option>
                  <option value="1/1000">1/1000</option>
                </select>
              </div>

              <!-- Metering Mode -->
              <div class="form-item">
                <label class="form-label" :class="{ 'label-modified': isParamModified('meteringMode') }">
                  测光模式:
                  <span v-if="isParamModified('meteringMode')" class="modified-indicator">*</span>
                </label>
                <select v-model="editParams.meteringMode" :class="['form-select', { 'input-modified': isParamModified('meteringMode') }]">
                  <option value="EVALUATIVE">EVALUATIVE</option>
                  <option value="PARTIAL">PARTIAL</option>
                  <option value="SPOT">SPOT</option>
                  <option value="CENTER_WEIGHTED">CENTER_WEIGHTED</option>
                </select>
              </div>
            </div>

            <div class="form-actions">
              <button 
                type="button"
                @click="handleResetParams"
                :disabled="applyingParams || modifiedParamsCount === 0"
                class="btn-reset-params"
              >
                重置
              </button>
              <button 
                type="submit"
                :disabled="applyingParams || modifiedParamsCount === 0"
                class="btn-apply-params"
              >
                {{ applyingParams ? '应用中...' : `应用参数${modifiedParamsCount > 0 ? ` (${modifiedParamsCount})` : ''}` }}
              </button>
              <button 
                type="button"
                @click="handleTestShot"
                :disabled="testingShot"
                class="btn-test-shot"
              >
                {{ testingShot ? '拍照中...' : '测试拍照' }}
              </button>
            </div>
          </form>

          <!-- Test Shot 结果显示 -->
          <div v-if="testShotPath" class="test-shot-result">
            <p class="result-label">测试拍照成功:</p>
            <p class="result-path">{{ testShotPath }}</p>
          </div>
        </div>
      </div>
      
      <div v-if="activeTab === 'device'" class="tab-content device-tab">
        <div class="device-header">
          <h2>设备与平台</h2>
          <button 
            @click="loadDeviceData" 
            :disabled="deviceLoading"
            class="btn-refresh"
          >
            {{ deviceLoading ? '加载中...' : '刷新' }}
          </button>
        </div>

        <!-- 加载状态 -->
        <div v-if="deviceLoading && !deviceConfig" class="loading-state">
          <p>正在加载设备配置...</p>
        </div>

        <!-- 错误状态 -->
        <div v-if="deviceError && !deviceLoading" class="error-state">
          <p class="error-message">{{ deviceError }}</p>
        </div>

        <!-- 设备配置表单 -->
        <div v-if="deviceConfig" class="device-config-section">
          <h3>平台配置</h3>
          <form @submit.prevent="handleSaveDeviceConfig" class="device-form">
            <div class="form-grid">
              <!-- Platform Base URL -->
              <div class="form-item">
                <label class="form-label">平台地址 (Platform Base URL):</label>
                <input 
                  type="text" 
                  v-model="editDeviceConfig.platformBaseUrl"
                  placeholder="http://127.0.0.1:8089"
                  class="form-input"
                />
                <span class="form-hint">平台 API 的基础地址</span>
              </div>

              <!-- Device Code -->
              <div class="form-item">
                <label class="form-label">设备代码 (Device Code):</label>
                <input 
                  type="text" 
                  v-model="editDeviceConfig.deviceCode"
                  placeholder="device-001"
                  class="form-input"
                />
                <span class="form-hint">设备标识代码</span>
              </div>

              <!-- Secret -->
              <div class="form-item">
                <label class="form-label">密钥 (Secret):</label>
                <input 
                  type="password" 
                  v-model="editDeviceConfig.secret"
                  placeholder="your-secret-key"
                  class="form-input"
                />
                <span class="form-hint">设备认证密钥</span>
              </div>
            </div>

            <div class="form-actions">
              <button 
                type="submit"
                :disabled="savingDeviceConfig"
                class="btn-save-device"
              >
                {{ savingDeviceConfig ? '保存中...' : '保存配置' }}
              </button>
            </div>
          </form>

          <!-- 只读信息 -->
          <div class="device-readonly-section">
            <h3>设备信息（只读）</h3>
            <div class="readonly-grid">
              <div class="readonly-item">
                <span class="readonly-label">设备 ID:</span>
                <span class="readonly-value">{{ deviceConfig.deviceId || '—' }}</span>
              </div>
              <div class="readonly-item">
                <span class="readonly-label">设备 Token:</span>
                <span class="readonly-value">{{ deviceConfig.deviceToken ? '***' + deviceConfig.deviceToken.slice(-8) : '—' }}</span>
              </div>
              <div class="readonly-item">
                <span class="readonly-label">Token 过期时间:</span>
                <span class="readonly-value">{{ formatTokenExpiresAt(deviceConfig.tokenExpiresAt) }}</span>
              </div>
            </div>
          </div>

          <!-- 平台操作 -->
          <div class="device-platform-actions">
            <h3>平台操作</h3>
            <div class="platform-actions-grid">
              <button 
                @click="handleHandshake"
                :disabled="handshaking"
                class="btn-handshake"
              >
                {{ handshaking ? 'Handshaking...' : 'Handshake' }}
              </button>
              <button 
                @click="handleFetchActivities"
                :disabled="fetchingActivities"
                class="btn-fetch-activities"
              >
                {{ fetchingActivities ? 'Fetching...' : 'Fetch Activities' }}
              </button>
            </div>
          </div>

          <!-- Activities 列表 -->
          <div v-if="activitiesList !== null" class="device-activities-section">
            <h3>Activities List</h3>
            <!-- 缓存标记 -->
            <div v-if="activitiesStale" class="cache-indicator">
              <span class="cache-badge">Using cached data</span>
              <span v-if="activitiesCachedAt" class="cache-time">
                cachedAt: {{ formatCachedAt(activitiesCachedAt) }}
              </span>
            </div>
            <!-- Activities 列表 -->
            <div class="activities-list">
              <div v-if="activitiesList.length === 0" class="activities-empty">
                <p>No activities found</p>
              </div>
              <div v-else class="activities-items">
                <div 
                  v-for="(activity, index) in activitiesList" 
                  :key="index"
                  class="activity-item"
                >
                  <pre class="activity-json">{{ JSON.stringify(activity, null, 2) }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="activeTab === 'cache'" class="tab-content">
        <h2>缓存管理</h2>
        <p>缓存管理功能开发中...</p>
      </div>
      
      <div v-if="activeTab === 'diagnostics'" class="tab-content">
        <h2>诊断信息</h2>
        <p>诊断功能开发中...</p>
      </div>
    </div>
  </div>

  <!-- Toast 提示 -->
  <Toast
    :visible="toastVisible"
    :message="toastMessage"
    :type="toastType"
    @close="toastVisible = false"
  />
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getCameraConfig, getCameraStatus, applyPreset, applyParams, testShot } from '../api/cameraApi'
import { getDeviceConfig, saveDeviceConfig, handshake, getActivities } from '../api/deviceApi'
import Toast from '../components/Toast.vue'

const router = useRouter()

const activeTab = ref('camera')
const tabs = [
  { id: 'camera', label: 'Camera' },
  { id: 'device', label: 'Device & Platform' },
  { id: 'cache', label: 'Cache' },
  { id: 'diagnostics', label: 'Diagnostics' }
]

// 相机数据
const cameraConfig = ref(null)
const cameraStatus = ref(null)
const loading = ref(false)
const error = ref(null)
const toastVisible = ref(false)
const toastMessage = ref('')
const toastType = ref('error')

// 编辑参数
const editParams = ref({
  iso: null,
  whiteBalance: null,
  exposureCompensationEv: null,
  pictureStyle: null,
  aperture: null,
  shutterSpeed: null,
  meteringMode: null
})

// 操作状态
const applyingPreset = ref(null)
const applyingParams = ref(false)
const testingShot = ref(false)
const testShotPath = ref(null)

// 预览状态
const previewOn = ref(false)
const previewImageSrc = ref('')
const previewError = ref(null)
const previewInterval = ref(null)
const previewFps = ref(0)
const lastPreviewTime = ref(null)
const previewLoadCount = ref(0)
const previewFpsStartTime = ref(null)
const previewFpsCount = ref(0)

// 设备配置数据
const deviceConfig = ref(null)
const deviceLoading = ref(false)
const deviceError = ref(null)
const savingDeviceConfig = ref(false)
const editDeviceConfig = ref({
  platformBaseUrl: '',
  deviceCode: '',
  secret: ''
})

// 平台操作状态
const handshaking = ref(false)
const fetchingActivities = ref(false)
const activitiesList = ref(null)
const activitiesStale = ref(false)
const activitiesCachedAt = ref(null)

// 计算激活预设的显示名称
const activePresetDisplayName = computed(() => {
  if (!cameraConfig.value || !cameraConfig.value.activePresetId) return null
  const preset = cameraConfig.value.presets?.find(p => p.id === cameraConfig.value.activePresetId)
  return preset?.displayName || preset?.name || null
})

// 获取当前预设的显示文本（支持自定义显示）
const getCurrentPresetDisplayText = () => {
  if (!cameraConfig.value) return '无'
  
  const activePresetId = cameraConfig.value.activePresetId
  const basePresetId = cameraConfig.value.basePresetId
  
  // 如果是自定义（preset_custom），显示"自定义（由 xxx 修改）"
  if (activePresetId === 'preset_custom' && basePresetId) {
    const basePreset = cameraConfig.value.presets?.find(p => p.id === basePresetId)
    const basePresetName = basePreset?.displayName || basePreset?.name || basePresetId
    return `自定义（由 ${basePresetName} 修改）`
  }
  
  // 如果是普通预设，显示预设名称
  if (activePresetId) {
    const preset = cameraConfig.value.presets?.find(p => p.id === activePresetId)
    return preset?.displayName || preset?.name || activePresetId
  }
  
  return '无'
}

// 计算已修改的参数数量
const modifiedParamsCount = computed(() => {
  if (!cameraConfig.value?.params) return 0
  const currentParams = cameraConfig.value.params
  let count = 0
  Object.keys(editParams.value).forEach(key => {
    const newValue = editParams.value[key]
    const currentValue = currentParams[key]
    if (newValue !== null && newValue !== undefined && newValue !== '' && newValue !== currentValue) {
      count++
    }
  })
  return count
})

// 检查参数是否被修改
const isParamModified = (key) => {
  if (!cameraConfig.value?.params) return false
  const newValue = editParams.value[key]
  const currentValue = cameraConfig.value.params[key]
  return newValue !== null && newValue !== undefined && newValue !== '' && newValue !== currentValue
}

// 格式化 ISO 值
const formatIso = (iso) => {
  if (iso === null || iso === undefined) return 'N/A'
  return iso === 0 ? 'AUTO' : iso.toString()
}

// 格式化曝光补偿值
const formatEv = (ev) => {
  if (ev === null || ev === undefined) return 'N/A'
  return ev >= 0 ? `+${ev}` : ev.toString()
}

// 获取连接状态文本（智能判断）
const getConnectionStatusText = () => {
  if (!cameraStatus.value) return '未知'
  const connected = cameraStatus.value.connected || cameraStatus.value.cameraConnected
  // 如果 connected=false 但 sessionOpened=true 且有相机型号，可能是误报
  if (!connected && cameraStatus.value.sessionOpened && cameraStatus.value.cameraModel) {
    return '可能已连接（待确认）'
  }
  return connected ? '已连接' : '未连接'
}

// 获取连接状态样式类
const getConnectionStatusClass = () => {
  if (!cameraStatus.value) return 'status-error'
  const connected = cameraStatus.value.connected || cameraStatus.value.cameraConnected
  // 如果 connected=false 但 sessionOpened=true 且有相机型号，显示警告色
  if (!connected && cameraStatus.value.sessionOpened && cameraStatus.value.cameraModel) {
    return 'status-warning'
  }
  return connected ? 'status-ok' : 'status-error'
}

// 显示 Toast
const showToast = (message, type = 'error') => {
  toastMessage.value = message
  toastType.value = type
  toastVisible.value = true
}

// 加载相机数据
const loadCameraData = async () => {
  loading.value = true
  error.value = null
  
  try {
    // 并行请求 config 和 status
    const [configRes, statusRes] = await Promise.all([
      getCameraConfig(),
      getCameraStatus()
    ])
    
    cameraConfig.value = configRes
    // status 返回格式是 { success, data, message }
    // data 包含: connected, cameraModel, ok, sdkInitialized, sessionOpened, lastError 等
    if (statusRes.success && statusRes.data) {
      cameraStatus.value = statusRes.data
      // 兼容处理：如果返回的是 connected，也映射到 cameraConnected
      if (statusRes.data.connected !== undefined && statusRes.data.cameraConnected === undefined) {
        cameraStatus.value.cameraConnected = statusRes.data.connected
      }
      // 如果 status 中有 cameraModel，也保存到 config 中（如果 config 没有）
      if (statusRes.data.cameraModel && !cameraConfig.value.cameraModel) {
        cameraConfig.value.cameraModel = statusRes.data.cameraModel
      }
    } else {
      cameraStatus.value = statusRes.data || null
    }
    
    // 初始化编辑参数（从当前配置加载）
    if (cameraConfig.value?.params) {
      editParams.value = {
        iso: cameraConfig.value.params.iso ?? null,
        whiteBalance: cameraConfig.value.params.whiteBalance ?? null,
        exposureCompensationEv: cameraConfig.value.params.exposureCompensationEv ?? null,
        pictureStyle: cameraConfig.value.params.pictureStyle ?? null,
        aperture: cameraConfig.value.params.aperture ?? null,
        shutterSpeed: cameraConfig.value.params.shutterSpeed ?? null,
        meteringMode: cameraConfig.value.params.meteringMode ?? null
      }
    }
  } catch (err) {
    const errorMsg = err?.response?.data?.message || 
                     err?.message || 
                     '无法连接到相机服务，请检查 MVP 服务是否运行在 http://localhost:8080'
    error.value = errorMsg
    showToast(errorMsg, 'error')
    console.error('加载相机数据失败:', err)
  } finally {
    loading.value = false
  }
}

// 应用预设
const handleApplyPreset = async (presetId) => {
  applyingPreset.value = presetId
  testShotPath.value = null
  
  try {
    const res = await applyPreset(presetId)
    
    if (res.success) {
      showToast('预设应用成功', 'success')
      // 刷新配置
      await loadCameraData()
      
      // 应用预设后，同步预设参数到编辑区
      // 优先使用预设的 params，如果没有则使用当前配置的 params
      if (cameraConfig.value) {
        const preset = cameraConfig.value.presets?.find(p => p.id === presetId)
        const paramsToUse = preset?.params || cameraConfig.value.params
        
        if (paramsToUse) {
          editParams.value = {
            iso: paramsToUse.iso ?? null,
            whiteBalance: paramsToUse.whiteBalance ?? null,
            exposureCompensationEv: paramsToUse.exposureCompensationEv ?? null,
            pictureStyle: paramsToUse.pictureStyle ?? null,
            aperture: paramsToUse.aperture ?? null,
            shutterSpeed: paramsToUse.shutterSpeed ?? null,
            meteringMode: paramsToUse.meteringMode ?? null
          }
        }
      }
    } else {
      const errorMsg = res.message || '应用预设失败'
      showToast(errorMsg, 'error')
    }
  } catch (err) {
    const errorMsg = err?.response?.data?.message || 
                     err?.response?.data?.data?.reason ||
                     err?.response?.data?.data?.failedField ||
                     err?.message || 
                     '应用预设失败'
    showToast(errorMsg, 'error')
    console.error('应用预设失败:', err)
  } finally {
    applyingPreset.value = null
  }
}

// 应用参数
const handleApplyParams = async () => {
  applyingParams.value = true
  testShotPath.value = null
  
  try {
    // 只发送与当前配置不同的字段（部分更新）
    const currentParams = cameraConfig.value?.params || {}
    const paramsToSend = {}
    
    Object.keys(editParams.value).forEach(key => {
      const newValue = editParams.value[key]
      const currentValue = currentParams[key]
      
      // 只发送有值且与当前值不同的字段
      if (newValue !== null && newValue !== undefined && newValue !== '') {
        // 比较值是否不同
        if (newValue !== currentValue) {
          paramsToSend[key] = newValue
        }
      }
    })
    
    if (Object.keys(paramsToSend).length === 0) {
      showToast('没有参数变更，请先修改参数', 'error')
      applyingParams.value = false
      return
    }
    
    const res = await applyParams(paramsToSend)
    
    if (res.success && res.data?.applied) {
      showToast('参数应用成功', 'success')
      // 刷新配置
      await loadCameraData()
    } else {
      // 处理部分失败的情况
      let errorMsg = res.message || '应用参数失败'
      if (res.data?.failedField) {
        errorMsg = `参数 ${res.data.failedField} 应用失败`
      }
      if (res.data?.reason) {
        errorMsg += `: ${res.data.reason}`
      }
      showToast(errorMsg, 'error')
    }
  } catch (err) {
    let errorMsg = err?.response?.data?.message || 
                   err?.response?.data?.data?.reason ||
                   err?.response?.data?.data?.failedField ||
                   err?.message || 
                   '应用参数失败'
    
    // 优先显示 failedField 和 reason
    if (err?.response?.data?.data?.failedField) {
      errorMsg = `参数 ${err.response.data.data.failedField} 应用失败`
    }
    if (err?.response?.data?.data?.reason) {
      errorMsg += `: ${err.response.data.data.reason}`
    }
    
    showToast(errorMsg, 'error')
    console.error('应用参数失败:', err)
  } finally {
    applyingParams.value = false
  }
}

// 重置参数到当前配置
const handleResetParams = () => {
  if (cameraConfig.value?.params) {
    editParams.value = {
      iso: cameraConfig.value.params.iso ?? null,
      whiteBalance: cameraConfig.value.params.whiteBalance ?? null,
      exposureCompensationEv: cameraConfig.value.params.exposureCompensationEv ?? null,
      pictureStyle: cameraConfig.value.params.pictureStyle ?? null,
      aperture: cameraConfig.value.params.aperture ?? null,
      shutterSpeed: cameraConfig.value.params.shutterSpeed ?? null,
      meteringMode: cameraConfig.value.params.meteringMode ?? null
    }
    showToast('参数已重置', 'info')
  }
}

// 测试拍照
const handleTestShot = async () => {
  testingShot.value = true
  testShotPath.value = null
  
  try {
    const res = await testShot()
    
    if (res.success && res.data?.path) {
      testShotPath.value = res.data.path
      showToast('测试拍照成功', 'success')
    } else {
      const errorMsg = res.message || '测试拍照失败'
      showToast(errorMsg, 'error')
    }
  } catch (err) {
    const errorMsg = err?.response?.data?.message || 
                     err?.message || 
                     '测试拍照失败'
    showToast(errorMsg, 'error')
    console.error('测试拍照失败:', err)
  } finally {
    testingShot.value = false
  }
}

// 预览相关函数
const PREVIEW_INTERVAL = 300 // 300ms

const handlePreviewToggle = () => {
  if (previewOn.value) {
    startPreview()
  } else {
    stopPreview()
  }
}

const startPreview = () => {
  // 先测试一次，确认接口可用
  previewError.value = null
  previewFpsStartTime.value = Date.now()
  previewFpsCount.value = 0
  
  // 立即更新一次
  updatePreviewImage()
  
  // 启动定时器
  previewInterval.value = setInterval(() => {
    updatePreviewImage()
  }, PREVIEW_INTERVAL)
}

const stopPreview = () => {
  if (previewInterval.value) {
    clearInterval(previewInterval.value)
    previewInterval.value = null
  }
  previewImageSrc.value = ''
  previewFps.value = 0
  lastPreviewTime.value = null
  previewFpsStartTime.value = null
  previewFpsCount.value = 0
  // 不清除 previewError，让用户知道之前出过错误
}

const updatePreviewImage = () => {
  // 使用时间戳避免缓存
  previewImageSrc.value = `http://localhost:8080/local/camera/preview.jpg?t=${Date.now()}`
}

const handlePreviewError = () => {
  previewError.value = 'Preview not available (endpoint missing or camera not ready).'
  // 自动停止刷新
  previewOn.value = false
  stopPreview()
}

const handlePreviewLoad = () => {
  // 清除错误状态
  if (previewError.value) {
    previewError.value = null
  }
  
  // 更新最后加载时间
  lastPreviewTime.value = Date.now()
  
  // 计算 FPS
  previewFpsCount.value++
  if (previewFpsStartTime.value) {
    const elapsed = (Date.now() - previewFpsStartTime.value) / 1000 // 秒
    if (elapsed > 0) {
      previewFps.value = previewFpsCount.value / elapsed
    }
  }
}

const handleRetryPreview = () => {
  previewError.value = null
  previewOn.value = true
  handlePreviewToggle()
}

const formatPreviewTime = (timestamp) => {
  if (!timestamp) return 'N/A'
  const now = Date.now()
  const diff = now - timestamp
  if (diff < 1000) return '刚刚'
  if (diff < 60000) return `${Math.floor(diff / 1000)}秒前`
  return new Date(timestamp).toLocaleTimeString()
}

// 设备配置相关函数
const loadDeviceData = async () => {
  deviceLoading.value = true
  deviceError.value = null
  
  try {
    const res = await getDeviceConfig()
    
    if (res.success && res.data) {
      deviceConfig.value = res.data
      // 初始化编辑表单
      editDeviceConfig.value = {
        platformBaseUrl: res.data.platformBaseUrl || '',
        deviceCode: res.data.deviceCode || '',
        secret: res.data.secret || ''
      }
    } else {
      deviceError.value = res.message || 'Failed to load device config'
    }
  } catch (err) {
    const errorMsg = err?.response?.data?.message || 
                     err?.message || 
                     '无法连接到设备服务，请检查 MVP 服务是否运行在 http://localhost:8080'
    deviceError.value = errorMsg
    showToast(errorMsg, 'error')
    console.error('加载设备配置失败:', err)
  } finally {
    deviceLoading.value = false
  }
}

const handleSaveDeviceConfig = async () => {
  savingDeviceConfig.value = true
  
  try {
    const res = await saveDeviceConfig(editDeviceConfig.value)
    
    if (res.success) {
      showToast('设备配置保存成功', 'success')
      // 刷新配置
      await loadDeviceData()
    } else {
      const errorMsg = res.message || '保存设备配置失败'
      showToast(errorMsg, 'error')
    }
  } catch (err) {
    const errorMsg = err?.response?.data?.message || 
                     err?.message || 
                     '保存设备配置失败'
    showToast(errorMsg, 'error')
    console.error('保存设备配置失败:', err)
  } finally {
    savingDeviceConfig.value = false
  }
}

const formatTokenExpiresAt = (expiresAt) => {
  if (!expiresAt) return '—'
  try {
    const date = new Date(expiresAt)
    if (isNaN(date.getTime())) return expiresAt // Return raw string if invalid
    return date.toLocaleString('zh-CN')
  } catch (e) {
    return expiresAt
  }
}

// Handshake 操作
const handleHandshake = async () => {
  handshaking.value = true
  
  try {
    const res = await handshake()
    
    if (res.success) {
      showToast('Handshake successful', 'success')
      // Reload config to get updated deviceId/token
      await loadDeviceData()
    } else {
      const errorMsg = res.message || 'Handshake failed'
      showToast(errorMsg, 'error')
    }
  } catch (err) {
    const errorMsg = err?.response?.data?.message || 
                     err?.message || 
                     'Handshake failed'
    showToast(errorMsg, 'error')
    console.error('Handshake failed:', err)
  } finally {
    handshaking.value = false
  }
}

// Fetch Activities 操作
const handleFetchActivities = async () => {
  fetchingActivities.value = true
  activitiesList.value = null
  activitiesStale.value = false
  activitiesCachedAt.value = null
  
  try {
    const res = await getActivities()
    
    if (res.success && res.data) {
      activitiesList.value = res.data.items || []
      activitiesStale.value = res.data.stale === true
      activitiesCachedAt.value = res.data.cachedAt || null
      
      if (activitiesStale.value) {
        showToast('Using cached data', 'info')
      } else {
        showToast('Activities fetched successfully', 'success')
      }
    } else {
      const errorMsg = res.message || 'Failed to fetch activities'
      showToast(errorMsg, 'error')
    }
  } catch (err) {
    // Handle HTTP status codes
    const statusCode = err?.response?.status
    const errorData = err?.response?.data
    
    if (statusCode === 401) {
      showToast('Token invalid/expired, please handshake', 'error')
    } else if (statusCode === 503) {
      showToast('Platform unreachable', 'error')
    } else {
      const errorMsg = errorData?.message || 
                       err?.message || 
                       'Failed to fetch activities'
      showToast(errorMsg, 'error')
    }
    console.error('Fetch activities failed:', err)
  } finally {
    fetchingActivities.value = false
  }
}

// Format cachedAt timestamp
const formatCachedAt = (cachedAt) => {
  if (!cachedAt) return ''
  try {
    const date = new Date(cachedAt)
    if (isNaN(date.getTime())) return cachedAt // Return raw string if invalid
    return date.toLocaleString('en-US')
  } catch (e) {
    return cachedAt
  }
}

// 监听 activeTab，切换到对应 tab 时自动加载
watch(activeTab, (newTab) => {
  if (newTab === 'camera' && !cameraConfig.value) {
    loadCameraData()
  } else if (newTab === 'device' && !deviceConfig.value) {
    loadDeviceData()
  }
})

// 60 秒无操作自动退出
const IDLE_TIMEOUT = 60000 // 60 秒
let idleTimer = null

const resetIdleTimer = () => {
  if (idleTimer) {
    clearTimeout(idleTimer)
  }
  idleTimer = setTimeout(() => {
    handleExit()
  }, IDLE_TIMEOUT)
}

const handleUserActivity = () => {
  resetIdleTimer()
}

onMounted(() => {
  resetIdleTimer()
  // 监听所有用户活动
  window.addEventListener('mousedown', handleUserActivity)
  window.addEventListener('mousemove', handleUserActivity)
  window.addEventListener('keydown', handleUserActivity)
  window.addEventListener('touchstart', handleUserActivity)
  window.addEventListener('click', handleUserActivity)
  
  // 如果当前是 camera tab，加载数据
  if (activeTab.value === 'camera') {
    loadCameraData()
  } else if (activeTab.value === 'device') {
    loadDeviceData()
  }
})

onBeforeUnmount(() => {
  if (idleTimer) {
    clearTimeout(idleTimer)
  }
  window.removeEventListener('mousedown', handleUserActivity)
  window.removeEventListener('mousemove', handleUserActivity)
  window.removeEventListener('keydown', handleUserActivity)
  window.removeEventListener('touchstart', handleUserActivity)
  window.removeEventListener('click', handleUserActivity)
  
  // 清理预览定时器
  stopPreview()
})

const handleExit = () => {
  router.push('/')
}
</script>

<style scoped>
.settings-layout {
  min-height: 100vh;
  background: #0b0f1a;
  color: #fff;
  padding: 24px;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.settings-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.btn-exit {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-exit:hover {
  background: rgba(255, 255, 255, 0.15);
}

.settings-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.tab-button {
  padding: 12px 24px;
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: -1px;
}

.tab-button:hover {
  color: rgba(255, 255, 255, 0.8);
}

.tab-button.active {
  color: #2d6cff;
  border-bottom-color: #2d6cff;
}

.settings-content {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 32px;
  min-height: 400px;
}

.tab-content h2 {
  margin: 0 0 16px 0;
  font-size: 22px;
  font-weight: 700;
}

.tab-content p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
}

/* Camera Tab 样式 */
.camera-tab {
  min-height: 400px;
}

.camera-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.camera-header h2 {
  margin: 0;
}

.btn-refresh {
  padding: 8px 16px;
  background: #2d6cff;
  border: 0;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background: #1e5ae6;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-state,
.error-state {
  padding: 24px;
  text-align: center;
}

.error-message {
  color: #ff4444;
  font-size: 14px;
}

.status-section,
.config-section,
.presets-section {
  margin-bottom: 32px;
}

.status-section h3,
.config-section h3,
.presets-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.status-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.status-value {
  font-size: 14px;
  font-weight: 600;
}

.status-ok {
  color: #44ff44;
}

.status-error {
  color: #ff4444;
}

.status-warning {
  color: #ffaa00;
}

.active-preset {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(45, 108, 255, 0.1);
  border: 1px solid rgba(45, 108, 255, 0.3);
  border-radius: 8px;
  margin-bottom: 24px;
}

.active-preset .label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.active-preset .value {
  color: #2d6cff;
  font-size: 16px;
  font-weight: 600;
}

.params-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.params-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.param-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.param-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.param-value {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}

.presets-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preset-item {
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  transition: all 0.2s;
}

.preset-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

.preset-item.active {
  background: rgba(45, 108, 255, 0.1);
  border-color: rgba(45, 108, 255, 0.4);
}

.preset-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.preset-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preset-display-name {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.preset-active-badge {
  padding: 2px 8px;
  background: #2d6cff;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
}

.preset-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.preset-category {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
}

.preset-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag {
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  border-radius: 3px;
}

.preset-preview {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.preview-label {
  margin-right: 8px;
}

.preview-value {
  color: rgba(255, 255, 255, 0.8);
}

.preset-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
}

.btn-apply-preset {
  padding: 6px 16px;
  background: #2d6cff;
  border: 0;
  border-radius: 6px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-apply-preset:hover:not(:disabled) {
  background: #1e5ae6;
}

.btn-apply-preset:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 参数编辑区样式 */
.params-edit-section {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.params-edit-section h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.params-form {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.label-modified {
  color: #ffaa00;
}

.modified-indicator {
  color: #ffaa00;
  font-weight: 700;
  font-size: 16px;
}

.form-select,
.form-input {
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  transition: all 0.2s;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #2d6cff;
  background: rgba(255, 255, 255, 0.08);
}

.input-modified {
  border-color: #ffaa00 !important;
  background: rgba(255, 170, 0, 0.1) !important;
}

.input-modified:focus {
  border-color: #ffaa00 !important;
  background: rgba(255, 170, 0, 0.15) !important;
}

.form-select option {
  background: #1a1f2e;
  color: #fff;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-reset-params {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset-params:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.btn-reset-params:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-apply-params,
.btn-test-shot {
  padding: 10px 20px;
  border: 0;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-apply-params {
  background: #2d6cff;
  color: #fff;
}

.btn-apply-params:hover:not(:disabled) {
  background: #1e5ae6;
}

.btn-test-shot {
  background: #44aa44;
  color: #fff;
}

.btn-test-shot:hover:not(:disabled) {
  background: #339933;
}

.btn-apply-params:disabled,
.btn-test-shot:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.test-shot-result {
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(68, 170, 68, 0.1);
  border: 1px solid rgba(68, 170, 68, 0.3);
  border-radius: 6px;
}

.result-label {
  margin: 0 0 4px 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  font-weight: 500;
}

.result-path {
  margin: 0;
  color: #44aa44;
  font-size: 13px;
  font-family: monospace;
  word-break: break-all;
}

/* 预览区域样式 */
.preview-section {
  margin-bottom: 32px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.preview-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.preview-toggle input[type="checkbox"] {
  width: 48px;
  height: 24px;
  appearance: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s;
}

.preview-toggle input[type="checkbox"]:checked {
  background: #2d6cff;
}

.preview-toggle input[type="checkbox"]::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  top: 2px;
  left: 2px;
  transition: all 0.3s;
}

.preview-toggle input[type="checkbox"]:checked::before {
  left: 26px;
}

.toggle-label {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.btn-retry-preview {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-retry-preview:hover {
  background: rgba(255, 255, 255, 0.15);
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-image-wrapper {
  position: relative;
  width: 100%;
  min-height: 200px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  display: block;
}

.preview-error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  padding: 20px;
}

.preview-error-message {
  color: #ff4444;
  font-size: 14px;
  text-align: center;
  margin: 0;
}

.preview-placeholder {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.preview-status {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.preview-status-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.preview-status-item strong {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}

/* Device Tab 样式 */
.device-tab {
  min-height: 400px;
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.device-header h2 {
  margin: 0;
}

.device-config-section {
  margin-bottom: 32px;
}

.device-config-section h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.device-form {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 32px;
}

.device-form .form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.device-form .form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.device-form .form-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
}

.device-form .form-input {
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  transition: all 0.2s;
}

.device-form .form-input:focus {
  outline: none;
  border-color: #2d6cff;
  background: rgba(255, 255, 255, 0.08);
}

.device-form .form-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.device-form .form-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}

.device-form .form-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-save-device {
  padding: 10px 20px;
  background: #2d6cff;
  border: 0;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save-device:hover:not(:disabled) {
  background: #1e5ae6;
}

.btn-save-device:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.device-readonly-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 24px;
}

.device-readonly-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.readonly-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.readonly-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
}

.readonly-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

.readonly-value {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  font-family: monospace;
  word-break: break-all;
}

/* 平台操作区域 */
.device-platform-actions {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.device-platform-actions h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.platform-actions-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-handshake,
.btn-fetch-activities {
  padding: 10px 20px;
  border: 0;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-handshake {
  background: #2d6cff;
  color: #fff;
}

.btn-handshake:hover:not(:disabled) {
  background: #1e5ae6;
}

.btn-fetch-activities {
  background: #44aa44;
  color: #fff;
}

.btn-fetch-activities:hover:not(:disabled) {
  background: #339933;
}

.btn-handshake:disabled,
.btn-fetch-activities:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Activities 列表区域 */
.device-activities-section {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.device-activities-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.cache-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 170, 0, 0.1);
  border: 1px solid rgba(255, 170, 0, 0.3);
  border-radius: 8px;
  margin-bottom: 16px;
}

.cache-badge {
  padding: 4px 12px;
  background: rgba(255, 170, 0, 0.2);
  color: #ffaa00;
  font-size: 13px;
  font-weight: 600;
  border-radius: 4px;
}

.cache-time {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-family: monospace;
}

.activities-list {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 16px;
}

.activities-empty {
  padding: 24px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.activities-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.activity-json {
  margin: 0;
  padding: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-x: auto;
}
</style>
