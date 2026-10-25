// V10 对外接口：与旧 renderer.js 的调用面保持兼容，便于后续合并。
// 旧 src/act2/renderer.js 原样保留；正式接入只改 controls.js / Act2Lesson.js 的 import。
export {
  SCENE_SIZE,
  LEGACY_ANCHORS as ASSET_ANCHORS,
  BOAT_STATIC_PROTECTION_BOUNDS,
  PEOPLE_ALLOWED_BOUNDS,
  BOAT_GEOMETRY,
  BOAT_SOURCE_ANCHOR,
  STAGE_NODES,
  ALPHA_PIXEL_COUNT
} from './assetManifest.js';
export { BOAT_STATIC_PROTECTION_BOUNDS as BOAT_STATIC_PROTECTED } from './assetManifest.js';
export { loadArtAssets as loadMaster, resetArtAssetCache } from './assetLoader.js';
export { renderScene, renderScene as renderSceneV10, drawScene, verifyBoatProtection, peopleAlphaMask, imageDataFor, renderPreviewWeights } from './artScene.js';
export { resolveFrame, stageWeights, createParams, NEUTRAL_PARAMS } from './paramAdapter.js';

// 旧接口兼容：预览器/测试仍读取 layerPlan。
export function layerPlan(state) {
  const v = state.values;
  return {
    causeway: v.causeway,
    pavilion: v.pavilion,
    boatStatic: v.boat,
    peopleOnly: v.people,
    boatScale: 1 - v.boat / 200,
    protectedBoat: { x: 1300, y: 585, w: 230, h: 138 },
    allowedPeople: [
      { x: 1330, y: 617, w: 30, h: 38 },
      { x: 1375, y: 615, w: 42, h: 42 },
      { x: 1451, y: 585, w: 31, h: 58 }
    ]
  };
}
