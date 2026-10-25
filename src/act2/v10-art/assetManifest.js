// V10 四笔分层素材清单（V9.1 候选包，未签审，不得自动转正）
// 所有叠加图层均为 1672×941 RGBA；底景为 1672×941 RGB。
export const SCENE_SIZE = { width: 1672, height: 941 };

export const STAGE_NODES = [0, 25, 50, 75, 100];

export const STAGE_FILE = {
  dike: stage => `dike/${stage}.png`,
  pavilion: stage => `pavilion/${stage}.png`,
  boat: stage => `boat/boat_${stage}_no_people.png`,
  reflection: stage => `boat/reflection_${stage}.png`,
  people: stage => `people/${stage}.png`
};

export const BASE = {
  layered: 'base/V9_1_无四对象底景_定点精修候选.png',
  original: 'base/A04_母图_RGB.png'
};

// 实测 alpha 包围盒中心/宽度（2026-10-24，System.Drawing 全像素扫描）。
// 用于推导「小舟几何变化时人物跟随」的坐标映射；不是美术画笔锚点。
export const BOAT_GEOMETRY = {
  0: { cx: 1421, cy: 653.5, w: 257, h: 60 },
  25: { cx: 1421, cy: 653.5, w: 257, h: 60 },
  50: { cx: 1422, cy: 648.5, w: 251, h: 54 },
  75: { cx: 1428, cy: 652.5, w: 183, h: 36 },
  100: { cx: 1405, cy: 657, w: 55, h: 17 }
};

// 人物 0% 时的空间基准（与舟 0% 包围盒共同构成映射源）
export const BOAT_SOURCE_ANCHOR = { x: 1421, y: 653.5, w: 257 };

// V4.1 世代沿用的三个锚点，保留给旧预览器与测试读取。
export const LEGACY_ANCHORS = {
  causeway: { x: 36, y: 425, w: 1020, h: 92 },
  pavilion: { x: 984, y: 390, w: 154, h: 126 },
  boat: { x: 1288, y: 588, w: 238, h: 128 },
  people: [
    { id: 'person-left-seated', x: 1345, y: 626, kind: 'seated' },
    { id: 'person-middle-seated', x: 1396, y: 625, kind: 'seated' },
    { id: 'person-right-standing', x: 1465, y: 597, kind: 'standing' }
  ]
};

export const BOAT_STATIC_PROTECTION_BOUNDS = { x: 1300, y: 585, w: 230, h: 138 };
export const PEOPLE_ALLOWED_BOUNDS = [
  { x: 1330, y: 617, w: 30, h: 38 },
  { x: 1375, y: 615, w: 42, h: 42 },
  { x: 1451, y: 585, w: 31, h: 58 }
];

// 五态实测 alpha 像素数（用于报告与回归）。
// 已知缺陷：people 075 与 100 为同一文件（SHA-256 相同，ART-001）；
// boat / reflection 的 0% 与 25% alpha 像素数相同，但文件与像素内容不同（视觉接近）。
export const ALPHA_PIXEL_COUNT = {
  dike: { 0: 17063, 25: 16816, 50: 16790, 75: 16261, 100: 1977 },
  pavilion: { 0: 4171, 25: 4568, 50: 4602, 75: 3467, 100: 92 },
  boat: { 0: 5559, 25: 5559, 50: 2493, 75: 1223, 100: 382 },
  reflection: { 0: 33484, 25: 33484, 50: 905, 75: 164, 100: 32 },
  people: { 0: 2603, 25: 2481, 50: 1049, 75: 241, 100: 241 }
};
