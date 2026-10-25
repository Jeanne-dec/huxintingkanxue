import {
  readDebateState,
  saveDebateState,
  saveExchange,
  saveJudgment,
  updateExchange,
  updateJudgmentDraft
} from './state.js';
import {applyFlowMode} from '../../flow-mode.js';
import {mountCourseProgress} from '../../progress-nav.js';
import {mountPageDots} from '../../page-dots.js';
import {mountWheelNav} from '../../wheel-nav.js';
import {mountDemoFill} from '../../demo-fill.js?v=1';
import {installFullscreenShell} from '../../fs-shell.js';

const page=document.body.dataset.page;
applyFlowMode();
installFullscreenShell();
mountCourseProgress(3);
mountPageDots();
mountWheelNav();
const status=document.querySelector('[data-status]');
let state=readDebateState();

const announce=(message,type='info')=>{
  if(!status)return;
  status.textContent=message;
  status.dataset.type=type;
};

const persist=(message='草稿已保存在本机。',nextState=state)=>{
  const saved=saveDebateState(nextState);
  announce(saved?message:'浏览器暂时无法保存，请保留本页并稍后重试。',saved?'success':'error');
  if(saved)state=nextState;
  return saved;
};

function mountJudgment(){
  const form=document.querySelector('[data-judgment-form]');
  const reason=form.querySelector('[data-original-reason]');
  const counter=form.querySelector('[data-reason-count]');
  const enterChallenge=document.querySelector('[data-enter-challenge]');
  reason.value=state.draft.originalReason;
  counter.textContent=`${reason.value.length} / 1000`;
  const selected=form.querySelector(`input[name="stance"][value="${CSS.escape(state.draft.stance)}"]`);
  if(selected)selected.checked=true;

  form.addEventListener('change',event=>{
    if(event.target.name!=='stance')return;
    state=updateJudgmentDraft(state,{stance:event.target.value});
    persist();
  });
  reason.addEventListener('input',()=>{
    state=updateJudgmentDraft(state,{originalReason:reason.value});
    counter.textContent=`${reason.value.length} / 1000`;
    persist();
  });
  form.addEventListener('click',event=>{
    const action=event.target.closest('[data-action]')?.dataset.action;
    if(action!=='save-judgment')return;
    const result=saveJudgment(state);
    if(result.error){announce(result.error,'error');return;}
    const saved=saveDebateState(result.state);
    if(!saved){announce('浏览器暂时无法保存，请保留本页并稍后重试。','error');return;}
    state=result.state;
    announce('');
  });
  enterChallenge.addEventListener('click',event=>{
    const hasSavedJudgment=Boolean(state.stance&&state.originalReason.trim());
    const hasUnsavedRevision=state.draft.stance!==state.stance||state.draft.originalReason!==state.originalReason;
    if(hasSavedJudgment&&!hasUnsavedRevision)return;
    event.preventDefault();
    announce(hasSavedJudgment
      ?'当前修改尚未保存为个人初判，请先保存再进入同伴质疑。'
      :'请先选择立场、写下理由并保存个人初判，再进入同伴质疑。','error');
  });
}

function mountChallenge(){
  const form=document.querySelector('[data-challenge-form]');
  const stance=document.querySelector('[data-saved-stance]');
  const reason=document.querySelector('[data-saved-reason]');
  const heard=form.querySelector('[data-heard-view]');
  const question=form.querySelector('[data-peer-question]');
  stance.textContent=state.stance||'尚未保存';
  reason.textContent=state.originalReason||'请返回“个人初判”保存自己的原话。';
  heard.value=state.heardOtherView;
  question.value=state.questionToPeer;

  const update=()=>{
    state=updateExchange(state,{heardOtherView:heard.value,questionToPeer:question.value});
    persist();
  };
  heard.addEventListener('input',update);
  question.addEventListener('input',update);

  const modal=document.querySelector('[data-judgment-modal]');
  const openButton=document.querySelector('[data-action="open-judgment"]');
  const closeJudgment=()=>{modal.hidden=true;document.body.classList.remove('source-open');openButton?.focus();};
  openButton?.addEventListener('click',()=>{modal.hidden=false;document.body.classList.add('source-open');modal.querySelector('[data-action="close-judgment"]')?.focus();});
  modal.addEventListener('click',event=>{if(event.target===modal||event.target.closest('[data-action="close-judgment"]'))closeJudgment();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!modal.hidden)closeJudgment();});

  document.addEventListener('click',event=>{
    if(event.target.closest('[data-action]')?.dataset.action!=='save-exchange')return;
    const result=saveExchange(state);
    if(result.error){announce(result.error,'error');return;}
    persist('课堂交流记录已按原话保存在本机。',result.state);
  });
  const enterBridge=document.querySelector('[data-enter-bridge]');
  enterBridge?.addEventListener('click',event=>{
    const alreadySaved=state.savedExchangeAt
      &&state.heardOtherView===state.savedExchange.heardOtherView
      &&state.questionToPeer===state.savedExchange.questionToPeer;
    if(alreadySaved)return;
    const result=saveExchange(state);
    if(result.error){event.preventDefault();announce(result.error,'error');return;}
    if(!persist('课堂交流记录已按原话保存在本机。',result.state))event.preventDefault();
  });
}

function mountSourceModal(){
  const modal=document.querySelector('[data-source-modal]');
  if(!modal)return;
  const trigger=document.querySelector('[data-action="open-source"]');
  const closeButton=modal.querySelector('[data-action="close-source"]');
  const close=()=>{modal.hidden=true;document.body.classList.remove('source-open');trigger?.focus();};
  const open=()=>{modal.hidden=false;document.body.classList.add('source-open');closeButton?.focus();};
  trigger?.addEventListener('click',open);
  modal.addEventListener('click',event=>{if(event.target===modal||event.target.closest('[data-action="close-source"]'))close();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!modal.hidden)close();});
}

if(page==='judgment'){mountJudgment();mountSourceModal();mountDemoFill([{selector:'[data-original-reason]',answer:'judgment'}]);}
if(page==='challenge'){mountChallenge();mountDemoFill([{selector:'[data-heard-view]',answer:'heard'},{selector:'[data-peer-question]',answer:'question'}]);}

window.__PHASE2_DEBATE__={ready:true,page,getState:()=>readDebateState()};
document.body.dataset.ready='true';
