import axios from "axios";

export const cameraApi = axios.create({
  baseURL: "http://localhost:8080",
  timeout: 8000,
});

/**
 * 获取相机配置
 * GET /local/camera/config
 */
export async function getCameraConfig() {
  const res = await cameraApi.get("/local/camera/config");
  return res.data;
}

/**
 * 获取相机状态
 * GET /local/camera/status
 */
export async function getCameraStatus() {
  const res = await cameraApi.get("/local/camera/status");
  return res.data;
}

/**
 * 应用预设
 * POST /local/camera/presets/apply
 */
export async function applyPreset(presetId) {
  const res = await cameraApi.post("/local/camera/presets/apply", {
    presetId
  });
  return res.data;
}

/**
 * 应用相机参数（部分更新）
 * POST /local/camera/apply-params
 */
export async function applyParams(params) {
  const res = await cameraApi.post("/local/camera/apply-params", params);
  return res.data;
}

/**
 * 测试拍照
 * POST /local/camera/test-shot
 */
export async function testShot() {
  const res = await cameraApi.post("/local/camera/test-shot");
  return res.data;
}
