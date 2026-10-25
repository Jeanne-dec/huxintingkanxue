import {readSession} from '../../session.js';
import {createAct2State} from '../state.js';
import {loadMaster,renderScene} from '../renderer.js';
import {PAVILION_HOTSPOT,PAVILION_SEQUENCE,getPlaybackStages,normalizeStudentValues} from './preview-core.js';

const root=document.querySelector('.pavilion-preview');
const canvas=root.querySelector('[data-student-scene]');
const storyboards=[...root.querySelectorAll('[data-storyboard-closer],[data-storyboard-turn]')];
const interior=root.querySelector('[data-interior-scene]');
const title=root.querySelector('[data-stage-title]');
const copy=root.querySelector('[data-stage-copy]');
const caption=root.querySelector('[data-scene-caption]');
const valuesLabel=root.querySelector('[data-student-values]');
const message=root.querySelector('[data-preview-message]');
const reducedToggle=root.querySelector('[data-reduced-motion]');
const stageItems=[...root.querySelectorAll('[data-stage-item]')];
const mediaReduced=matchMedia('(prefers-reduced-motion: reduce)');
const stageById=new Map(PAVILION_SEQUENCE.map(stage=>[stage.id,stage]));
let master,studentValues,playToken=0,waitHandle=0;

const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
function wait(ms,token){return new Promise(resolve=>{waitHandle=setTimeout(()=>resolve(token===playToken),ms)});}
function cancelPlayback(){playToken++;clearTimeout(waitHandle);waitHandle=0;}

function currentStudentValues(){
  const saved=readSession();
  return normalizeStudentValues(saved?.act2State?.values||createAct2State().values);
}

function paintStudentScene(){
  studentValues=currentStudentValues();
  renderScene(canvas,{values:studentValues,compareOriginal:false},master);
  valuesLabel.textContent=`当前四笔｜长堤 ${studentValues.causeway}% · 湖心亭 ${studentValues.pavilion}% · 小舟 ${studentValues.boat}% · 人物 ${studentValues.people}%`;
  window.__PAVILION_V3__.values={...studentValues};
}

function applyStage(stage){
  root.dataset.settled='false';
  root.dataset.stage=stage.id;
  root.dataset.reduced=String(reducedToggle.checked);
  title.textContent=stage.title;
  copy.textContent=stage.copy;
  caption.textContent=stage.id==='student'?'点击画面中的真实湖心亭':stage.title;
  stageItems.forEach(item=>item.classList.toggle('active',item.dataset.stageItem===stage.id));
  window.__PAVILION_V3__.stage=stage.id;
  window.__PAVILION_V3__.viewAngle=stage.viewAngle;
  window.__PAVILION_V3__.seatedGuests=stage.seatedGuests;
  window.dispatchEvent(new CustomEvent('pavilion-v3-stage',{detail:{...stage}}));
}

async function play(){
  cancelPlayback();
  const token=playToken;
  const stages=getPlaybackStages(reducedToggle.checked);
  message.textContent=reducedToggle.checked?'已启用减少动态：直接查看静态认可终点。':'镜头正在沿湖面推进。';
  for(const stage of stages.slice(1)){
    if(token!==playToken)return;
    applyStage(stage);
    if(stage.duration&&!(await wait(stage.duration,token)))return;
  }
  root.dataset.settled='true';
  message.textContent='已到达认可终点：两位客人对坐，童子站在酒炉旁。';
}

async function resetPreview({repaint=true}={}){
  cancelPlayback();
  if(repaint)paintStudentScene();
  applyStage(stageById.get('student'));
  root.dataset.settled='true';
  message.textContent='学生状态保持不变，可再次点击湖心亭。';
  await nextFrame();
}

async function replay(){
  await resetPreview({repaint:true});
  await play();
}

window.__PAVILION_V3__={ready:false,stage:'student',values:null,hotspot:{...PAVILION_HOTSPOT}};
const hotspot=root.querySelector('.pavilion-hotspot');
Object.assign(hotspot.style,{
  left:`${PAVILION_HOTSPOT.left}%`,top:`${PAVILION_HOTSPOT.top}%`,
  width:`${PAVILION_HOTSPOT.width}%`,height:`${PAVILION_HOTSPOT.height}%`
});
reducedToggle.checked=mediaReduced.matches;
root.dataset.reduced=String(reducedToggle.checked);

root.addEventListener('click',event=>{
  const action=event.target.closest('[data-action]')?.dataset.action;
  if(action==='start')play();
  if(action==='replay')replay();
  if(action==='reset')resetPreview({repaint:true});
});
reducedToggle.addEventListener('change',async()=>{
  root.dataset.reduced=String(reducedToggle.checked);
  if(root.dataset.stage!=='student')await replay();
});
addEventListener('storage',event=>{if(event.key&&event.key!=='huxinting-snow-v41-session')return;if(root.dataset.stage==='student')paintStudentScene();});

try{
  master=await loadMaster();
  await Promise.all([interior.decode(),...storyboards.map(frame=>frame.querySelector('img').decode())]);
  paintStudentScene();
  applyStage(stageById.get('student'));
  root.dataset.settled='true';
  root.dataset.ready='true';
  window.__PAVILION_V3__.ready=true;
  message.textContent='已载入学生当前四笔画卷。';
}catch(error){
  root.dataset.ready='error';
  message.textContent=`预览载入失败：${error.message}`;
  console.error(error);
}
