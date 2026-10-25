import {readSession} from '../../session.js';
import {applyFlowMode} from '../../flow-mode.js';
import {createAct2State} from '../state.js';
import {ASSET_ANCHORS,SCENE_SIZE,loadMaster,renderScene} from '../renderer.js';
import {PAVILION_HOTSPOT,SEVEN_SHOT_SEQUENCE,getPlaybackShots,normalizeStudentValues} from './preview-core.js';

const root=document.querySelector('.pavilion-seven');
applyFlowMode();
const scene=root.querySelector('.scene-shell');
const canvas=root.querySelector('[data-student-scene]');
const finalScene=root.querySelector('[data-final-scene]');
const veil=root.querySelector('[data-turn-veil]');
const title=root.querySelector('[data-shot-title]');
const copy=root.querySelector('[data-shot-copy]');
const number=root.querySelector('[data-shot-number]');
const caption=root.querySelector('[data-scene-caption]');
const valuesLabel=root.querySelector('[data-student-values]');
const message=root.querySelector('[data-preview-message]');
const reducedToggle=root.querySelector('[data-reduced-motion]');
const pauseButton=root.querySelector('[data-action="pause"]');
const startButton=root.querySelector('[data-action="start"]:not(.pavilion-hotspot)');
const shotItems=[...root.querySelectorAll('[data-shot-item]')];
const shotById=new Map(SEVEN_SHOT_SEQUENCE.map(shot=>[shot.id,shot]));
const mediaReduced=matchMedia('(prefers-reduced-motion: reduce)');
let master,studentValues,playToken=0,isPlaying=false,isPaused=false,activeAnimations=new Set(),resumeWaiters=[];

const cameraTransform=camera=>`translate(${camera.translateX}%,${camera.translateY}%) scale(${camera.scale})`;
const nextFrame=()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));
const delay=ms=>new Promise(done=>setTimeout(done,ms));

function currentStudentValues(){
  const saved=readSession();
  return normalizeStudentValues(saved?.act2State?.values||createAct2State().values);
}

function paintStudentScene(){
  studentValues=currentStudentValues();
  renderScene(canvas,{values:studentValues,compareOriginal:false},master);
  valuesLabel.textContent=`当前四笔｜长堤 ${studentValues.causeway}% · 湖心亭 ${studentValues.pavilion}% · 小舟 ${studentValues.boat}% · 人物 ${studentValues.people}%`;
  window.__PAVILION_V4__.values={...studentValues};
}

function updateControls(){
  root.dataset.playing=String(isPlaying);root.dataset.paused=String(isPaused);
  pauseButton.disabled=!isPlaying;pauseButton.textContent=isPaused?'继续':'暂停';
  startButton.disabled=isPlaying;startButton.textContent=isPlaying?'正在入亭':'从湖面入亭';
  window.__PAVILION_V4__.playing=isPlaying;window.__PAVILION_V4__.paused=isPaused;
}

function applyShotMetadata(shot){
  root.dataset.shot=shot.id;root.dataset.settled='false';root.dataset.reduced=String(reducedToggle.checked);
  const atStudentPainting=shot.id==='shot-01';
  finalScene.setAttribute('aria-hidden',String(shot.source==='student-canvas'));
  hotspot.disabled=!atStudentPainting;
  number.textContent=String(shot.number).padStart(2,'0');title.textContent=shot.title;copy.textContent=shot.copy;
  caption.textContent=shot.id==='shot-01'?'点击画面中的真实湖心亭':shot.title;
  shotItems.forEach(item=>item.classList.toggle('active',item.dataset.shotItem===shot.id));
  Object.assign(window.__PAVILION_V4__,{shot:shot.id,source:shot.source,assetKey:shot.assetKey,viewAngle:shot.viewAngle,seatedGuests:shot.seatedGuests});
  window.dispatchEvent(new CustomEvent('pavilion-v4-shot',{detail:{...shot}}));
}

function settleShot(shot){
  root.dataset.settled='true';
  window.dispatchEvent(new CustomEvent('pavilion-v4-shot-settled',{detail:{...shot}}));
}

function wakeResumeWaiters(){
  const waiters=resumeWaiters;resumeWaiters=[];waiters.forEach(done=>done());
}

