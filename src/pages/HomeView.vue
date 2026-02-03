<template>
  <div class="app">
    <div class="topbar">
      <div class="title">AI Photo Booth (MVP)</div>
      <div class="status" v-if="session">
        <span>Session: {{ session.sessionId }}</span>
        <span>State: {{ session.state }}</span>
        <span v-if="session.cameraPreviewUrl">Preview: {{ session.cameraPreviewUrl }}</span>
      </div>
    </div>

    <IdlePage
      v-if="!session"
      @started="onStarted"
    />

    <SelectingPage
      v-else-if="session.state === 'SELECTING'"
      :session="session"
      @selected="onSelected"
    />

    <LivePreviewPage
      v-else-if="session.state === 'LIVE_PREVIEW'"
      :session="session"
    />

    <CountdownPage
      v-else-if="session.state === 'COUNTDOWN'"
      :session="session"
      @captured="onCaptured"
    />

    <ProcessingPage
      v-else-if="session.state === 'CAPTURING' || session.state === 'PROCESSING'"
      :session="session"
    />

    <PreviewPage
      v-else-if="session.state === 'PREVIEW'"
      :session="session"
      @retry="onRetry"
      @confirm="onConfirm"
    />

    <DeliveringPage
      v-else-if="session.state === 'DELIVERING' || session.state === 'DONE'"
      :session="session"
    />

    <ErrorPage
      v-else-if="session.state === 'ERROR'"
      :session="session"
      @reset="forceReset"
    />

    <div v-else class="card">
      <h2>Unknown State: {{ session?.state }}</h2>
      <p>Debug: session.state = "{{ session?.state }}" (type: {{ typeof session?.state }})</p>
      <p>Expected: LIVE_PREVIEW</p>
      <details>
        <summary>Full Session Object</summary>
        <pre>{{ JSON.stringify(session, null, 2) }}</pre>
      </details>
      <button @click="forceReset">Back to Home</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from "vue";
import IdlePage from "./IdlePage.vue";
import SelectingPage from "./SelectingPage.vue";
import LivePreviewPage from "./LivePreviewPage.vue";
import CountdownPage from "./CountdownPage.vue";
import ProcessingPage from "./ProcessingPage.vue";
import PreviewPage from "./PreviewPage.vue";
import DeliveringPage from "./DeliveringPage.vue";
import ErrorPage from "./ErrorPage.vue";

import { session, startPolling, stopPolling, clearSession } from "../store/sessionStore";
import { finish } from "../api/boothApi";

const forceReset = async () => {
  try {
    if (session.value?.sessionId) await finish(session.value.sessionId);
  } catch {}
  clearSession();
};

const onStarted = () => {};
const onSelected = () => {};
const onCaptured = () => {};
const onRetry = () => {};
const onConfirm = () => {};

onMounted(() => startPolling(800));
onBeforeUnmount(() => stopPolling());
</script>

<style scoped>
.app {
  font-family: system-ui, -apple-system, Arial, sans-serif;
  min-height: 100vh;
  background: #0b0f1a;
  color: #fff;
  padding: 24px;
}
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}
.title { font-size: 22px; font-weight: 700; }
.status { opacity: 0.85; display: flex; gap: 16px; font-size: 14px; }
.card {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 16px;
  padding: 18px;
}
button {
  cursor: pointer;
  border: 0;
  border-radius: 12px;
  padding: 12px 16px;
  font-weight: 650;
}
</style>
