<template>
  <div class="card">
    <h2>取景预览</h2>
    <p class="sub">调整姿势与构图，点击开始进入倒计时</p>

    <div class="previewWrap">
      <img class="previewImg" :src="previewUrl" alt="live preview" />
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
import { computed, ref } from "vue";
import { countdown, finish } from "../api/boothApi";
import { clearSession } from "../store/sessionStore";

const props = defineProps({ session: Object });

const loading = ref(false);
const err = ref("");

// 优先用后端下发的 cameraPreviewUrl（推荐方案）
const previewUrl = computed(() => {
  return props.session?.cameraPreviewUrl || "http://127.0.0.1:18080/preview";
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
}
.previewImg { width: 100%; display: block; }
.actions { display: flex; gap: 12px; margin-top: 16px; }
.primary { background: #2d6cff; color: #fff; flex: 1; }
.ghost { background: rgba(255,255,255,0.08); color: #fff; }
.hint { margin-top: 10px; opacity: .85; }
</style>