function pausePlayback(){
  if(!isPlaying||isPaused)return;
  isPaused=true;activeAnimations.forEach(animation=>animation.pause());updateControls();message.textContent='镜头已暂停，可继续播放。';
}

function resumePlayback(){
  if(!isPlaying||!isPaused)return;
  isPaused=false;activeAnimations.forEach(animation=>animation.play());wakeResumeWaiters();updateControls();message.textContent='继续沿湖面入亭。';
}

function cancelPlayback(){
  playToken++;activeAnimations.forEach(animation=>animation.cancel());activeAnimations.clear();
  isPlaying=false;isPaused=false;wakeResumeWaiters();updateControls();
}

async function pauseAwareHold(ms,token){
  let remaining=ms;
  while(remaining>0&&token===playToken){
    if(isPaused){await new Promise(done=>resumeWaiters.push(done));continue;}
    const slice=Math.min(50,remaining);await delay(slice);remaining-=slice;
  }
  return token===playToken;
}

function currentFrame(element,properties){
  const style=getComputedStyle(element),frame={};
  for(const property of properties)frame[property]=style[property];
  return frame;
}

async function animateSpecs(specs,duration,token,easing='cubic-bezier(.22,.7,.22,1)'){
  if(duration===0){
    for(const {element,end} of specs)Object.assign(element.style,end);
    return token===playToken;
  }
  const animations=specs.map(({element,end,keyframes})=>{
    const frames=keyframes||[currentFrame(element,Object.keys(end)),end];
    const animation=element.animate(frames,{duration,easing,fill:'forwards'});activeAnimations.add(animation);return animation;
  });
  if(isPaused)animations.forEach(animation=>animation.pause());
  try{await Promise.all(animations.map(animation=>animation.finished));}
  catch{if(token!==playToken)return false;throw new Error('镜头动画意外中断');}
  if(token!==playToken)return false;
  for(const animation of animations){animation.commitStyles();animation.cancel();activeAnimations.delete(animation);}
  return true;
}

async function animateShot(shot,previous,token){
  const duration=reducedToggle.checked?0:shot.duration;
  if(shot.source==='student-canvas'){
    return animateSpecs([{element:canvas,end:{opacity:'1',transform:cameraTransform(shot.camera)}}],duration,token);
  }
  if(shot.id==='shot-04'){
    const finalEnd={opacity:'1',transform:cameraTransform(shot.camera),clipPath:'inset(0% 0% 0% 0%)'};
    return animateSpecs([
      {element:canvas,end:{opacity:'0',transform:cameraTransform({...previous.camera,scale:previous.camera.scale+.22})}},
      {element:finalScene,end:finalEnd,keyframes:[{opacity:'0',transform:cameraTransform(shot.camera),clipPath:'inset(0% 0% 0% 100%)',offset:0},{opacity:'.28',clipPath:'inset(0% 0% 0% 62%)',offset:.28},{opacity:'1',transform:cameraTransform(shot.camera),clipPath:'inset(0% 0% 0% 0%)',offset:1}]},
      {element:veil,end:{opacity:'.18',transform:'translateX(30%)'},keyframes:[{opacity:'0',transform:'translateX(-36%)',offset:0},{opacity:'.82',transform:'translateX(0%)',offset:.48},{opacity:'.18',transform:'translateX(30%)',offset:1}]}
    ],duration,token,'cubic-bezier(.3,.12,.2,1)');
  }
  return animateSpecs([
    {element:finalScene,end:{opacity:'1',transform:cameraTransform(shot.camera),clipPath:'inset(0% 0% 0% 0%)'}},
    {element:veil,end:{opacity:'0',transform:'translateX(42%)'}}
  ],duration,token);
}

function setVisualForShot(shot){
  const usesCanvas=shot.source==='student-canvas';
  Object.assign(canvas.style,{opacity:usesCanvas?'1':'0',transform:cameraTransform(usesCanvas?shot.camera:SEVEN_SHOT_SEQUENCE[2].camera)});
  Object.assign(finalScene.style,{opacity:usesCanvas?'0':'1',transform:cameraTransform(usesCanvas?SEVEN_SHOT_SEQUENCE[3].camera:shot.camera),clipPath:usesCanvas?'inset(0% 0% 0% 100%)':'inset(0% 0% 0% 0%)'});
  Object.assign(veil.style,{opacity:shot.id==='shot-04'?'.18':'0',transform:'translateX(42%)'});
}

