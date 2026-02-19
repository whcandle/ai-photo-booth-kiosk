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
        <button @click="manualRestart" class="btn btn-secondary btn-lg">
          手动重启预览
        </button>
      </div>
    </div>

    <div class="actions">
      <button class="btn btn-primary btn-lg" :disabled="loading" @click="start">
        {{ loading ? "进入中..." : "开始拍照" }}
      </button>
      <button class="btn btn-secondary btn-lg" :disabled="loading" @click="cancel">
        取消
      </button>
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

const previewUrl = computed(() => {
  return props.session?.cameraPreviewUrl || "http://127.0.0.1:18080/preview";
});

const previewUrlWithCache = computed(() => {
  return `${previewUrl.value}?t=${cacheTimestamp.value}`;
});

function onImageLoad() {
  lastFrameLoadTime.value = Date.now();
  previewStuck.value = false;

  // 适度更新防缓存时间戳（避免过于频繁）
  const now = Date.now();
  if (now - cacheTimestamp.value > 500) {
    cacheTimestamp.value = now;
  }
}

function onImageError() {
  console.warn("Preview image load error");
  checkPreviewHealth();
}

function checkPreviewHealth() {
  const now = Date.now();
  const timeSinceLastFrame = now - lastFrameLoadTime.value;

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

async function autoRestartPreview() {
  try {
    await restartPreview();
    lastFrameLoadTime.value = Date.now();
    cacheTimestamp.value = Date.now();
  } catch (e) {
    err.value = "预览恢复失败: " + (e?.response?.data?.error?.message || e.message);
  }
}

async function manualRestart() {
  previewStuck.value = false;
  err.value = "";
  try {
    await restartPreview();
    lastFrameLoadTime.value = Date.now();
    cacheTimestamp.value = Date.now();
  } catch (e) {
    err.value = "预览重启失败: " + (e?.response?.data?.error?.message || e.message);
  }
}

onMounted(() => {
  lastFrameLoadTime.value = Date.now();
  healthCheckInterval = setInterval(checkPreviewHealth, 2000);
});

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
  } catch (e) {
    err.value = e?.response?.data?.error?.message || e.message || "countdown failed";
  } finally {
    loading.value = false;
  }
}

async function cancel() {
  loading.value = true;
  err.value = "";
  try {
    await finish(props.session.sessionId);
  } catch {}
  clearSession();
  loading.value = false;
}
</script>

<style scoped>
/* 让 card 在全屏时形成“上标题-中预览-下按钮”的三段式布局 */
.card {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.sub {
  opacity: 0.8;
  margin-bottom: 12px;
}

/* ✅ 预览区：吃掉剩余空间 + 大屏限宽居中 */
.previewWrap {
  margin-top: 12px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  position: relative;

  /* 核心：不固定高度，自动占用剩余空间 */
  flex: 1;
  min-height: 280px;

  /* 大屏时限制宽度并居中，更像“取景器” */
  width: min(92vw, 980px);
  align-self: center;
}

/* ✅ 图片完整显示：contain 不裁切 */
.previewImg {
  width: 100%;
  height: 100%;
  display: block;

  object-fit: contain;
  object-position: center;

  /* 让留白更像相机画面 */
  background: rgba(0, 0, 0, 0.35);
}

.preview-stuck-overlay {
  position: absolute;
  inset: 0;
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
  opacity: 0.9;
}

/* ✅ 按钮区 sticky：滚动也能看到 */
.actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  align-items: center;

  position: sticky;
  bottom: 0;

  padding: 12px 0;

  /* 底部渐变遮罩，避免滚动时“压住内容”看不清 */
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(10, 12, 16, 0.75) 35%,
    rgba(10, 12, 16, 1) 100%
  );
}

/* ✅ 简易“UI库风”按钮 */
.btn {
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 12px 18px;
  cursor: pointer;
  font-weight: 700;
  line-height: 1;
  user-select: none;
  transition: transform 0.06s ease, opacity 0.2s ease, background 0.2s ease,
    border-color 0.2s ease;
}
.btn:active {
  transform: scale(0.99);
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-lg {
  padding: 14px 20px;
  font-size: 16px;
  min-height: 46px;
}

.btn-primary {
  background: #2d6cff;
  color: #fff;
  flex: 1;
}
.btn-primary:hover {
  background: rgba(45, 108, 255, 0.92);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.12);
}
.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.12);
}

.hint {
  margin-top: 10px;
  opacity: 0.85;
}
</style>
