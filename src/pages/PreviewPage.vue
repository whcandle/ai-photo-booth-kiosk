<template>
  <div class="card">
    <h2>预览</h2>

    <div class="imgWrap" v-if="session.previewUrl">
      <img :src="backend + session.previewUrl" />
    </div>
    <p v-else class="sub">预览图未生成（不应出现，后端会兜底回收）</p>

    <div class="actions">
      <button class="ghost" :disabled="loading" @click="doRetry">
        重拍（剩余 {{ session.retriesLeft }} 次）
      </button>
      <button class="primary" :disabled="loading" @click="doConfirm">
        {{ loading ? "生成中..." : "确认" }}
      </button>
    </div>

    <p class="hint" v-if="err">{{ err }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { retry, confirm } from "../api/boothApi";

const props = defineProps({ session: Object });
const emit = defineEmits(["retry", "confirm"]);

const backend = "http://localhost:8080";
const loading = ref(false);
const err = ref("");

async function doRetry() {
  loading.value = true;
  err.value = "";
  try {
    await retry(props.session.sessionId);
    emit("retry");
  } catch (e) {
    err.value = e?.response?.data?.error?.message || e.message || "retry failed";
  } finally {
    loading.value = false;
  }
}

async function doConfirm() {
  loading.value = true;
  err.value = "";
  try {
    await confirm(props.session.sessionId);
    emit("confirm");
  } catch (e) {
    err.value = e?.response?.data?.error?.message || e.message || "confirm failed";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.sub { opacity: .8; }
.imgWrap {
  margin: 14px 0;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.12);
}
img { width: 100%; display: block; }
.actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
}
.primary { background: #2d6cff; color: white; flex: 1; }
.ghost { background: rgba(255,255,255,.08); color: white; }
.hint { margin-top: 10px; opacity: .85; }
</style>
