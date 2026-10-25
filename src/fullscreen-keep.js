/* 跨独立页面保持全屏：离开页面前记住全屏状态，下一页加载时自动尝试恢复；
   若浏览器因缺少用户手势拒绝，则等用户第一次点击时补一次。 */
const KEY='huxinting-keep-fullscreen';
let armed=false;

function save(){
  if(!document.fullscreenElement)return;
  try{sessionStorage.setItem(KEY,'1')}catch{}
}

export function armFullscreenKeep(){
  if(armed)return;
  armed=true;
  window.addEventListener('pagehide',save);
  window.addEventListener('beforeunload',save);
}

export function restoreFullscreenOnLoad(){
  let wanted=false;
  try{
    wanted=sessionStorage.getItem(KEY)==='1';
    if(wanted)sessionStorage.removeItem(KEY);
  }catch{}
  if(!wanted)return;
  const enter=()=>{
    if(document.fullscreenElement)return;
    const promise=document.documentElement.requestFullscreen?.({navigationUI:'hide'});
    if(promise?.catch)promise.catch(()=>{});
  };
  enter();
  setTimeout(()=>{
    if(document.fullscreenElement)return;
    const once=()=>{
      document.removeEventListener('pointerdown',once,true);
      enter();
    };
    document.addEventListener('pointerdown',once,true);
  },700);
}
