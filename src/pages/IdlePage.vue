<template>
  <div class="card center">
    <h1>欢迎使用 AI Photo Booth</h1>
    <p>点击开始进入拍照流程</p>
    <button class="primary" :disabled="loading" @click="start">
      {{ loading ? "创建中..." : "开始" }}
    </button>
    <p class="hint" v-if="err">{{ err }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { createSession } from "../api/boothApi";
import { setSessionId, session, clearSession } from "../store/sessionStore";

const emit = defineEmits(["started"]);
const loading = ref(false);
const err = ref("");

async function start() {
  loading.value = true;
  err.value = "";
  try {
    const s = await createSession();
    setSessionId(s.sessionId);
    session.value = s;
    emit("started");
  } catch (e) {
    err.value = e?.response?.data?.error?.message || e.message || "create failed";
    clearSession();
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.center { text-align: center; padding: 48px 18px; }
.primary { background: #2d6cff; color: white; font-size: 18px; padding: 14px 22px; }
.hint { margin-top: 16px; opacity: 0.8; }
</style>
