<template>
  <div class="card">
    <h2>取景预览</h2>
    <p class="sub">调整姿势与构图，点击开始进入倒计时</p>

    <div class="previewWrap">
      <img 
        class="previewImg" 
        :src="previewUrlWithCache" 
        alt="live preview"
        @load="onImageLoad"
        @error="onImageError"
      />
      <div v-if="previewStuck" class="preview-stuck-overlay">
        <p>预览已停止更新，正在恢复...</p>
        <button @click="manualRestart" class="restart-btn">手动重启预览</button>
      </div>
    </div>

    <div class="actions">
      <button class="primary" :disabled="loading" @click="start">
        {{ loading ? "进入中..." : "开始拍照" }}
      </button>
      <button class="ghost" :disabled="loading" @click="cancel">取消</button>
    </div>

    <p class="hint" v-if="err">{{ err }}</p>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { countdown, finish, restartPreview } from "../api/boothApi";
import { clearSession } from "../store/sessionStore";

const props = defineProps({ session: Object });

const loading = ref(false);
const err = ref("");
const lastFrameLoadTime = ref(Date.now());
const previewStuck = ref(false);
const cacheTimestamp = ref(Date.now());
let healthCheckInterval = null;

// 优先用后端下发的 cameraPreviewUrl（推荐方案）
const previewUrl = computed(() => {
  return props.session?.cameraPreviewUrl || "http://127.0.0.1:18080/preview";
});

// 预览 URL 防缓存：每 500ms 更新一次时间戳
const previewUrlWithCache = computed(() => {
  return `${previewUrl.value}?t=${cacheTimestamp.value}`;
});

// 图片加载成功回调
function onImageLoad() {
  lastFrameLoadTime.value = Date.now();
  previewStuck.value = false;
  // 更新缓存时间戳（每 500ms 更新一次，避免过于频繁）
  const now = Date.now();
  if (now - cacheTimestamp.value > 500) {
    cacheTimestamp.value = now;
  }
}

// 图片加载失败回调
function onImageError() {
  console.warn("Preview image load error");
  // 触发健康检查
  checkPreviewHealth();
}

// 预览健康检查：如果超过 5 秒没有新帧，认为预览卡住
function checkPreviewHealth() {
  const now = Date.now();
  const timeSinceLastFrame = now - lastFrameLoadTime.value;
  
  // 如果超过 5 秒没有新帧，认为预览卡住
  if (timeSinceLastFrame > 5000) {
    if (!previewStuck.value) {
      console.warn("Preview appears stuck, attempting restart...");
      previewStuck.value = true;
      autoRestartPreview();
    }
  } else {
    previewStuck.value = false;
  }
}

// 自动重启预览
async function autoRestartPreview() {
  try {
    await restartPreview();
    console.log("Preview restarted automatically");
    // 重置时间戳，给预览一些时间恢复
    lastFrameLoadTime.value = Date.now();
    cacheTimestamp.value = Date.now();
  } catch (e) {
    console.error("Failed to restart preview:", e);
    err.value = "预览恢复失败: " + (e?.response?.data?.error || e.message);
  }
}

// 手动重启预览
async function manualRestart() {
  previewStuck.value = false;
  err.value = "";
  try {
    await restartPreview();
    lastFrameLoadTime.value = Date.now();
    cacheTimestamp.value = Date.now();
    console.log("Preview restarted manually");
  } catch (e) {
    err.value = "预览重启失败: " + (e?.response?.data?.error || e.message);
  }
}

// 启动健康检查（每 2 秒检查一次）
onMounted(() => {
  lastFrameLoadTime.value = Date.now();
  healthCheckInterval = setInterval(checkPreviewHealth, 2000);
});

// 清理定时器
onBeforeUnmount(() => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
});

async function start() {
  loading.value = true;
  err.value = "";
  try {
    await countdown(props.session.sessionId);
    // 不手动切页面，轮询会拿到 state=COUNTDOWN 自动切
  } catch (e) {
    err.value = e?.response?.data?.error?.message || e.message || "countdown failed";
  } finally {
    loading.value = false;
  }
}

async function cancel() {
  loading.value = true;
  err.value = "";
  try { await finish(props.session.sessionId); } catch {}
  clearSession();
  loading.value = false;
}
</script>

<style scoped>
.sub { opacity: .8; margin-bottom: 12px; }
.previewWrap {
  margin-top: 12px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.03);
  position: relative;
}
.previewImg { width: 100%; display: block; }
.preview-stuck-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: white;
  font-size: 14px;
}
.preview-stuck-overlay p {
  margin: 0;
  opacity: .9;
}
.restart-btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid rgba(45,108,255,.5);
  background: rgba(45,108,255,.3);
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.restart-btn:hover {
  background: rgba(45,108,255,.5);
}
.actions { display: flex; gap: 12px; margin-top: 16px; }
.primary { background: #2d6cff; color: #fff; flex: 1; }
.ghost { background: rgba(255,255,255,0.08); color: #fff; }
.hint { margin-top: 10px; opacity: .85; }
</style>
