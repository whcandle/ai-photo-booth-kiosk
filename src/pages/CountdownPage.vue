<template>
  <!-- 全屏（铺满父容器的内容区），背景为预览 -->
  <div class="countdown-screen">
    <!-- 背景预览图（失败则不渲染） -->
    <img
      v-if="!previewFailed"
      class="preview-bg"
      :src="imgSrc"
      alt="camera preview"
      @load="onImageLoad"
      @error="handlePreviewError"
    />
    <!-- 半透明遮罩（无预览时相当于深色背景） -->
    <div class="preview-overlay"></div>

    <!-- 倒计时内容卡片（叠加在预览之上） -->
    <div class="card countdown-card">
      <div class="center">
        <h2>请看向镜头</h2>
        <div class="num">{{ left }}</div>
        <p class="sub">倒计时结束会自动拍照（只触发一次）</p>
        <button class="ghost" @click="reset">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, watch, computed } from "vue";
import { capture, finish } from "../api/boothApi";
import { clearSession } from "../store/sessionStore";

const props = defineProps({ session: Object });
const emit = defineEmits(["captured"]);

const left = ref(props.session?.countdownSeconds ?? 3);

let timer = null; // 倒计时 timer
let captureTriggered = false;

// 预览相关（失败不影响倒计时）
const previewFailed = ref(false);
const imgSrc = ref(""); // 实际绑定给 <img> 的 src
let frameTimer = null; // 预览刷新 timer

// 轮询频率：600ms（从 400ms 降低，更稳定）
const FRAME_INTERVAL_MS = 600;

// ✅ 单帧 URL（走 mvp 代理，不再使用 MJPEG /preview）
const frameBaseUrl = computed(() => {
  const base = import.meta.env.VITE_BOOTH_API_BASE || "http://localhost:8080";
  return `${base}/local/camera/preview.jpg`;
});

// 拉一帧：用 ?t= 避免浏览器缓存
function refreshFrame() {
  imgSrc.value = `${frameBaseUrl.value}?t=${Date.now()}`;
}

function startPreviewRefresh() {
  stopPreviewRefresh();
  previewFailed.value = false;
  refreshFrame(); // 先来一帧
  frameTimer = setInterval(refreshFrame, FRAME_INTERVAL_MS);
}

function stopPreviewRefresh() {
  if (frameTimer) {
    clearInterval(frameTimer);
    frameTimer = null;
  }
}

function onImageLoad() {
  previewFailed.value = false;
}

function handlePreviewError() {
  // 单帧模式偶发失败很正常：网络抖动/相机忙
  // 不要立刻停止，继续尝试
  previewFailed.value = true;
}

async function triggerCaptureOnce() {
  if (captureTriggered) return;
  captureTriggered = true;
  try {
    await capture(props.session.sessionId, props.session.attemptIndex);
    emit("captured");
  } catch {
    // 后端会兜底，轮询会带你进入 ERROR 或回到欢迎页
  }
}

function startCountdown() {
  if (timer) clearInterval(timer);

  captureTriggered = false;
  left.value = props.session?.countdownSeconds ?? 3;

  timer = setInterval(async () => {
    left.value -= 1;

    if (left.value <= 0) {
      clearInterval(timer);
      timer = null;
      await triggerCaptureOnce();
    }
  }, 1000);
}

/**
 * 启动规则（防止 session 轮询导致反复重置）：
 * 1) 仅在 state 从非 COUNTDOWN -> COUNTDOWN 时启动一次
 * 2) 如果 sessionId 变化（新会话），也应重新启动（即使 state 已经是 COUNTDOWN）
 */
const lastState = ref(null);
const lastSessionId = ref(null);

watch(
  () => [props.session?.sessionId, props.session?.state],
  ([sid, state]) => {
    const prevState = lastState.value;
    const prevSid = lastSessionId.value;

    const isNewSession = sid && sid !== prevSid;
    const enteredCountdown = state === "COUNTDOWN" && prevState !== "COUNTDOWN";

    if (state === "COUNTDOWN" && (enteredCountdown || isNewSession)) {
      startCountdown();
      startPreviewRefresh();
    }

    lastState.value = state;
    lastSessionId.value = sid;
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
  stopPreviewRefresh();
});

// 如果 session 变化（比如切换到 COUNTDOWN 新会话），也重置一下
watch(
  () => props.session?.sessionId,
  () => {
    previewFailed.value = false;
    refreshFrame();
  }
);

async function reset() {
  try {
    await finish(props.session.sessionId);
  } catch {}
  clearSession();
}
</script>

<style scoped>
/* 铺满父容器内容区（不覆盖顶栏的关键：依赖父容器高度与定位） */
.countdown-screen {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #05060a; /* 预览失败兜底 */
}

/* 背景预览图全屏 cover */
.preview-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 半透明黑色遮罩，保证文字清晰；无预览时就是纯深色背景 */
.preview-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
}

/* 倒计时内容卡片 */
.countdown-card {
  position: relative;
  z-index: 10;

  width: min(1100px, 92vw);
  margin: 0 auto;

  /* 让卡片视觉上靠上但不贴顶，可按你喜好调整 */
  top: 12vh;

  padding: 48px 18px;
}

.center {
  text-align: center;
}

.num {
  font-size: 96px;
  font-weight: 900;
  margin: 16px 0;
}

.sub {
  opacity: 0.85;
}

.ghost {
  margin-top: 18px;
  background: rgba(255, 255, 255, 0.08);
  color: white;
}
</style>
