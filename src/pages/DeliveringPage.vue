<template>
  <div class="card center">
    <h2>扫码下载照片</h2>

    <div v-if="fullUrl" class="qr">
      <qrcode-vue :value="fullUrl" :size="260" />
      <p class="sub">也可以直接打开链接：</p>
      <p class="link">{{ fullUrl }}</p>
      <a class="btn" :href="fullUrl" target="_blank">打开下载页</a>
    </div>

    <p v-else class="sub">正在生成下载链接…</p>

    <p class="hint">30 秒后系统会自动回首页</p>
  </div>
</template>

<script setup>
import { computed } from "vue";
import QrcodeVue from "qrcode.vue";

const props = defineProps({ session: Object });
const backend = "http://localhost:8080";

const fullUrl = computed(() => {
  const u = props.session?.downloadUrl;
  if (!u) return "";
  return backend + u;
});
</script>

<style scoped>
.center { text-align: center; padding: 48px 18px; }
.qr { margin-top: 14px; display: grid; gap: 10px; justify-items: center; }
.sub { opacity: .8; }
.link { opacity: .8; font-size: 12px; word-break: break-all; max-width: 520px; }
.btn {
  display: inline-block;
  background: #2d6cff;
  color: white;
  padding: 10px 14px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 750;
}
.hint { margin-top: 18px; opacity: .65; }
</style>
