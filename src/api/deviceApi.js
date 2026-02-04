import axios from "axios";

export const deviceApi = axios.create({
  baseURL: "http://localhost:8080",
  timeout: 8000,
});

/**
 * Get device configuration
 * GET /local/device/config
 */
export async function getDeviceConfig() {
  const res = await deviceApi.get("/local/device/config");
  return res.data;
}

/**
 * Save device configuration
 * PUT /local/device/config
 */
export async function saveDeviceConfig(config) {
  const res = await deviceApi.put("/local/device/config", config);
  return res.data;
}

/**
 * Execute handshake with platform
 * POST /local/device/handshake
 */
export async function handshake() {
  const res = await deviceApi.post("/local/device/handshake");
  return res.data;
}

/**
 * Get activities list from platform
 * GET /local/device/activities
 */
export async function getActivities() {
  const res = await deviceApi.get("/local/device/activities");
  return res.data;
}