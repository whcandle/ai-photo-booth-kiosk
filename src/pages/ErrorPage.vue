<template>
  <div class="card">
    <h2>❌ 发生错误</h2>
    <p class="sub">抱歉，处理过程中出现了问题</p>

    <div class="error-details" v-if="session?.error">
      <h3>错误信息</h3>
      <div class="error-code">{{ session.error.code }}</div>
      <div class="error-message">{{ session.error.message }}</div>
      <details v-if="session.error.details" class="error-details-expand">
        <summary>详细信息</summary>
        <pre>{{ JSON.stringify(session.error.details, null, 2) }}</pre>
      </details>
    </div>

    <div class="suggestions">
      <h3>可能的原因</h3>
      <ul>
        <li>相机连接断开或未就绪</li>
        <li>拍照过程中出现异常</li>
        <li>AI 处理服务暂时不可用</li>
        <li>存储空间不足</li>
      </ul>
    </div>

    <div class="actions">
      <button class="primary" @click="handleReset">返回首页</button>
      <button class="ghost" @click="handleRetry" v-if="canRetry">重试</button>
    </div>

    <div class="debug-info" v-if="showDebug">
      <details>
        <summary>调试信息</summary>
        <pre>{{ JSON.stringify(session, null, 2) }}</pre>
      </details>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { finish } from "../api/boothApi";
import { clearSession } from "../store/sessionStore";

const props = defineProps({
  session: Object
});

const emit = defineEmits(["reset"]);

const showDebug = computed(() => {
  return props.session?.error?.code === "PROCESSING_FAILED";
});

const canRetry = computed(() => {
  // 如果错误发生在拍照或处理阶段，可以重试
  return props.session?.error?.code === "PROCESSING_FAILED";
});

async function handleReset() {
  try {
    if (props.session?.sessionId) {
      await finish(props.session.sessionId);
    }
  } catch (e) {
    console.warn("Failed to finish session:", e);
  }
  clearSession();
  emit("reset");
}

async function handleRetry() {
  // 重试：回到首页，让用户重新开始
  await handleReset();
}
</script>

<style scoped>
.sub {
  opacity: 0.8;
  margin-bottom: 16px;
}

.error-details {
  margin: 20px 0;
  padding: 16px;
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: 12px;
}

.error-details h3 {
  font-size: 16px;
  margin-bottom: 12px;
  color: #ff6b6b;
}

.error-code {
  font-family: monospace;
  font-weight: 600;
  color: #ff6b6b;
  margin-bottom: 8px;
}

.error-message {
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 12px;
}

.error-details-expand {
  margin-top: 12px;
}

.error-details-expand pre {
  background: rgba(0, 0, 0, 0.3);
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 12px;
}

.suggestions {
  margin: 20px 0;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
}

.suggestions h3 {
  font-size: 16px;
  margin-bottom: 12px;
}

.suggestions ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.suggestions li {
  padding: 8px 0;
  padding-left: 20px;
  position: relative;
}

.suggestions li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: rgba(255, 255, 255, 0.5);
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.primary {
  background: #2d6cff;
  color: white;
  flex: 1;
}

.ghost {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.debug-info {
  margin-top: 20px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
}

.debug-info pre {
  font-size: 11px;
  overflow-x: auto;
}
</style>
