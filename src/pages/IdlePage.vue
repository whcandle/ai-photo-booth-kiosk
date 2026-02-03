<template>
  <div class="idle-page-wrapper">
    <!-- 隐藏入口：左上角 60x60 透明区域 -->
    <div 
      class="hidden-entry" 
      @click="handleHiddenClick"
    ></div>
    
    <div class="card center">
      <h1>欢迎使用 AI Photo Booth</h1>
      <p>点击开始进入拍照流程</p>
      <button class="primary" :disabled="loading" @click="start">
        {{ loading ? "创建中..." : "开始" }}
      </button>
      <p class="hint" v-if="err">{{ err }}</p>
    </div>

    <!-- PIN 对话框 -->
    <PinDialog 
      :visible="showPinDialog" 
      @confirm="handlePinConfirm"
      @cancel="handlePinCancel"
    />
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { createSession } from "../api/boothApi";
import { setSessionId, session, clearSession } from "../store/sessionStore";
import PinDialog from "../components/PinDialog.vue";

const emit = defineEmits(["started"]);
const router = useRouter();
const loading = ref(false);
const err = ref("");
const showPinDialog = ref(false);

// 7 连击检测
const CLICK_COUNT_REQUIRED = 7;
const CLICK_TIMEOUT = 2000; // 2 秒
let clickCount = 0;
let clickTimer = null;

function handleHiddenClick() {
  clickCount++;
  
  // 清除之前的计时器
  if (clickTimer) {
    clearTimeout(clickTimer);
    clickTimer = null;
  }
  
  // 如果达到 7 次，显示 PIN 对话框
  if (clickCount >= CLICK_COUNT_REQUIRED) {
    clickCount = 0;
    showPinDialog.value = true;
    return;
  }
  
  // 设置新的计时器，2 秒后重置计数
  clickTimer = setTimeout(() => {
    clickCount = 0;
    clickTimer = null;
  }, CLICK_TIMEOUT);
}

function handlePinConfirm() {
  showPinDialog.value = false;
  router.push('/settings');
}

function handlePinCancel() {
  showPinDialog.value = false;
  clickCount = 0;
}

onBeforeUnmount(() => {
  if (clickTimer) {
    clearTimeout(clickTimer);
    clickTimer = null;
  }
});

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
.idle-page-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.hidden-entry {
  position: fixed;
  top: 0;
  left: 0;
  width: 60px;
  height: 60px;
  z-index: 9999;
  cursor: pointer;
  /* 完全透明，但可点击 */
  background: transparent;
}

.center { text-align: center; padding: 48px 18px; }
.primary { background: #2d6cff; color: white; font-size: 18px; padding: 14px 22px; }
.hint { margin-top: 16px; opacity: 0.8; }
</style>
