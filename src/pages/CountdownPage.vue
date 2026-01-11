<template>
  <div class="card center">
    <h2>请看向镜头</h2>
    <div class="num">{{ left }}</div>
    <p class="sub">倒计时结束会自动拍照（只触发一次）</p>
    <button class="ghost" @click="reset">取消</button>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import { capture, finish } from "../api/boothApi";
import { clearSession } from "../store/sessionStore";

const props = defineProps({ session: Object });
const emit = defineEmits(["captured"]);

const left = ref(props.session?.countdownSeconds ?? 3);
let timer = null;
let captureTriggered = false;

async function triggerCaptureOnce() {
  if (captureTriggered) return;
  captureTriggered = true;
  try {
    await capture(props.session.sessionId, props.session.attemptIndex);
    emit("captured");
  } catch {
    // 后端会兜底，轮询会把你带回欢迎页或进入 ERROR->IDLE
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

watch(() => props.session?.state, (newState) => {
  if (newState === 'COUNTDOWN') {
    startCountdown();
  }
}, { immediate: true });

onMounted(() => {
  startCountdown();
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});

async function reset() {
  try { await finish(props.session.sessionId); } catch {}
  clearSession();
}
</script>

<style scoped>
.center { text-align: center; padding: 48px 18px; }
.num { font-size: 96px; font-weight: 900; margin: 16px 0; }
.sub { opacity: .8; }
.ghost { margin-top: 18px; background: rgba(255,255,255,.08); color: white; }
</style>
