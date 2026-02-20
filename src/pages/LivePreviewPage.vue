<template>
  <div class="card">
    <h2>取景预览</h2>
    <p class="sub">调整姿势与构图，点击开始进入倒计时</p>

    <div class="previewWrap">
      <img
        class="previewImg"
        :src="imgSrc"
        alt="live preview"
        @load="onImageLoad"
        @error="onImageError"
      />

      <div v-if="previewStuck" class="preview-stuck-overlay">
        <p>预览可能卡住，正在尝试恢复…</p>
        <button @click="manualRestart" class="btn btn-secondary btn-lg" :disabled="restarting">
          {{ restarting ? "重启中..." : "手动重启预览" }}
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
import { computed, ref, onMounted, onBeforeUnmount, watch } from "vue";
import { countdown, finish, restartPreview } from "../api/boothApi";
import { clearSession } from "../store/sessionStore";

const props = defineProps({ session: Object });

const loading = ref(false);
const err = ref("");
const imgSrc = ref(""); // 实际绑定给 <img> 的 src
const lastFrameLoadTime = ref(0);
const previewStuck = ref(false);
const restarting = ref(false);

let frameTimer = null; // 拉帧定时器
let healthTimer = null; // 健康检查定时器

// 轮询频率：600ms（从 400ms 降低，更稳定）
const FRAME_INTERVAL_MS = 600;

// 健康检查：5 秒没来帧则认为卡住
const STUCK_THRESHOLD_MS = 5000;

// 重启冷却：避免恶性循环（核心！）
const RESTART_COOLDOWN_MS = 10000;
let lastRestartAt = 0;

// ✅ 单帧 URL（走 mvp 代理，不再使用 MJPEG /preview）
const frameBaseUrl = computed(() => {
  const base = import.meta.env.VITE_BOOTH_API_BASE || "http://localhost:8080";
  return `${base}/local/camera/preview.jpg`;
});

// 拉一帧：用 ?t= 避免浏览器缓存
function refreshFrame() {
  imgSrc.value = `${frameBaseUrl.value}?t=${Date.now()}`;
}

function startFramePolling() {
  stopFramePolling();
  refreshFrame(); // 先来一帧
  frameTimer = setInterval(refreshFrame, FRAME_INTERVAL_MS);
}

function stopFramePolling() {
  if (frameTimer) {
    clearInterval(frameTimer);
    frameTimer = null;
  }
}

// onload：代表"这一帧完成"
function onImageLoad() {
  lastFrameLoadTime.value = Date.now();
  err.value = "";

  // 只要恢复出帧，就取消 stuck 状态
  if (previewStuck.value) previewStuck.value = false;
}

function onImageError() {
  // 单帧模式偶发失败很正常：网络抖动/相机忙
  // 不要立刻重启，交给健康检查 + 冷却处理
  err.value = "预览帧加载失败（将自动重试）";
}

async function restartPreviewSafely(reason) {
  const now = Date.now();
  if (restarting.value) return;
  if (now - lastRestartAt < RESTART_COOLDOWN_MS) {
    console.log(`[preview] Restart cooldown active, skipping (reason: ${reason})`);
    return; // 冷却期内不重启
  }

  restarting.value = true;
  previewStuck.value = true;
  lastRestartAt = now;

  try {
    await restartPreview();
    console.log(`[preview] Restart successful (reason: ${reason})`);
  } catch (e) {
    console.warn("[preview] restartPreview failed:", e);
    err.value = "预览重启失败: " + (e?.response?.data?.error?.message || e.message);
  } finally {
    restarting.value = false;
    // 重启后立即刷新一帧，加快恢复
    refreshFrame();
  }
}

function checkPreviewHealth() {
  const now = Date.now();
  const last = lastFrameLoadTime.value || 0;

  // 如果从未成功加载过帧，先给一点时间
  if (!last) return;

  if (now - last > STUCK_THRESHOLD_MS) {
    if (!previewStuck.value) {
      console.warn("Preview appears stuck, attempting restart...");
      restartPreviewSafely("stuck");
    }
  } else {
    previewStuck.value = false;
  }
}

async function manualRestart() {
  await restartPreviewSafely("manual");
}

onMounted(() => {
  lastFrameLoadTime.value = Date.now();
  startFramePolling();
  healthTimer = setInterval(checkPreviewHealth, 2000);
});

onBeforeUnmount(() => {
  stopFramePolling();
  if (healthTimer) {
    clearInterval(healthTimer);
    healthTimer = null;
  }
});

// 如果 session 变化（比如切换到 LIVE_PREVIEW 新会话），也重置一下时间戳
watch(
  () => props.session?.sessionId,
  () => {
    lastFrameLoadTime.value = 0;
    previewStuck.value = false;
    err.value = "";
    refreshFrame();
  }
);

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
