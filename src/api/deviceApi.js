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
