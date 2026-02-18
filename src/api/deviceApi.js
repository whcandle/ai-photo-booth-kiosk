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

/**
 * Get templates list for a specific activity
 * GET /local/device/activities/{activityId}/templates
 * 
 * @param {number} activityId Activity ID
 * @returns {Promise<{success: boolean, data: {items: Array, stale: boolean, cachedAt?: string}, message: string|null}>}
 */
export async function getActivityTemplates(activityId) {
  const res = await deviceApi.get(`/local/device/activities/${activityId}/templates`);
  return res.data;
}

/**
 * Install template package
 * POST /local/device/templates/install
 * 
 * @param {Object} params Installation parameters
 * @param {string} params.templateCode Template code (e.g. "tpl_001")
 * @param {string} params.versionSemver Version semver (e.g. "0.1.0")
 * @param {string} params.downloadUrl Download URL
 * @param {string} params.checksumSha256 SHA256 checksum
 * @returns {Promise<{success: boolean, data: {installedPath: string, indexUpdated: boolean}, message: string|null}>}
 */
export async function installTemplate(params) {
  const res = await deviceApi.post("/local/device/templates/install", {
    templateCode: params.templateCode,
    versionSemver: params.versionSemver,
    downloadUrl: params.downloadUrl,
    checksumSha256: params.checksumSha256
  });
  return res.data;
}