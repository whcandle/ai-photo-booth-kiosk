import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8080",
  timeout: 8000,
});

export async function createSession() {
  const res = await api.post("/api/v1/sessions", {
    deviceId: "kiosk-001",
    countdownSeconds: 3,
    maxRetries: 2,
  });
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
  const res = await api.post(`/api/v1/sessions/${sessionId}/template`, { templateId });
  return res.data;
}

export async function capture(sessionId, attemptIndex) {
  const res = await api.post(`/api/v1/sessions/${sessionId}/capture`, { attemptIndex });
  return res.data;
}

export async function retry(sessionId) {
  const res = await api.post(`/api/v1/sessions/${sessionId}/retry`, { reason: "USER_RETRY" });
  return res.data;
}

export async function confirm(sessionId) {
  const res = await api.post(`/api/v1/sessions/${sessionId}/confirm`, { action: "CONFIRM" });
  return res.data;
}

export async function finish(sessionId) {
  const res = await api.post(`/api/v1/sessions/${sessionId}/finish`, { reason: "USER_FINISH" });
  return res.data;
}
