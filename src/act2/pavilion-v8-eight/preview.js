import {readSession,SESSION_KEY} from '../../session.js';
import {applyFlowMode} from '../../flow-mode.js';
import {mountCourseProgress} from '../../progress-nav.js';
import {mountPageDots} from '../../page-dots.js';
import {mountWheelNav} from '../../wheel-nav.js';
import {installFullscreenShell} from '../../fs-shell.js';
import {createAct2State} from '../state.js';
import {renderCurrentScene} from '../Act2Lesson.js';
import {
  FRAME_SIZE,TIMELINE,V8_ASSETS,CLOSE_IMAGE,
  normalizeCutMode,normalizeStudentValues,layersAt,segmentAt,textFadeProgress
} from './preview-core.js';

const flowing=applyFlowMode();
if(flowing){installFullscreenShell();mountCourseProgress(3);mountPageDots();mountWheelNav();}

const root=document.querySelector('.pavilion-eight');
const canvas=root.querySelector('[data-frame]');
const video=root.querySelector('[data-v8]');
const progress=root.querySelector('[data-progress]');
const clockLabel=root.querySelector('[data-clock]');
const segmentLabel=root.querySelector('[data-segment]');
const startButton=root.querySelector('[data-action="start"]');
const replayButton=root.querySelector('[data-action="replay"]');
const caption=root.querySelector('[data-v8-caption]');

const ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';

const mediaReduced=matchMedia('(prefers-reduced-motion: reduce)');
let reduced=mediaReduced.matches;// 减少动态：跟随系统偏好（页面不再提供开关）
const sources={master:null,close:null};
let studentValues=null,hasSession=false,videoReady=false,videoOn=false;
// 墙钟锚点计时：rAF 被节流时时间仍然正确；baseT=锚点时刻的时间轴位置
let baseT=0,anchorStamp=0,playing=false,paused=false,prevT=0;
// 终镜文字渐显计时：终镜激活后累计播放时长（暂停冻结；与视频 6s 回绕无关，交接包第四节）
let finalBase=0,finalAnchor=0;
let seekFreeze=false;// 仅 ?seek= 调试：冻结渐显状态，不受视频就绪时序影响
let cutMode=normalizeCutMode(new URLSearchParams(location.search).get('cut'));

const say=()=>{};// 状态提示条已随调试面板移除，保留空实现以维持调用点
const currentTime=()=>playing&&!paused?Math.min(baseT+(performance.now()-anchorStamp)/1000,TIMELINE.finalStill):baseT;
const finalElapsed=()=>videoOn&&!paused?finalBase+(performance.now()-finalAnchor)/1000:finalBase;
// 文字渐显：未进终镜恒隐藏；减少动态直达完整文字（交接包第五节）
function updateText(){
  const p=seekFreeze
    ?(currentTime()<TIMELINE.finalStill?0:textFadeProgress(finalBase,reduced))
    :(!videoOn?0:textFadeProgress(finalElapsed(),reduced));
  caption.style.opacity=String(Math.round(p*10000)/10000);
  root.dataset.caption=p>=1?'full':p>0?'fading':'hidden';
}
function jump(time){baseT=Math.min(Math.max(time,0),TIMELINE.finalStill);anchorStamp=performance.now();prevT=baseT;}

function readValues(){
  const saved=readSession();
  hasSession=!!saved;
  studentValues=normalizeStudentValues(saved?.act2State?.values||createAct2State().values);
}

function draw(t){
  if(!sources.master||!sources.close)return;
  ctx.globalAlpha=1;
  ctx.clearRect(0,0,FRAME_SIZE.width,FRAME_SIZE.height);
  for(const layer of layersAt(t,cutMode)){
    const image=layer.source==='master'?sources.master:layer.source==='close'?sources.close:null;
    if(!image)continue;// v8 图层由 <video> 承担
    ctx.globalAlpha=layer.alpha;
    ctx.drawImage(image,layer.crop.x,layer.crop.y,layer.crop.w,layer.crop.h,0,0,FRAME_SIZE.width,FRAME_SIZE.height);
  }
  ctx.globalAlpha=1;
}

