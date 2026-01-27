import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8080",
  timeout: 8000,
});

// Day7: 生成 Idempotency-Key
function idem(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export async function createSession() {
  const res = await api.post(
    "/api/v1/sessions",
    {
      deviceId: "kiosk-001",
      countdownSeconds: 3,
      maxRetries: 2,
    },
    {
      headers: { "Idempotency-Key": idem("create") },
    }
  );
  return res.data;
}

export async function getSession(sessionId) {
  const res = await api.get(`/api/v1/sessions/${sessionId}`);
  return res.data;
}

export async function listTemplates() {
  const res = await api.get("/api/v1/templates");
  return res.data.items;
}

export async function selectTemplate(sessionId, templateId) {
  const res = await api.post(
    `/api/v1/sessions/${sessionId}/template`,
    { templateId },
    {
      headers: { "Idempotency-Key": idem("template") },
    }
  );
  return res.data;
}

export async function capture(sessionId, attemptIndex) {
  const res = await api.post(
    `/api/v1/sessions/${sessionId}/capture`,
    { attemptIndex },
    {
      headers: { "Idempotency-Key": idem("capture") },
    }
  );
  return res.data;
}

export async function retry(sessionId) {
  const res = await api.post(
    `/api/v1/sessions/${sessionId}/retry`,
    { reason: "USER_RETRY" },
    {
      headers: { "Idempotency-Key": idem("retry") },
    }
  );
  return res.data;
}

export async function confirm(sessionId) {
  const res = await api.post(
    `/api/v1/sessions/${sessionId}/confirm`,
    { action: "CONFIRM" },
    {
      headers: { "Idempotency-Key": idem("confirm") },
    }
  );
  return res.data;
}

export async function finish(sessionId) {
  const res = await api.post(
    `/api/v1/sessions/${sessionId}/finish`,
    { reason: "USER_FINISH" },
    {
      headers: { "Idempotency-Key": idem("finish") },
    }
  );
  return res.data;
}

/**
 * Phase 4: 从 LIVE_PREVIEW 进入 COUNTDOWN（用户点击"开始拍照"）
 */
export async function countdown(sessionId) {
  const res = await api.post(
    `/api/v1/sessions/${sessionId}/countdown`,
    null,
    { headers: { "Idempotency-Key": idem("countdown") } }
  );
  return res.data;
}

/**
 * 相机策略配置 API
 */
export async function listCameraProfiles() {
  const res = await api.get("/api/v1/camera/profiles");
  return res.data;
}

export async function getCameraProfile(id) {
  const res = await api.get(`/api/v1/camera/profiles/${id}`);
  return res.data;
}

export async function applyCameraProfile(id, persist = true) {
  const res = await api.post(`/api/v1/camera/profiles/${id}/apply?persist=${persist}`);
  return res.data;
}

/**
 * 直接设置相机属性（供前端手动调参使用）
 */
export async function setCameraProperty(key, value, persist = false) {
  const res = await api.post(
    "/api/v1/camera/properties/set",
    { key, value, persist },
    { headers: { "Idempotency-Key": idem("property") } }
  );
  return res.data;
}

/**
 * 重启预览（用于预览卡住时的自愈恢复）
 */
export async function restartPreview() {
  const res = await api.post(
    "/api/v1/camera/preview/restart",
    null,
    { headers: { "Idempotency-Key": idem("preview_restart") } }
  );
  return res.data;
}
