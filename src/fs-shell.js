/* 第二环节独立页的全屏导航保护。
   浏览器规定：跨 HTML 文档导航会强制退出全屏，且新页面没有用户手势无法自动恢复。
   因此本页处于全屏时，把“下一页”装进覆盖层 iframe：顶层文档不导航，全屏得以保持；
   若用户主动退出全屏，再把覆盖层当前地址落回顶层，避免停在旧画面。 */
import {phase2Url} from './phase2-router.js';

const INDEX_URL=new URL('../index.html',import.meta.url);
let frame=null;
let installed=false;

function style(){
  if(document.getElementById('fs-shell-style'))return;
  const tag=document.createElement('style');
  tag.id='fs-shell-style';
  tag.textContent='iframe.fs-shell{position:fixed;inset:0;z-index:9000;width:100vw;height:100vh;border:0;background:#0b1116}body.fs-shell-open{overflow:hidden}';
  document.head.append(tag);
}

function postState(){
  if(!frame?.contentWindow)return;
  try{frame.contentWindow.postMessage({type:'huxinting:fs-state',active:Boolean(document.fullscreenElement)},location.origin)}catch{}
}

function openShell(url){
  style();
  if(!frame){
    frame=document.createElement('iframe');
    frame.className='fs-shell';
    frame.setAttribute('allow','fullscreen');
    frame.setAttribute('title','课件页面');
    frame.addEventListener('load',postState);
    document.body.append(frame);
  }
  if(frame.src!==url)frame.src=url;
  document.body.classList.add('fs-shell-open');
  postState();
}

/* 覆盖层内部也会继续翻页，取它当前的地址而不是最初的 src 属性。 */
function shellHref(){
  try{return frame?.contentWindow?.location.href||frame?.src||''}catch{return frame?.src||''}
}

function indexUrl(route){
  const url=new URL(INDEX_URL);
  url.searchParams.set('demo','1');
  url.searchParams.set('preview','0');
  if(route)url.searchParams.set('goto',route);
  return url.href;
}

function routeUrl(route){
  if(route.startsWith('phase2:'))return phase2Url(route.slice(7));
  return indexUrl(route);
}

function toggleFullscreen(){
  const promise=document.fullscreenElement
    ?document.exitFullscreen()
    :document.documentElement.requestFullscreen({navigationUI:'hide'});
  promise?.catch(()=>{});
}

/* 全屏时用覆盖层承载目标地址；其余情况照常跳转。 */
export function fsNavigate(value){
  const url=new URL(value,location.href).href;
  if(!document.fullscreenElement||window.self!==window.top){location.assign(url);return}
  openShell(url);
}

export function installFullscreenShell(){
  if(installed)return;
  installed=true;
  window.__fsShell={navigate:fsNavigate,hasShell:()=>Boolean(frame)};

  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;
    const data=event.data||{};
    if(data.type==='huxinting:fs-toggle')toggleFullscreen();
    else if(data.type==='huxinting:leave-phase2')openShell(indexUrl('act2'));
    else if(data.type==='huxinting:phase2-route'&&typeof data.route==='string')openShell(routeUrl(data.route));
  });

  document.addEventListener('fullscreenchange',()=>{
    if(document.fullscreenElement){postState();return}
    if(frame)location.replace(shellHref());
  });

  /* 全屏时拦截页内链接，避免整页导航把全屏丢掉。 */
  document.addEventListener('click',event=>{
    if(!document.fullscreenElement||window.self!==window.top)return;
    const link=event.target.closest?.('a[href]');
    if(!link||link.hasAttribute('download')||link.target==='_blank')return;
    const raw=link.getAttribute('href');
    if(!raw||raw.startsWith('#')||raw.startsWith('javascript:'))return;
    let url;
    try{url=new URL(raw,location.href)}catch{return}
    if(url.origin!==location.origin)return;
    event.preventDefault();
    openShell(url.href);
  },true);
}
