<template>
  <div class="card">
    <h2>选择模板</h2>
    <p class="sub">30 秒无操作后，后端会回收回首页（你本地也会自动回欢迎页）</p>

    <!-- 相机策略选择器 -->
    <div class="profile-section" v-if="profiles.length > 0">
      <h3>拍摄场景</h3>
      <div class="profile-controls">
        <select v-model="selectedProfile" class="profile-select">
          <option value="">-- 选择场景策略 --</option>
          <option v-for="p in profiles" :key="p.id" :value="p.id">
            {{ p.displayName }}
          </option>
        </select>
        <label class="persist-checkbox">
          <input type="checkbox" v-model="persistProfile" />
          <span>保存到配置</span>
        </label>
        <button 
          class="profile-apply-btn" 
          :disabled="!selectedProfile || applyingProfile"
          @click="applyProfile"
        >
          {{ applyingProfile ? "应用中..." : "应用策略" }}
        </button>
      </div>
      <!-- 策略应用结果展示 -->
      <div v-if="profileResult" class="profile-result">
        <div v-if="profileResult.success" class="result-success">
          ✅ 策略应用成功
        </div>
        <div v-else class="result-error">
          ❌ 策略应用失败
          <details v-if="profileResult.failedProps && Object.keys(profileResult.failedProps).length > 0">
            <summary>失败详情</summary>
            <ul>
              <li v-for="(error, key) in profileResult.failedProps" :key="key">
                <strong>{{ key }}</strong>: {{ error }}
              </li>
            </ul>
          </details>
        </div>
      </div>
    </div>

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
import { listTemplates, selectTemplate, finish, listCameraProfiles, applyCameraProfile } from "../api/boothApi";
import { clearSession } from "../store/sessionStore";

const props = defineProps({ session: Object });
const emit = defineEmits(["selected"]);

const templates = ref([]);
const profiles = ref([]);
const selected = ref("");
const selectedProfile = ref("");
const persistProfile = ref(false);
const applyingProfile = ref(false);
const profileResult = ref(null);
const loading = ref(false);
const err = ref("");

onMounted(async () => {
  try {
    templates.value = await listTemplates();
    profiles.value = await listCameraProfiles();
    // 默认选择第一个策略
    if (profiles.value.length > 0) {
      selectedProfile.value = profiles.value[0].id;
    }
  } catch (e) {
    console.warn("Failed to load templates or profiles:", e);
  }
});

async function applyProfile() {
  if (!selectedProfile.value) return;
  
  applyingProfile.value = true;
  profileResult.value = null;
  err.value = "";
  
  try {
    const result = await applyCameraProfile(selectedProfile.value, persistProfile.value);
    profileResult.value = result;
    
    if (result.success) {
      console.log("Profile applied successfully:", result);
    } else {
      console.warn("Profile application failed:", result.failedProps);
    }
  } catch (e) {
    err.value = e?.response?.data?.error?.message || e.message || "应用策略失败";
    profileResult.value = {
      success: false,
      failedProps: { _error: err.value }
    };
  } finally {
    applyingProfile.value = false;
  }
}

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

.profile-section {
  margin-bottom: 24px;
  padding: 16px;
  border-radius: 14px;
  background: rgba(255,255,255,.02);
  border: 1px solid rgba(255,255,255,.08);
}

.profile-section h3 {
  font-size: 16px;
  margin-bottom: 12px;
  opacity: .9;
}

.profile-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.profile-select {
  flex: 1;
  min-width: 200px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.06);
  color: white;
  font-size: 14px;
}

.profile-select option {
  background: #1a1a1a;
  color: white;
}

.persist-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  opacity: .8;
  cursor: pointer;
}

.persist-checkbox input[type="checkbox"] {
  cursor: pointer;
}

.profile-apply-btn {
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid rgba(45,108,255,.5);
  background: rgba(45,108,255,.2);
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.profile-apply-btn:hover:not(:disabled) {
  background: rgba(45,108,255,.3);
}

.profile-apply-btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.profile-result {
  margin-top: 12px;
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
}

.result-success {
  color: #4ade80;
  background: rgba(74,222,128,.1);
  border: 1px solid rgba(74,222,128,.3);
}

.result-error {
  color: #f87171;
  background: rgba(248,113,113,.1);
  border: 1px solid rgba(248,113,113,.3);
}

.result-error details {
  margin-top: 8px;
}

.result-error summary {
  cursor: pointer;
  opacity: .9;
}

.result-error ul {
  margin-top: 8px;
  padding-left: 20px;
  list-style: disc;
}

.result-error li {
  margin-top: 4px;
  font-size: 12px;
}

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
