<template>
  <div class="card center">
    <h2>处理中…</h2>

    <div class="bar">
      <div class="fill" :style="{ width: percent + '%' }"></div>
    </div>

    <div class="meta">
      <div>Step: {{ session.progress?.step || "NONE" }}</div>
      <div>{{ session.progress?.message || "处理中" }}</div>
      <div>{{ percent }}%</div>
    </div>

    <p class="sub">超过 30 秒后端会超时回首页</p>
  </div>
</template>

<script setup>
import { computed } from "vue";
const props = defineProps({ session: Object });
const percent = computed(() => props.session?.progress?.percent ?? 0);
</script>

<style scoped>
.center { text-align: center; padding: 48px 18px; }
.bar {
  width: 60%;
  margin: 18px auto;
  height: 14px;
  border-radius: 999px;
  background: rgba(255,255,255,.10);
  overflow: hidden;
}
.fill {
  height: 100%;
  background: #2d6cff;
  transition: width .3s ease;
}
.meta { display: grid; gap: 8px; opacity: .9; }
.sub { margin-top: 14px; opacity: .7; }
</style>
