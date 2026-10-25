/* 底部页面小圆点：每一个点对应课件的一页，点击即跳转。
   主课件（index.html）由 app.js 传入当前路由；第二环节各独立页按文件名自动定位。 */
import {DEMO_ROUTES} from './presentation.js';
import {phase2Url} from './phase2-router.js';

const EXCLUDED=new Set(['lesson:du','lesson:chi','lesson:closure']);
export const PAGE_SEQUENCE=DEMO_ROUTES.filter(route=>!EXCLUDED.has(route.id));

const INDEX_URL=new URL('../index.html',import.meta.url);

/* 第二环节独立页 → 路由 id */
const FILE_ROUTES=Object.freeze({
  'pavilion-v8-eight/preview.html':'phase2:pavilion',
  'phase2-debate-preview/portrait.html':'phase2:portrait',
  'phase2-debate-preview/judgment.html':'phase2:judgment',
  'phase2-debate-preview/challenge.html':'phase2:challenge',
  'phase2-bridge/bridge.html':'phase2:bridge',
  'phase2-finale-preview/response.html':'phase2:response',
  'phase2-finale-preview/rating.html':'phase2:rating',
  'phase2-finale-preview/scroll.html':'phase2:scroll',
  'phase2-finale-preview/homework.html':'phase2:homework',
  'phase2-finale-preview/thanks.html':'phase2:thanks'
});

let nav=null,selectHandler=null;

/* 当前页面对应的路由 id：独立页按文件名匹配，其余（主课件）返回空串。 */
export function detectPageRoute(){
  const path=location.pathname.replace(/\\/g,'/');
  for(const [file,route] of Object.entries(FILE_ROUTES))if(path.endsWith(file))return route;
  return '';
}

/* 默认跳转：第二环节走本页；主课件走带 goto 的深链。
   在全屏 iframe 内点主课件的圆点时，交给顶层文档关掉 iframe 再切页，避免把整课套进子页。
   全屏独立页由 fs-shell 接管，用覆盖层换页以保持全屏。 */
function navigate(href){
  if(window.__fsShell?.navigate){window.__fsShell.navigate(href);return}
  location.assign(href);
}

export function goRoute(route){
  if(route.startsWith('phase2:')){navigate(phase2Url(route.slice(7)));return}
  if(window.self!==window.top){
    try{window.top.postMessage({type:'huxinting:phase2-route',route},location.origin)}catch{}
    return;
  }
  const url=new URL(INDEX_URL);
  url.searchParams.set('demo','1');
  url.searchParams.set('preview','0');
  url.searchParams.set('goto',route);
  navigate(url.href);
}

function style(){
  if(document.getElementById('page-dots-style'))return;
  const tag=document.createElement('style');
  tag.id='page-dots-style';
  tag.textContent=`nav.page-dots{position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:90;display:flex;align-items:center;gap:7px;padding:5px 10px;border-radius:999px;background:rgba(28,44,52,.22);backdrop-filter:blur(2px);pointer-events:auto}
nav.page-dots button{width:9px;height:9px;padding:0;border:1px solid rgba(255,255,255,.85);border-radius:50%;background:rgba(255,255,255,.55);cursor:pointer;transition:transform .18s ease,background .18s ease}
nav.page-dots button:hover{background:#fff;transform:scale(1.25)}
nav.page-dots button[aria-current="page"]{background:#fff;transform:scale(1.35);box-shadow:0 0 0 2px rgba(255,255,255,.35)}
nav.page-dots button:focus-visible{outline:2px solid #fff;outline-offset:2px}
body:has(.stage > .preview) nav.page-dots{bottom:56px}
@media(max-width:720px){nav.page-dots{gap:5px;padding:4px 7px}nav.page-dots button{width:7px;height:7px}}`;
  document.head.append(tag);
}

/* 挂载圆点导航；current 为当前路由 id，onSelect 可覆盖默认跳转。 */
export function mountPageDots({current='',onSelect}={}){
  if(onSelect)selectHandler=onSelect;
  if(!nav){
    style();
    nav=document.createElement('nav');
    nav.className='page-dots';
    nav.setAttribute('aria-label','页面导航');
    nav.innerHTML=PAGE_SEQUENCE.map(route=>`<button type="button" data-route="${route.id}" title="${route.label}" aria-label="${route.label}"></button>`).join('');
    nav.addEventListener('click',event=>{
      const dot=event.target.closest('button[data-route]');
      if(!dot)return;
      event.stopPropagation();
      const route=dot.dataset.route;
      (selectHandler||goRoute)(route);
    });
    document.body.append(nav);
  }
  setPageDotsCurrent(current||detectPageRoute());
  return nav;
}

export function setPageDotsCurrent(current){
  if(!nav)return;
  nav.querySelectorAll('button[data-route]').forEach(dot=>{
    if(dot.dataset.route===current)dot.setAttribute('aria-current','page');
    else dot.removeAttribute('aria-current');
  });
}
