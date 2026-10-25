// V4.1 原控件语义 → V10 美术五阶段的适配层。
// 正式课堂页仍只有一根「笔墨凝练」滑杆；本文件额外提供可选的细分参数，
// 供隔离测试页研究「堤宽度/墨色/显影、亭远近、舟大小/位置/透明度」。
import { BOAT_GEOMETRY, BOAT_SOURCE_ANCHOR, STAGE_NODES } from './assetManifest.js';

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(+value) ? +value : 0));

// 中性默认值：正式课堂只传 values 时，这些参数不额外改变画面。
export const NEUTRAL_PARAMS = {
  causeway: { width: 50, tone: 100, reveal: 100 },
  pavilion: { distance: 0 },
  boat: { scale: 0, dx: 0, dy: 0, opacity: 100 },
  people: {}
};

export function createParams(overrides = {}) {
  return {
    causeway: { ...NEUTRAL_PARAMS.causeway, ...(overrides.causeway || {}) },
    pavilion: { ...NEUTRAL_PARAMS.pavilion, ...(overrides.pavilion || {}) },
    boat: { ...NEUTRAL_PARAMS.boat, ...(overrides.boat || {}) },
    people: { ...(overrides.people || {}) }
  };
}

/**
 * 把 0..100 连续值换算为相邻两个美术节点的权重。
 * 默认 'blend'：在节点附近保持原帧，仅在相邻节点中点做短程淡化，
 * 避免整段双线重影；'crossfade' 为全区间线性淡化（研究对照）；'snap' 为最近节点。
 */
export function stageWeights(value, { transition = 'blend', band = 0.36 } = {}) {
  const v = clamp(value);
  if (transition === 'snap') {
    const index = Math.round(v / 25);
    return [{ index, weight: 1 }];
  }
  const pos = v / 25;
  const lo = Math.floor(pos);
  const hi = Math.min(STAGE_NODES.length - 1, lo + 1);
  if (lo === hi) return [{ index: lo, weight: 1 }];
  const frac = pos - lo;
  if (transition === 'crossfade') {
    return [{ index: lo, weight: 1 - frac }, { index: hi, weight: frac }];
  }
  const half = band / 2;
  const t = clamp((frac - (0.5 - half)) / band, 0, 1);
  if (t <= 0) return [{ index: lo, weight: 1 }];
  if (t >= 1) return [{ index: hi, weight: 1 }];
  return [{ index: lo, weight: 1 - t }, { index: hi, weight: t }];
}

function interpolateGeometry(weights) {
  let total = 0;
  const sum = { cx: 0, cy: 0, w: 0 };
  for (const { index, weight } of weights) {
    const node = BOAT_GEOMETRY[STAGE_NODES[index]];
    sum.cx += node.cx * weight;
    sum.cy += node.cy * weight;
    sum.w += node.w * weight;
    total += weight;
  }
  if (!total) return { ...BOAT_GEOMETRY[0] };
  return { cx: sum.cx / total, cy: sum.cy / total, w: sum.w / total };
}

/**
 * 解析一帧：每个对象的美术节点权重、图层可见性、几何变换与不透明度。
 * options.mode: 'A' 几何联动笔墨独立 / 'B' 完全独立 / 'C' 仅形态减笔。
 */
export function resolveFrame(values, options = {}) {
  const {
    transition = 'blend',
    band = 0.36,
    mode = 'A',
    visible = { dike: true, pavilion: true, boat: true, reflection: true, people: true }
  } = options;
  const params = createParams(options.params);
  const weights = {
    dike: stageWeights(values.causeway, { transition, band }),
    pavilion: stageWeights(values.pavilion, { transition, band }),
    boat: stageWeights(values.boat, { transition, band }),
    reflection: stageWeights(values.boat, { transition, band }),
    people: stageWeights(values.people, { transition, band })
  };

  const geometry = interpolateGeometry(weights.boat);
  const extraGeometryActive = mode !== 'C';
  const extraScale = extraGeometryActive ? 1 - clamp(params.boat.scale) / 100 * 0.35 : 1;
  const dx = extraGeometryActive ? clamp(params.boat.dx, -60, 60) : 0;
  const dy = extraGeometryActive ? clamp(params.boat.dy, -40, 40) : 0;

  const boatFrom = { x: geometry.cx, y: geometry.cy };
  const boatTo = { x: geometry.cx + dx, y: geometry.cy + dy };
  const boatTransform = { scaleX: extraScale, scaleY: extraScale, fromX: boatFrom.x, fromY: boatFrom.y, toX: boatTo.x, toY: boatTo.y };

  const peopleFollow = mode === 'A';
  const bakedScale = geometry.w / BOAT_SOURCE_ANCHOR.w;
  const peopleBaked = {
    scaleX: bakedScale,
    scaleY: bakedScale,
    fromX: BOAT_SOURCE_ANCHOR.x,
    fromY: BOAT_SOURCE_ANCHOR.y,
    toX: geometry.cx,
    toY: geometry.cy
  };

  const widthScale = 1 + (clamp(params.causeway.width) - 50) / 50 * 0.16;
  const dikeTransform = { scaleX: 1, scaleY: widthScale, fromX: 50, fromY: 500, toX: 50, toY: 500 };
  const distanceScale = 1 - clamp(params.pavilion.distance) / 100 * 0.26;
  const pavilionTransform = {
    scaleX: distanceScale,
    scaleY: distanceScale,
    fromX: 1039.5,
    fromY: 455.5,
    toX: 1039.5,
    toY: 455.5 - clamp(params.pavilion.distance) / 100 * 7
  };

  return {
    mode,
    transition,
    weights,
    stages: {
      causeway: weights.dike[0] ? STAGE_NODES[weights.dike[0].index] : 0,
      pavilion: STAGE_NODES[weights.pavilion[0]?.index ?? 0],
      boat: STAGE_NODES[weights.boat[0]?.index ?? 0],
      people: STAGE_NODES[weights.people[0]?.index ?? 0]
    },
    geometry,
    peopleFollow,
    boatExtra: {
      scale: extraScale,
      dx,
      dy,
      opacity: clamp(params.boat.opacity) / 100
    },
    transforms: {
      dike: dikeTransform,
      pavilion: pavilionTransform,
      boat: boatTransform,
      reflection: boatTransform,
      peopleBaked,
      peopleExtra: boatTransform
    },
    alpha: {
      dike: clamp(params.causeway.reveal) / 100 * (0.82 + 0.18 * clamp(params.causeway.tone) / 100),
      pavilion: 1 - clamp(params.pavilion.distance) / 100 * 0.15,
      boat: clamp(params.boat.opacity) / 100,
      reflection: clamp(params.boat.opacity) / 100,
      people: 1
    },
    visible: {
      dike: visible.dike !== false,
      pavilion: visible.pavilion !== false,
      boat: visible.boat !== false,
      reflection: visible.reflection !== false,
      people: visible.people !== false
    }
  };
}