function syncVideo(t){
  const shouldShow=t>=TIMELINE.finalStill&&videoReady;
  if(shouldShow&&!videoOn){
    videoOn=true;
    if(!paused)finalBase=0;// 主动播放到终镜：渐显计时从零起步（seek 冻结入场时保留预设值）
    finalAnchor=performance.now();
    video.currentTime=0;
    video.classList.add('on');
    root.dataset.video='on';
  }else if(!shouldShow&&videoOn){
    videoOn=false;
    finalBase=0;// 离开终镜：渐显计时清零（文字回到隐藏）
    video.pause();
    video.classList.remove('on');
    video.currentTime=0;
    root.dataset.video='off';
  }
  if(!videoOn)return;
  if(paused&&!video.paused)video.pause();
  if(!paused&&video.paused)video.play().catch(()=>{});
}

function onEnterFinal(){
  if(reduced){
    playing=false;paused=true;
  }
}

// 课堂控制条仅两键：播放/暂停合一 + 重播
function updateControls(){
  const t=currentTime(),ready=root.dataset.ready==='true';
  root.dataset.playing=String(playing);root.dataset.paused=String(paused);
  root.dataset.cut=cutMode;root.dataset.reduced=String(reduced);
  startButton.disabled=!ready;
  if(!playing)startButton.textContent=reduced?'查看静态终镜':(t>0?'从头播放':'开始播放');
  else startButton.textContent=paused?'继续':'暂停';
  replayButton.disabled=!ready;
}

function updateHud(t){
  clockLabel.textContent=t.toFixed(2);
  progress.style.width=`${Math.min(t/TIMELINE.finalStill,1)*100}%`;
  const segment=segmentAt(t);
  segmentLabel.textContent=segment.label;
  root.dataset.phase=segment.id;
}

function frame(){
  requestAnimationFrame(frame);
  const t=currentTime();
  if(t>=TIMELINE.finalStill&&prevT<TIMELINE.finalStill)onEnterFinal();
  prevT=t;
  draw(t);
  syncVideo(t);
  updateText();
  updateHud(t);
}

async function snapshotStudentScene(){
  readValues();
  const scene=document.createElement('canvas');
  await renderCurrentScene(scene,studentValues);
  sources.master=scene;
}

function loadImage(url){
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>image.decode().then(()=>resolve(image)).catch(()=>resolve(image));
    image.onerror=()=>reject(new Error(`无法载入图像：${url}`));
    image.src=url;
  });
}

async function prepareVideo(){
  const url=new URL(V8_ASSETS.video.file,import.meta.url).href;
  const blob=await (await fetch(url)).blob();
  video.src=URL.createObjectURL(new Blob([blob],{type:'video/mp4'}));
  // loadeddata 即可显示首帧（poster 等价）；canplaythrough 优先；6s 兜底避免就绪状态被视频解码卡住
  await Promise.race([
    new Promise((resolve,reject)=>{
      video.addEventListener('canplaythrough',resolve,{once:true});
      video.addEventListener('loadeddata',resolve,{once:true});
      video.addEventListener('error',()=>reject(new Error('V8 终镜视频载入失败')),{once:true});
    }),
    new Promise(resolve=>setTimeout(resolve,6000))
  ]);
  videoReady=true;
}

function begin(){
  if(reduced){
    jump(TIMELINE.finalStill);playing=false;paused=true;
    onEnterFinal();
  }else{
    jump(0);playing=true;paused=false;
  }
  syncVideo(currentTime());
  updateText();
  updateControls();
}

function togglePause(){
  const t=currentTime();
  syncVideo(t);
  if(!(playing||(t>=TIMELINE.finalStill&&videoOn)))return;
  if(paused){anchorStamp=performance.now();finalAnchor=performance.now();paused=false;}
  else{baseT=t;finalBase=finalElapsed();paused=true;}// 先冻结渐显计时再置 paused
  syncVideo(currentTime());
  updateText();
  updateControls();
}

function replay(){
  jump(0);paused=false;
  if(reduced){begin();return;}
  playing=true;
  syncVideo(currentTime());
  updateText();
  updateControls();
}

function skip(){
  if(root.dataset.ready!=='true')return;
  playing=true;paused=false;jump(TIMELINE.finalStill);
  onEnterFinal();
  syncVideo(currentTime());
  updateText();
  updateControls();
}

async function reset(){
  playing=false;paused=false;jump(0);
  syncVideo(0);
  updateText();
  await snapshotStudentScene();
  updateControls();
}

function setCut(mode){
  cutMode=normalizeCutMode(mode);
  const url=new URL(location.href);url.searchParams.set('cut',cutMode);
  history.replaceState(null,'',url);
  root.dataset.cut=cutMode;
}