async function play(){
  if(isPlaying)return;
  cancelPlayback();const token=playToken;isPlaying=true;updateControls();
  const shots=getPlaybackShots(reducedToggle.checked);
  message.textContent=reducedToggle.checked?'已启用减少动态：直接查看静态认可终点。':'镜头正沿学生画卷向湖心亭推进。';
  for(let index=1;index<shots.length;index++){
    if(token!==playToken)return;
    const shot=shots[index],previous=shots[index-1];applyShotMetadata(shot);
    if(!(await animateShot(shot,previous,token)))return;
    settleShot(shot);
    if(index<shots.length-1&&!(await pauseAwareHold(reducedToggle.checked?0:220,token)))return;
  }
  isPlaying=false;isPaused=false;updateControls();root.dataset.settled='true';
  message.textContent='七镜头已停在认可终点：童子烧酒，两位客人铺毡对坐。';
}

async function resetPreview({repaint=true}={}){
  cancelPlayback();if(repaint)paintStudentScene();
  const first=shotById.get('shot-01');setVisualForShot(first);applyShotMetadata(first);settleShot(first);
  message.textContent='学生状态保持不变，可再次点击真实湖心亭。';await nextFrame();
}

async function replay(){await resetPreview({repaint:true});await play();}

function pavilionViewportBox(){
  const sceneRect=scene.getBoundingClientRect(),style=getComputedStyle(canvas),matrix=new DOMMatrixReadOnly(style.transform);
  const [originX,originY]=style.transformOrigin.split(' ').map(parseFloat);
  const anchor=ASSET_ANCHORS.pavilion;
  const points=[[anchor.x,anchor.y],[anchor.x+anchor.w,anchor.y+anchor.h]].map(([x,y])=>{
    const localX=x/SCENE_SIZE.width*sceneRect.width,localY=y/SCENE_SIZE.height*sceneRect.height;
    return {x:(matrix.a*(localX-originX)+matrix.c*(localY-originY)+originX+matrix.e)/sceneRect.width,y:(matrix.b*(localX-originX)+matrix.d*(localY-originY)+originY+matrix.f)/sceneRect.height};
  });
  return {left:points[0].x,top:points[0].y,right:points[1].x,bottom:points[1].y};
}

window.__PAVILION_V4__={ready:false,shot:'shot-01',values:null,paused:false,playing:false,hotspot:{...PAVILION_HOTSPOT},pause:pausePlayback,resume:resumePlayback,pavilionViewportBox,activeCurrentTime:()=>[...activeAnimations][0]?.currentTime??0};
const hotspot=root.querySelector('.pavilion-hotspot');
Object.assign(hotspot.style,{left:`${PAVILION_HOTSPOT.left}%`,top:`${PAVILION_HOTSPOT.top}%`,width:`${PAVILION_HOTSPOT.width}%`,height:`${PAVILION_HOTSPOT.height}%`});
reducedToggle.checked=mediaReduced.matches;root.dataset.reduced=String(reducedToggle.checked);

root.addEventListener('click',event=>{
  const action=event.target.closest('[data-action]')?.dataset.action;
  if(action==='start')root.dataset.shot==='shot-01'?play():replay();
  if(action==='pause')isPaused?resumePlayback():pausePlayback();
  if(action==='replay')replay();
  if(action==='reset')resetPreview({repaint:true});
});
reducedToggle.addEventListener('change',async()=>{root.dataset.reduced=String(reducedToggle.checked);if(root.dataset.shot!=='shot-01')await replay();});
addEventListener('storage',event=>{if(event.key&&event.key!=='huxinting-snow-v41-session')return;if(root.dataset.shot==='shot-01')paintStudentScene();});

try{
  master=await loadMaster();await finalScene.decode();paintStudentScene();
  const first=shotById.get('shot-01');setVisualForShot(first);applyShotMetadata(first);settleShot(first);
  root.dataset.ready='true';window.__PAVILION_V4__.ready=true;message.textContent='已载入学生当前四笔画卷。';updateControls();
}catch(error){
  root.dataset.ready='error';message.textContent=`预览载入失败：${error.message}`;console.error(error);
}
