<template>
  <div class="card page">
    <h2 class="title">扫码下载照片</h2>

    <div class="main">
      <!-- 左：图片 -->
      <section class="left">
        <div v-if="finalImageUrl" class="imgWrap">
          <img class="finalImg" :src="finalImageUrl" alt="最终效果图" />
        </div>
        <p v-else class="sub">正在生成最终效果图…</p>
      </section>

      <!-- 右：二维码+按钮 -->
      <section class="right">
        <div v-if="downloadUrl" class="qr">
          <p class="hint-text">连接热点后扫码下载</p>

          <div class="qrBox">
            <qrcode-vue :value="downloadUrl" :size="qrSize" />
          </div>

          <div class="linkBlock">
            <p class="sub">也可以直接打开链接：</p>
            <p class="link">{{ downloadUrl }}</p>
          </div>

          <a class="btn" :href="downloadUrl" target="_blank" rel="noreferrer">
            打开下载页
          </a>
        </div>

        <p v-else class="sub">正在生成下载链接…</p>
      </section>
    </div>

    <p class="footerHint">30 秒后系统会自动回首页</p>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import QrcodeVue from "qrcode.vue";

const props = defineProps({ session: Object });

const finalImageUrl = computed(() => {
  const u = props.session?.finalUrl;
  return u && u.trim() ? u : "";
});

const downloadUrl = computed(() => {
  const u = props.session?.downloadUrl;
  return u && u.trim() ? u : "";
});

/**
 * ✅ 二维码大小策略（更“保守”）：
 * - 以可视高度为主（因为我们要“一屏内放下”）
 * - 严格限制上限，避免桌面上过大
 */
const qrSize = ref(190);

function calcQrSize() {
  const vh = window.innerHeight || 800;
  // 取屏高的 0.22，更保守；限制 150~220
  const size = Math.floor(vh * 0.22);
  qrSize.value = Math.max(150, Math.min(220, size));
}

onMounted(() => {
  calcQrSize();
  window.addEventListener("resize", calcQrSize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", calcQrSize);
});
</script>

<style scoped>
/* 页面整体：尽量一屏内完成布局 */
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  /* 少一点 padding，给内容留高度 */
  padding: 20px 18px 14px;
}

.title {
  text-align: center;
  margin: 6px 0 10px;
}

/* 主体区域：占用中间剩余空间 */
.main {
  flex: 1;
  min-height: 0; /* ✅ flex 子项允许收缩，避免溢出 */

  display: grid;
  gap: 14px;

  /* ✅ 宽屏左右两栏，更合理 */
  grid-template-columns: 1.8fr 0.7fr;
  align-items: stretch;
}

/* 小屏自动变为上下堆叠 */
@media (max-width: 900px) {
  .main {
    grid-template-columns: 1fr;
  }
}

.left,
.right {
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* ✅ 图片容器：限制宽度 + 关键是“限制高度”，确保完整可见 */
.imgWrap {
  margin: 0 auto;
  width: min(92vw, 920px);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.18);

  /* ✅ 关键：图片区域高度上限（让右侧二维码和按钮也放得下）
     宽屏左右布局时，可以给图片更高一点；小屏则更保守 */
  max-height: 75vh;
}

/* 小屏时，图片高度更保守，给二维码/按钮留空间 */
@media (max-width: 900px) {
  .imgWrap {
    max-height: 44vh;
  }
}

/* ✅ 关键修复：不要再写 height:100% 强行撑满
   用 max-height/width 让它“完整缩放显示” */
.finalImg {
  width: 100%;
  height: auto;
  max-height: 100%;
  display: block;
  object-fit: contain;
}

/* 右侧二维码区：紧凑排版 */
.qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;

  /* 限宽让视觉更集中 */
  width: min(92vw, 520px);
  margin: 0 auto;
}

.qrBox {
  /* 给二维码一个稳定“框”，避免挤压抖动 */
  padding: 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.10);
}

.hint-text {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
  text-align: center;
}

.sub {
  margin: 0;
  opacity: 0.8;
  text-align: center;
}

.linkBlock {
  width: 100%;
}

.link {
  margin: 6px 0 0;
  opacity: 0.8;
  font-size: 12px;
  word-break: break-all;
  text-align: center;
}

/* 按钮 */
.btn {
  display: inline-block;
  background: #2d6cff;
  color: white;
  padding: 12px 16px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 750;
  line-height: 1;
}

/* 底部提示 */
.footerHint {
  margin-top: 10px;
  opacity: 0.65;
  text-align: center;
}

.right {
  max-width: 420px;
}
</style>
