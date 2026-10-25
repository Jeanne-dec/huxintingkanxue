import {applyFlowMode} from '../../flow-mode.js';
import {mountCourseProgress} from '../../progress-nav.js';
import {mountPageDots} from '../../page-dots.js';
import {mountWheelNav} from '../../wheel-nav.js';
import {installFullscreenShell,fsNavigate} from '../../fs-shell.js';
import {readSession} from '../../session.js';
import {createAct2State} from '../state.js';
import {loadMaster,renderScene} from '../v10-art/rendererV10.js';

applyFlowMode();
installFullscreenShell();
mountCourseProgress(3);
mountPageDots({current:'phase2:bridge'});
const steps=[...document.querySelectorAll('.bridge-step')];
let index=0;

const show=target=>{
  index=target;
  steps.forEach((step,i)=>step.classList.toggle('current',i===target));
  document.body.dataset.step=String(target);
  steps[target]?.querySelector('button,a')?.focus({preventScroll:true});
};

/* “再看雪湖”用的是学生在“张岱四笔”里调整过的图层版本（无修改时回退默认值）。 */
(async()=>{
  const canvas=document.querySelector('[data-revisit-scene]');
  if(!canvas)return;
  const saved=readSession();
  const values=saved?.act2State?.values||createAct2State().values;
  try{
    const master=await loadMaster();
    renderScene(canvas,{values},master);
  }catch(error){
    console.warn('再看雪湖画面未能渲染：',error.message);
  }
})();

steps.forEach((step,i)=>{
  step.querySelector('[data-bridge-next]')?.addEventListener('click',()=>show(i+1));
});
/* “再看雪湖”整屏可点：点任意空白处即进入下一页 */
const revisit=document.querySelector('.step-revisit');
revisit?.addEventListener('click',()=>{
  if(!revisit.classList.contains('current'))return;
  show(steps.indexOf(revisit)+1);
});
/* 滚轮/方向键在桥页内部逐屏前进，走完四屏后跳回雪湖回应页 */
const advance=()=>{
  if(index<steps.length-1){show(index+1);return true}
  const link=document.querySelector('.bridge-step.current [data-enter-response]')||document.querySelector('[data-enter-response]');
  if(link){link.click();return true}
  return false;
};
const retreat=()=>{
  if(index>0){show(index-1);return true}
  fsNavigate(new URL('../phase2-debate-preview/challenge.html',import.meta.url).href);
  return true;
};
mountWheelNav({next:advance,prev:retreat});
document.addEventListener('keydown',event=>{
  if(event.key==='ArrowRight'&&index<steps.length-1)show(index+1);
});

document.body.dataset.ready='true';
