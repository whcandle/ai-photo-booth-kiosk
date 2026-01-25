import { ref } from "vue";
import { getSession } from "../api/boothApi";

export const sessionId = ref(localStorage.getItem("sessionId") || "");
export const session = ref(null);
export const lastError = ref("");
export const offline = ref(false);

let pollTimer = null;
let failCount = 0;

export function setSessionId(id) {
  sessionId.value = id || "";
  if (id) localStorage.setItem("sessionId", id);
  else localStorage.removeItem("sessionId");
}

export function clearSession() {
  setSessionId("");
  session.value = null;
  lastError.value = "";
  offline.value = false;
  failCount = 0;
}

export function startPolling(intervalMs = 800) {
  stopPolling();
  pollTimer = setInterval(async () => {
    if (!sessionId.value) return;

    try {
      const s = await getSession(sessionId.value);
      session.value = s;
      lastError.value = "";
      offline.value = false;
      failCount = 0;

      // 调试：打印状态变化
      if (s.state) {
        console.log("[SessionStore] Polled session state:", s.state, "cameraPreviewUrl:", s.cameraPreviewUrl);
      }

      // 如果后端把 session 回收成 IDLE，也清掉本地 sessionId，回欢迎页
      if (s.state === "IDLE") {
        clearSession();
      }
    } catch (e) {
      failCount += 1;
      offline.value = true;
      lastError.value = e?.response?.data?.error?.message || e.message || "poll error";

      // Day7: 给用户一个"断网缓冲期"：失败 5 次（约 4 秒）才回首页
      if (failCount >= 5) {
        clearSession();
      }
    }
  }, intervalMs);
}

export function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}
