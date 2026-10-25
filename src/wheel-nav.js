/* 滚轮翻页：向下滚＝下一页，向上滚＝上一页。
   输入框、滑杆、弹层与工作台控制面板内的滚动不拦截。 */
const BLOCK='textarea,input,select,option,.demo-panel,.original-panel,.act2-control,[data-source-modal],[data-pop],.feedback';

const NEXT_SELECTORS=[
  '[data-action="next-white"]',
  '[data-action="next"]',
  '.bridge-step.current [data-bridge-next]',
  '[data-enter-challenge]',
  '[data-enter-bridge]',
  '[data-enter-response]',
  '[data-save-response]',
  '[data-next]',
  '[data-complete]',
  '[data-l="next"]',
  '[data-l="nextLesson"]',
  '[data-act2-action="lesson"]',
  '.prompt',
  '.player-nav .nav-continue'
];

const PREV_SELECTORS=[
  '[data-prev]',
  '[data-prev-top]',
  '[data-l="prev"]',
  '[data-l="back"]',
  '.homework-back',
  '.act2-exit',
  '.player-nav .nav-return',
  'a[href*="judgment.html"]',
  'a[href*="portrait.html"]',
  'a[href*="challenge.html"]',
  'a[href*="pavilion-v8-eight"]'
];

function visible(node){
  if(!node||node.disabled)return false;
  const rect=node.getBoundingClientRect();
  if(rect.width<2||rect.height<2)return false;
  const style=getComputedStyle(node);
  return style.visibility!=='hidden'&&style.display!=='none'&&Number(style.opacity)>.05;
}

/* 在当前页面按方向找一个可点的“下一页/上一页”按钮并点击。 */
export function clickDirectional(direction){
  const list=direction==='next'?NEXT_SELECTORS:PREV_SELECTORS;
  for(const selector of list){
    const target=[...document.querySelectorAll(selector)].find(visible);
    if(target){target.click();return true}
  }
  return false;
}

/* 挂载滚轮导航；next/prev 返回 true 表示已翻页，否则回退到页面按钮。
   防连翻：一次滚动动作（含触控板惯性）只算一次；跨页面跳转后仍保留冷却，避免惯性把新页面又翻走。 */
const NAV_KEY='huxinting-wheel-last-nav';
const DIR_KEY='huxinting-wheel-last-dir';

export function mountWheelNav({next,prev}={}){
  let lastNavAt=0,lastNavDir=0;
  try{
    lastNavAt=Number(sessionStorage.getItem(NAV_KEY))||0;
    lastNavDir=Number(sessionStorage.getItem(DIR_KEY))||0;
  }catch{}
  let lastEvtAt=0;
  const handler=event=>{
    if(event.target?.closest?.(BLOCK))return;
    if(Math.abs(event.deltaY)<12)return;
    const now=Date.now();
    const gap=now-lastEvtAt;
    lastEvtAt=now;
    if(gap<180)return;                 // 同一串滚轮/惯性事件
    const dir=event.deltaY>0?1:-1;
    /* 只有同方向的连续滚动才受冷却限制：换方向是明确的回翻意图，立即响应；
       跨文档跳转后方向已记录，残留惯性不会把新页面又翻走。 */
    if(dir===lastNavDir&&now-lastNavAt<900)return;
    const down=dir>0;
    const handled=down?(next?next():clickDirectional('next')):(prev?prev():clickDirectional('prev'));
    if(handled){
      lastNavAt=now;
      lastNavDir=dir;
      try{
        sessionStorage.setItem(NAV_KEY,String(now));
        sessionStorage.setItem(DIR_KEY,String(dir));
      }catch{}
      event.preventDefault();
    }
  };
  window.addEventListener('wheel',handler,{passive:false});
  return ()=>window.removeEventListener('wheel',handler);
}
