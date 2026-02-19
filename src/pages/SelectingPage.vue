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
        <!-- Skeleton：仅在“应该加载图片且尚未加载完成”时显示 -->
        <div
          v-if="shouldShowSkeleton(t)"
          class="skeleton"
        />

        <!-- 预览图（存在且未失败才渲染） -->
        <img
          v-if="t.previewImageUrl && !brokenMap[t.templateId]"
          class="tpl-img"
          :class="{ 'img-loading': loadingMap[t.templateId] !== false }"
          :src="imgSrc(t)"
          :alt="t.name || t.templateId"
          @load="onImgLoad(t)"
          @error="onImgError(t, $event)"
        />

        <!-- Fallback 文本（无图或加载失败时显示） -->
        <div v-if="!t.previewImageUrl || brokenMap[t.templateId]" class="fallback">
          <div class="name">{{ t.name || t.templateId }}</div>
          <div class="id">{{ t.templateId }}</div>
        </div>

        <!-- 选中态遮罩（边框高亮） -->
        <div v-if="selected === t.templateId" class="selected-overlay"></div>

        <!-- 禁用态遮罩 -->
        <div v-if="!t.enabled" class="disabled-overlay">
          <div class="badge">disabled</div>
        </div>
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
import { onMounted, ref, reactive } from "vue";
import { listTemplates, selectTemplate, finish } from "../api/boothApi";
import { clearSession } from "../store/sessionStore";

const props = defineProps({ session: Object });
const emit = defineEmits(["selected"]);

const templates = ref([]);
const selected = ref("");
const loading = ref(false);
const err = ref("");

// 图片状态：失败/加载中
const brokenMap = reactive({});
const loadingMap = reactive({});

// A：显式 API_BASE（生产可配置）
// 开发默认 http://localhost:8080（你的 mvp）
// 你可以在 .env.local 里加：VITE_BOOTH_API_BASE=http://localhost:8080
const API_BASE = import.meta.env.VITE_BOOTH_API_BASE || "http://localhost:8080";

function normalizeApiBase(base) {
  return (base || "").replace(/\/$/, "");
}

function imgSrc(t) {
  if (!t?.previewImageUrl) return "";
  const raw = t.previewImageUrl;

  // 已经是绝对 URL，直接使用
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw + (raw.includes("?") ? "&" : "?") + "v=" + encodeURIComponent(t.versionSemver || "");
  }

  // 相对 URL：拼到 API_BASE（避免走 5173 同域导致 404）
  const full = normalizeApiBase(API_BASE) + raw;
  return full + (full.includes("?") ? "&" : "?") + "v=" + encodeURIComponent(t.versionSemver || "");
}

function shouldShowSkeleton(t) {
  // 需要加载图片、没失败、且还没 load 成功时显示 skeleton
  return !!t.previewImageUrl && !brokenMap[t.templateId] && loadingMap[t.templateId] !== false;
}

function onImgLoad(t) {
  console.log("img loaded", t.templateId, imgSrc(t));
  loadingMap[t.templateId] = false;
}

function onImgError(t, ev) {
  console.warn("img error", t.templateId, imgSrc(t), ev);
  loadingMap[t.templateId] = false;
  brokenMap[t.templateId] = true;
}

onMounted(async () => {
  try {
    const resp = await listTemplates();
    // 兼容 listTemplates() 返回数组 或 {items:[...]}
    const items = Array.isArray(resp) ? resp : (resp?.items || []);
    templates.value = items;

    console.log("listTemplates() raw response:", resp);
    console.log("templates.value (final array):", items);
    items.forEach((t, i) => {
      console.log(
        `Template[${i}]: templateId=${t.templateId}, previewImageUrl=${t.previewImageUrl}, name=${t.name}, enabled=${t.enabled}`
      );
    });

    // 初始化：有 previewImageUrl 的都默认处于“加载中”（loadingMap key 不存在则视为 loading）
    // 不需要显式写 loadingMap[...] = true；shouldShowSkeleton 用 !== false 判断即可
  } catch (e) {
    console.warn("Failed to load templates:", e);
    err.value = e?.response?.data?.error?.message || e.message || "load templates failed";
  }
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
  try {
    await finish(props.session.sessionId);
  } catch {}
  clearSession();
}
</script>

<style scoped>
.sub { opacity: .8; margin-bottom: 12px; }

/* ✅ 网格：自动适配列数 + 居中 */
.grid {
  display: grid;
  /* 宽屏自动多列，窄屏自动少列 */
  grid-template-columns: repeat(auto-fit, minmax(220px, 280px));
  gap: 16px;
  margin: 16px 0;

  /* 居中排列 */
  justify-content: center;

  /* 防止撑得太宽导致视觉不协调（可选） */
  width: 100%;
}

/* ✅ 卡片：不要固定高度，改用比例盒子 */
.tpl {
  /* 竖版更合适：你也可以改成 9/16 或 2/3 */
  aspect-ratio: 3 / 4;

  width: 100%;
  max-width: 280px;

  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.04);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s;
}

.tpl.active {
  border-color: rgba(45,108,255,.9);
  border-width: 2px;
}

.tpl.disabled {
  opacity: .35;
  cursor: not-allowed;
}

/* Skeleton */
.skeleton {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.06) 25%,
    rgba(255, 255, 255, 0.12) 50%,
    rgba(255, 255, 255, 0.06) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  z-index: 0;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ✅ Image：显示完整，不裁切 */
.tpl-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;

  /* 关键：contain 才能“完整显示” */
  object-fit: contain;
  object-position: center;

  display: block;
  z-index: 1;

  /* 有些图片比例差异大，留白时有个柔和底色 */
  background: rgba(0, 0, 0, 0.18);
}

/* 加载中先隐藏，load 后显示（避免“半加载”闪烁） */
.img-loading {
  opacity: 0;
}

/* fallback 文字 */
.fallback {
  position: absolute;
  inset: 0;
  padding: 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  z-index: 0;
}

.fallback .name {
  font-weight: 750;
  font-size: 18px;
  margin-bottom: 6px;
}

.fallback .id {
  opacity: .7;
  font-size: 12px;
}

/* overlays */
.selected-overlay {
  position: absolute;
  inset: 0;
  border: 2px solid rgba(45,108,255,.9);
  border-radius: 14px;
  pointer-events: none;
  z-index: 2;
}

.disabled-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,.5);
  border-radius: 14px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 10px;
  pointer-events: none;
  z-index: 3;
}

.badge {
  font-size: 12px;
  opacity: .8;
  background: rgba(0,0,0,.6);
  padding: 4px 8px;
  border-radius: 4px;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.primary {
  background: #2d6cff;
  color: white;
}

.ghost {
  background: rgba(255,255,255,.08);
  color: white;
}

.hint {
  margin-top: 10px;
  opacity: .85;
}

</style>