// 播放键=开始/暂停/继续合一；重播键=从头重播（skip/reset/setCut 仅保留给测试钩子与键盘）
root.addEventListener('click',event=>{
  const target=event.target instanceof Element?event.target:null;
  const action=target?.closest('[data-action]')?.dataset.action;
  if(action==='start')!playing?(currentTime()===0?begin():replay()):togglePause();
  if(action==='replay')replay();
});
mediaReduced.addEventListener('change',()=>{
  reduced=mediaReduced.matches;
  root.dataset.reduced=String(reduced);
  if(currentTime()>=TIMELINE.finalStill&&videoOn)onEnterFinal();
  updateText();
  updateControls();
});
addEventListener('storage',event=>{
  if(event.key&&event.key!==SESSION_KEY)return;
  if(currentTime()===0&&!playing)snapshotStudentScene().then(()=>say('学生四笔已更新，起点画面已重新读取。'));
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&playing&&!paused){
    baseT=currentTime();finalBase=finalElapsed();paused=true;// 渐显计时一并冻结，后台不跳字
    say('页面切走，已自动暂停；回来后点“继续”。');
    updateControls();
  }
});
addEventListener('keydown',event=>{
  const target=event.target instanceof Element?event.target:null;
  if(target?.closest('button,input,textarea,select,a'))return;
  if(event.code==='Space'){event.preventDefault();playing||currentTime()>0?togglePause():begin();}
  if(event.code==='KeyR')replay();
  if(event.code==='KeyS')skip();
  if(event.code==='Home')reset();
  if(event.code==='KeyC')setCut(cutMode==='fade'?'hard':'fade');
});

window.__PAVILION_V8__={
  ready:false,
  get time(){return currentTime()},get playing(){return playing},get paused(){return paused},
  get cut(){return cutMode},get videoOn(){return videoOn},get videoTime(){return video.currentTime},
  get finalElapsed(){return finalElapsed()},get captionOpacity(){return parseFloat(caption.style.opacity||'0')},
  get captionBox(){const s=root.querySelector('[data-player]').getBoundingClientRect(),c=caption.getBoundingClientRect();
    return {stageWidth:s.width,stageHeight:s.height,x:(c.left-s.left)/s.width*1120,y:(c.top-s.top)/s.width*1120,fontSize:parseFloat(getComputedStyle(caption).fontSize)/s.width*1120};},
  get values(){return studentValues&&{...studentValues}},
  layersAt:time=>layersAt(time,cutMode),segmentAt,
  actions:{begin,togglePause,replay,skip,reset,setCut,
    // 仅测试/评审用：冻结在任意时刻逐帧核对画面（不进 UI 按钮）；t>8.72 视为终镜后的渐显时刻
    seek:time=>{playing=true;paused=true;jump(time);syncVideo(currentTime());
      if(time>TIMELINE.finalStill&&videoOn)finalBase=time-TIMELINE.finalStill;
      draw(currentTime());updateText();updateControls();}}
};

(async()=>{
  try{
    setCut(cutMode);
    // 调试便利（仅独立样片）：?ui=0 隐藏全部调试 UI 只留播放器；?seek=t 就绪后冻结到指定时刻
    const params=new URLSearchParams(location.search);
    if(params.get('ui')==='0')root.classList.add('player-only');
    await snapshotStudentScene();
    sources.close=await loadImage(new URL(CLOSE_IMAGE.file,import.meta.url).href);
    jump(0);draw(0);updateHud(0);
    // ?seek=t：视频就绪前先冻结时间轴与渐显计时（无头截图/评审直出任意时刻，不依赖视频解码完成）
    if(params.has('seek')){
      const t=parseFloat(params.get('seek'))||0;
      playing=true;paused=true;seekFreeze=true;jump(t);
      if(t>TIMELINE.finalStill)finalBase=t-TIMELINE.finalStill;
      draw(currentTime());updateText();
      if(t>=TIMELINE.finalStill)video.classList.add('on');// 冻结展示终镜：poster 即冻结首帧
    }
    await prepareVideo();
    root.dataset.ready='true';
    window.__PAVILION_V8__.ready=true;
    syncVideo(currentTime());updateText();
    say('已就绪：起点为学生当前真实四笔画卷快照。');
    updateControls();
  }catch(error){
    root.dataset.ready='error';
    say(`预览载入失败：${error.message}`);
    console.error(error);
  }
})();
requestAnimationFrame(frame);
