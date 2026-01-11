import { ref } from "vue";
import { getSession } from "../api/boothApi";

export const sessionId = ref(localStorage.getItem("sessionId") || "");
export const session = ref(null);
export const lastError = ref("");

let pollTimer = null;

export function setSessionId(id) {
  sessionId.value = id || "";
  if (id) localStorage.setItem("sessionId", id);
  else localStorage.removeItem("sessionId");
}

export function clearSession() {
  setSessionId("");
  session.value = null;
  lastError.value = "";
}

export function startPolling(intervalMs = 800) {
  stopPolling();
  pollTimer = setInterval(async () => {
    if (!sessionId.value) return;

    try {
      const s = await getSession(sessionId.value);
      session.value = s;
      lastError.value = "";
      // 如果后端把 session 回收成 IDLE，也清掉本地 sessionId，回欢迎页
      if (s.state === "IDLE") {
        clearSession();
      }
    } catch (e) {
      // 404 或网络错误：清掉，回欢迎页
      lastError.value = e?.response?.data?.error?.message || e.message || "poll error";
      clearSession();
    }
  }, intervalMs);
}

export function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}
