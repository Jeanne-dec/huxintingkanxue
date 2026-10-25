// 统一预加载 / decode / 缓存。一次加载，渲染时不再触网。
import { BASE, STAGE_FILE, STAGE_NODES } from './assetManifest.js';

const assetUrl = path => new URL(`./assets/${path}`, import.meta.url).href;

function loadImage(path) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      const done = () => resolve(image);
      if (image.decode) image.decode().then(done, done);
      else done();
    };
    image.onerror = () => reject(new Error(`V10 素材加载失败：${path}`));
    image.src = assetUrl(path);
  });
}

let cache = null;
let cacheFailed = null;

/**
 * 加载整包分层素材。返回 bundle，供 renderScene 同步绘制。
 * 同一页面内重复调用复用同一个 Promise（切换页面/重绘不会重复下载）。
 */
export function loadArtAssets() {
  if (cache) return Promise.resolve(cache);
  if (cacheFailed) return Promise.reject(cacheFailed);
  const jobs = {
    base: loadImage(BASE.layered),
    original: loadImage(BASE.original)
  };
  for (const family of Object.keys(STAGE_FILE)) {
    jobs[family] = Promise.all(STAGE_NODES.map(stage => loadImage(STAGE_FILE[family](String(stage).padStart(3, '0')))));
  }
  return Promise.all(Object.entries(jobs).map(async ([key, job]) => [key, await job]))
    .then(entries => {
      const bundle = { ready: true, size: { width: 1672, height: 941 } };
      for (const [key, value] of entries) bundle[key] = value;
      cache = bundle;
      return bundle;
    })
    .catch(error => {
      cacheFailed = error;
      throw error;
    });
}

export function resetArtAssetCache() {
  cache = null;
  cacheFailed = null;
}
