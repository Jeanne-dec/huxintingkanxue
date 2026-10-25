// V10 叠层渲染器：单一 1672×941 坐标系，全部图层共用一个画布与一次 rAF。
// 绘制顺序：底景 → 长堤 → 湖心亭 → 舟影/水纹 → 舟体 → 舟中三人。
import { SCENE_SIZE } from './assetManifest.js';
import { resolveFrame, stageWeights } from './paramAdapter.js';

const WIDTH = SCENE_SIZE.width;
const HEIGHT = SCENE_SIZE.height;

function withTransform(ctx, transform, draw) {
  ctx.save();
  ctx.translate(transform.toX, transform.toY);
  ctx.scale(transform.scaleX, transform.scaleY);
  ctx.translate(-transform.fromX, -transform.fromY);
  draw();
  ctx.restore();
}

function paintFamily(ctx, bundle, family, weights, transform, alpha, nestedTransform) {
  for (const { index, weight } of weights) {
    const image = bundle[family]?.[index];
    if (!image) continue;
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha * weight));
    const draw = () => {
      if (nestedTransform) withTransform(ctx, nestedTransform, () => ctx.drawImage(image, 0, 0, WIDTH, HEIGHT));
      else ctx.drawImage(image, 0, 0, WIDTH, HEIGHT);
    };
    if (transform) withTransform(ctx, transform, draw);
    else draw();
  }
  ctx.globalAlpha = 1;
}

export function drawScene(ctx, frame, bundle) {
  if (frame.compareOriginal) {
    ctx.drawImage(bundle.original, 0, 0, WIDTH, HEIGHT);
    return;
  }
  ctx.drawImage(bundle.base, 0, 0, WIDTH, HEIGHT);

  const order = ['dike', 'pavilion', 'reflection', 'boat', 'people'];
  for (const family of order) {
    if (!frame.visible[family]) continue;
    if (!frame.alpha[family]) continue;
    if (family === 'people') {
      // A：随舟几何烘焙缩放 + 额外几何；B/C：人物固定在 0% 位置，仅自身写意变化。
      paintFamily(
        ctx,
        bundle,
        family,
        frame.weights.people,
        frame.peopleFollow ? frame.transforms.peopleExtra : null,
        frame.alpha.people,
        frame.peopleFollow ? frame.transforms.peopleBaked : null
      );
    } else {
      const transform = family === 'reflection' || family === 'boat' ? frame.transforms.boat : frame.transforms[family];
      paintFamily(ctx, bundle, family, frame.weights[family], transform, frame.alpha[family]);
    }
  }
}

/**
 * 同步绘制。bundle 必须已由 loadMaster()/loadArtAssets() 预加载完成。
 * 拖动滑杆时由调用方合并为一次 requestAnimationFrame。
 */
export function renderScene(canvas, state, bundle, options = {}) {
  if (!canvas) return null;
  if (canvas.width !== WIDTH) canvas.width = WIDTH;
  if (canvas.height !== HEIGHT) canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  if (!bundle?.ready) return null;
  const values = state?.values || { causeway: 0, pavilion: 0, boat: 0, people: 0 };
  const frame = resolveFrame(values, options);
  frame.compareOriginal = state?.compareOriginal === true;
  drawScene(ctx, frame, bundle);
  return frame;
}

export function renderPreviewWeights(value, options) {
  return stageWeights(value, options);
}

/**
 * 由人物五态图层自身的 alpha 合成「人物可能改动的像素掩码」。
 * 这比固定矩形更严格：矩形只能证明「没跑到船外」，掩码能证明
 * 「所有改动都落在人物图层自身的笔触范围内」。
 */
export function peopleAlphaMask(bundle) {
  if (typeof document === 'undefined' || !bundle?.ready) return null;
  if (bundle.peopleMask) return bundle.peopleMask;
  const mask = new Uint8Array(WIDTH * HEIGHT);
  const buffer = document.createElement('canvas');
  buffer.width = WIDTH;
  buffer.height = HEIGHT;
  const ctx = buffer.getContext('2d', { willReadFrequently: true });
  for (const image of bundle.people) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(image, 0, 0, WIDTH, HEIGHT);
    const data = ctx.getImageData(0, 0, WIDTH, HEIGHT).data;
    for (let i = 3, p = 0; i < data.length; i += 4, p++) if (data[i] > 0) mask[p] = 1;
  }
  // 抗锯齿边缘允许 2px 外扩，避免 alpha=1 的过渡像素被当作越界。
  const grown = new Uint8Array(mask);
  for (let y = 1; y < HEIGHT - 1; y++) {
    for (let x = 1; x < WIDTH - 1; x++) {
      const p = y * WIDTH + x;
      if (mask[p]) {
        grown[p - 1] = 1; grown[p + 1] = 1;
        grown[p - WIDTH] = 1; grown[p + WIDTH] = 1;
      }
    }
  }
  bundle.peopleMask = grown;
  return grown;
}

/**
 * 人物滑杆不得改变舟体/舟篷/湖水像素。V10 中船与人物是独立图层，
 * 这里做真实像素回归：比较 people=0 / people=100 两次渲染，
 * 跳过人物图层自身 alpha 覆盖的像素。
 */
export function verifyBoatProtection(bundle, region = { x: 1300, y: 585, w: 230, h: 138 }) {
  if (typeof document === 'undefined' || !bundle?.ready) return { tested: false, reason: '素材未加载或无 DOM Canvas' };
  const mask = peopleAlphaMask(bundle);
  const base = { values: { causeway: 0, pavilion: 0, boat: 0, people: 0 }, compareOriginal: false };
  const a = document.createElement('canvas');
  const b = document.createElement('canvas');
  renderScene(a, base, bundle);
  renderScene(b, { ...base, values: { ...base.values, people: 100 } }, bundle);
  const dataOf = canvas => canvas.getContext('2d', { willReadFrequently: true }).getImageData(region.x, region.y, region.w, region.h).data;
  const pa = dataOf(a);
  const pb = dataOf(b);
  let differing = 0;
  let masked = 0;
  for (let y = 0; y < region.h; y++) {
    for (let x = 0; x < region.w; x++) {
      const i = (y * region.w + x) * 4;
      const gx = region.x + x;
      const gy = region.y + y;
      if (mask[gy * WIDTH + gx]) { masked++; continue; }
      if (pa[i] !== pb[i] || pa[i + 1] !== pb[i + 1] || pa[i + 2] !== pb[i + 2] || pa[i + 3] !== pb[i + 3]) differing++;
    }
  }
  return { tested: true, pass: differing === 0, differing, masked, region, method: 'people-alpha-mask' };
}

export function imageDataFor(canvas, x, y, w, h) {
  return canvas.getContext('2d', { willReadFrequently: true }).getImageData(x, y, w, h).data;
}
