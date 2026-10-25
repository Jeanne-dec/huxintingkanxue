/* 顶部教学进度：一行环节名 + 一条横向进度线；只作展示，不参与点击。 */
import {armFullscreenKeep,restoreFullscreenOnLoad} from './fullscreen-keep.js?v=1';
const STAGES=[{id:1,label:'修复雪景'},{id:2,label:'张岱四笔'},{id:3,label:'识人评痴'}];
let bar=null;
armFullscreenKeep();
restoreFullscreenOnLoad();

/* stage 0＝封面（全部未开始），1–3 对应三个环节，4＝课后任务（全部完成）。 */
function clampStage(stage){return Math.min(4,Math.max(0,Number(stage)||0));}

function paint(stage){
  bar.dataset.currentStage=String(stage);
  bar.querySelectorAll('.cp-label,.cp-segment').forEach(node=>{
    const id=Number(node.dataset.stage);
    node.dataset.state=id<stage?'done':id===stage?'current':'pending';
  });
}

export function mountCourseProgress(stage=1){
  if(!bar){
    bar=document.createElement('nav');
    bar.className='course-progress';
    bar.setAttribute('aria-label','教学进度（仅供展示）');
    bar.innerHTML=`<div class="cp-inner"><div class="cp-labels">${STAGES.map(s=>`<span class="cp-label" data-stage="${s.id}">${s.label}</span>`).join('')}</div><div class="cp-track" aria-hidden="true">${STAGES.map(s=>`<i class="cp-segment" data-stage="${s.id}"></i>`).join('')}</div></div><div class="cp-tools"><button class="cp-demo" type="button" aria-label="填入示范答案" title="课堂演示：把预设答案写到当前作答框" hidden>示范填入</button><button class="cp-fs" type="button" aria-label="全屏展示" title="全屏展示（隐藏浏览器导航）">全屏</button></div>`;
    document.body.prepend(bar);
    document.body.classList.add('has-progress');
    const fs=bar.querySelector('.cp-fs');
    const inFrame=window.self!==window.top;
    const syncFs=on=>{
      fs.textContent=on?'退出全屏':'全屏';
      fs.setAttribute('aria-pressed',String(on));
    };
    fs.addEventListener('click',()=>{
      if(inFrame){
        try{window.top.postMessage({type:'huxinting:fs-toggle'},location.origin)}catch{}
        return;
      }
      const promise=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen({navigationUI:'hide'});
      promise?.catch(()=>{});
    });
    document.addEventListener('fullscreenchange',()=>syncFs(Boolean(document.fullscreenElement)));
    window.addEventListener('message',event=>{
      if(event.origin!==location.origin)return;
      const data=event.data||{};
      if(data.type==='huxinting:fs-state')syncFs(Boolean(data.active));
    });
    if(inFrame){
      try{syncFs(Boolean(window.top.document.fullscreenElement))}catch{}
      document.addEventListener('click',event=>{
        const link=event.target.closest?.('a[href]');
        if(!link)return;
        let url;
        try{url=new URL(link.href,location.href)}catch{return}
        if(!url.pathname.endsWith('/index.html'))return;
        event.preventDefault();
        try{window.top.postMessage({type:'huxinting:leave-phase2'},location.origin)}catch{}
      },true);
    }else{
      syncFs(Boolean(document.fullscreenElement));
    }
  }
  paint(clampStage(stage));
  return bar;
}

export function setCourseProgressStage(stage){
  if(!bar)return mountCourseProgress(stage);
  paint(clampStage(stage));
}
