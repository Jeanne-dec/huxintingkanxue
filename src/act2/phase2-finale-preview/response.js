import {readDebateState} from '../phase2-debate-preview/state.js';
import {applyFlowMode,flowHref} from '../../flow-mode.js';
import {mountCourseProgress} from '../../progress-nav.js';
import {mountPageDots} from '../../page-dots.js';
import {mountWheelNav} from '../../wheel-nav.js';
import {mountDemoFill} from '../../demo-fill.js?v=1';
import {installFullscreenShell,fsNavigate} from '../../fs-shell.js';
import {commitFinaleResponse,readFinaleState,saveFinaleState,updateFinaleDraft} from './state.js';

applyFlowMode();
installFullscreenShell();
mountCourseProgress(3);
mountPageDots();
mountWheelNav();

const form=document.querySelector('[data-response-form]');
const response=form.querySelector('[data-response]');
const counter=form.querySelector('[data-count]');
const status=form.querySelector('[data-status]');
const toggle=document.querySelector('[data-initial-toggle]');
const initialPanel=document.querySelector('[data-initial-panel]');
let state=readFinaleState();
const debate=readDebateState();

const announce=(message,type='info')=>{status.textContent=message;status.dataset.type=type;};
const renderCount=()=>{counter.textContent=`${Array.from(response.value).length} 字`;};
const persistDraft=()=>{
  const saved=saveFinaleState(state);
  announce(saved?'草稿已保存在本机。':'浏览器暂时无法保存；当前输入仍保留在本页。',saved?'success':'error');
  return saved;
};

response.value=state.draft.response;
const selected=form.querySelector(`input[name="response-stance"][value="${CSS.escape(state.draft.stance)}"]`);
if(selected)selected.checked=true;
renderCount();
document.querySelector('[data-initial-stance]').textContent=debate.stance||'尚未保存';
document.querySelector('[data-initial-reason]').textContent=debate.originalReason||'尚未保存个人初判。';
document.querySelector('[data-peer-question]').textContent=debate.savedExchangeAt&&debate.savedExchange.questionToPeer?debate.savedExchange.questionToPeer:'暂无已保存的同伴质疑。';

form.addEventListener('change',event=>{
  if(event.target.name!=='response-stance')return;
  state=updateFinaleDraft(state,{stance:event.target.value});
  persistDraft();
});
response.addEventListener('input',()=>{
  state=updateFinaleDraft(state,{response:response.value});
  renderCount();
  persistDraft();
});
form.addEventListener('submit',event=>{
  event.preventDefault();
  const result=commitFinaleResponse(state);
  if(result.error){announce(result.error,'error');return;}
  if(!saveFinaleState(result.state)){announce('浏览器暂时无法保存，尚未进入画卷；请保留本页并稍后重试。','error');return;}
  state=result.state;
  announce('已按原话收入画卷，正在进入自评落印。','success');
  fsNavigate(flowHref('rating.html'));
});

const setInitialOpen=open=>{
  toggle.setAttribute('aria-expanded',String(open));
  toggle.querySelector('span:last-child').textContent=open?'收起我的初判':'展开我的初判';
  initialPanel.hidden=!open;
};
toggle.addEventListener('click',()=>setInitialOpen(toggle.getAttribute('aria-expanded')!=='true'));
document.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||initialPanel.hidden)return;
  setInitialOpen(false);toggle.focus();
});

window.__PHASE2_FINALE__={ready:true,page:'response',getState:()=>readFinaleState(),getDebate:()=>readDebateState()};
document.body.dataset.ready='true';
mountDemoFill([{selector:'[data-response]',answer:'response'}]);
