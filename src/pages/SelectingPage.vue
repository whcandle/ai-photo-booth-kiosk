<template>
  <div class="card">
    <h2>选择模板</h2>
    <p class="sub">30 秒无操作后，后端会回收回首页（你本地也会自动回欢迎页）</p>

    <div class="grid">
      <div
        v-for="t in templates"
        :key="t.templateId"
        class="tpl"
        :class="{ active: selected === t.templateId, disabled: !t.enabled }"
        @click="t.enabled && (selected = t.templateId)"
      >
        <div class="name">{{ t.name }}</div>
        <div class="id">{{ t.templateId }}</div>
        <div class="badge" v-if="!t.enabled">disabled</div>
      </div>
    </div>

    <div class="actions">
      <button class="ghost" @click="reset">取消</button>
      <button class="primary" :disabled="!selected || loading" @click="submit">
        {{ loading ? "提交中..." : "下一步" }}
      </button>
    </div>

    <p class="hint" v-if="err">{{ err }}</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { listTemplates, selectTemplate, finish } from "../api/boothApi";
import { clearSession } from "../store/sessionStore";

const props = defineProps({ session: Object });
const emit = defineEmits(["selected"]);

const templates = ref([]);
const selected = ref("");
const loading = ref(false);
const err = ref("");

onMounted(async () => {
  templates.value = await listTemplates();
});

async function submit() {
  loading.value = true;
  err.value = "";
  try {
    await selectTemplate(props.session.sessionId, selected.value);
    emit("selected");
  } catch (e) {
    err.value = e?.response?.data?.error?.message || e.message || "select failed";
  } finally {
    loading.value = false;
  }
}

async function reset() {
  try { await finish(props.session.sessionId); } catch {}
  clearSession();
}
</script>

<style scoped>
.sub { opacity: .8; margin-bottom: 12px; }
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 16px 0;
}
.tpl {
  padding: 14px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.04);
  cursor: pointer;
  position: relative;
}
.tpl.active { border-color: rgba(45,108,255,.9); }
.tpl.disabled { opacity: .35; cursor: not-allowed; }
.name { font-weight: 750; font-size: 18px; }
.id { opacity: .7; font-size: 12px; margin-top: 6px; }
.badge { position: absolute; top: 10px; right: 10px; font-size: 12px; opacity: .8; }
.actions { display: flex; justify-content: space-between; margin-top: 10px; }
.primary { background: #2d6cff; color: white; }
.ghost { background: rgba(255,255,255,.08); color: white; }
.hint { margin-top: 10px; opacity: .85; }
</style>
