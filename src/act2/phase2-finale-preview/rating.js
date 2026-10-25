import {applyFlowMode,flowHref} from '../../flow-mode.js';
import {mountCourseProgress} from '../../progress-nav.js';
import {mountPageDots} from '../../page-dots.js';
import {mountWheelNav} from '../../wheel-nav.js';
import {installFullscreenShell,fsNavigate} from '../../fs-shell.js';
import {RATING2_CRITERIA,RATING2_KEYS,RATING2_NAMES,RATING_LEVELS,missingRating2Keys,readRating2State,saveRating2State,setRating2} from './rating-state.js';

applyFlowMode();
installFullscreenShell();
mountCourseProgress(3);
mountPageDots();
mountWheelNav();

const page=document.querySelector('.rating-page');
const status=document.querySelector('[data-status]');
const pop=document.querySelector('[data-pop]');
const popTitle=document.querySelector('[data-pop-title]');
const popIntro=document.querySelector('[data-pop-intro]');
const popList=document.querySelector('[data-pop-list]');
const helpButtons=[...document.querySelectorAll('[data-help]')];
const rateButtons=[...document.querySelectorAll('[data-rate]')];
const prevLinks=[...document.querySelectorAll('[data-prev],[data-prev-top]')];
let state=readRating2State();
let activeHelp='';

const announce=(message,type='info')=>{status.textContent=message;status.dataset.type=type;};
const paint=()=>{
  for(const button of rateButtons){
    const [key,value]=button.dataset.rate.split(':');
    button.setAttribute('aria-checked',String(state.selfRatings[key]===value));
  }
};
const openPop=key=>{
  const criteria=RATING2_CRITERIA[key];
  if(!criteria)return;
  popTitle.textContent=criteria.name;
  popIntro.textContent=criteria.intro;
  popList.innerHTML=RATING_LEVELS.map(level=>`<div class="criteria-item"><dt>${level}</dt><dd>${criteria.levels[level]}</dd></div>`).join('');
  pop.hidden=false;
  activeHelp=key;
  for(const button of helpButtons)button.setAttribute('aria-expanded',String(button.dataset.help===key));
};
const closePop=()=>{
  pop.hidden=true;activeHelp='';
  for(const button of helpButtons)button.setAttribute('aria-expanded','false');
};

for(const button of helpButtons){
  button.addEventListener('click',()=>{activeHelp===button.dataset.help?closePop():openPop(button.dataset.help);});
}
document.querySelector('[data-close-pop]').addEventListener('click',closePop);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!pop.hidden)closePop();});

for(const button of rateButtons){
  button.addEventListener('click',()=>{
    const [key,value]=button.dataset.rate.split(':');
    state=setRating2(state,key,value);
    paint();
    if(saveRating2State(state))announce('选择已保存在本机。','success');
    else announce('浏览器暂时无法保存，当前选择仍保留在本页。','error');
  });
}

for(const link of prevLinks)link.addEventListener('click',event=>{event.preventDefault();fsNavigate(flowHref('response.html'));});

document.querySelector('[data-next]').addEventListener('click',()=>{
  const missing=missingRating2Keys(state);
  if(missing.length){
    announce(`请先完成：${missing.map(key=>RATING2_NAMES[key]).join('、')}。`,'error');
    const first=document.querySelector(`[data-dim="${missing[0]}"]`);
    first?.scrollIntoView({block:'center',behavior:'smooth'});
    return;
  }
  if(!saveRating2State(state)){announce('浏览器暂时无法保存自评，请稍后再试。','error');return;}
  announce('三枚印已落成，正在展开整课画卷……','success');
  fsNavigate(flowHref('scroll.html'));
});

paint();
window.__PHASE2_RATING__={ready:true,page:'rating',getState:()=>readRating2State(),getCriteria:()=>RATING2_CRITERIA};
document.body.dataset.ready='true';
