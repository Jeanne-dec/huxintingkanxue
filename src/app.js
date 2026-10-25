import {readSession,saveSession} from './session.js';
import {mountPresentation,DEMO_ROUTES} from './presentation.js';
import {titles} from './content.js';import {progress} from './components.js';import {createState,verify,hint,recordRepair,undoRepair,canUndoRepair} from './state.js';import {snowScene} from './snow-scene.js';import {createAct2State} from './act2/state.js';import {mountWorkbench} from './act2/controls.js';import {createLesson,mountLesson} from './act2/Act2Lesson.js';
import {phase2Url} from './phase2-router.js';
import {setCourseProgressStage} from './progress-nav.js';
import {mountPageDots,setPageDotsCurrent} from './page-dots.js';
import {mountWheelNav,clickDirectional} from './wheel-nav.js';
import {playBirds,stopBirds,disposeBirds} from './birds-audio.js';
import P01 from './scenes/P01.js?v=6';import P02 from './scenes/P02.js?v=4';import P03 from './scenes/P03.js?v=4';import P04 from './scenes/P04.js?v=6';import P05 from './scenes/P05.js?v=6';import P06 from './scenes/P06.js?v=6';import P07 from './scenes/P07.js?v=5';import P08 from './scenes/P08.js?v=5';
const scenes=[P01,P02,P03,P04,P05,P06,P07,P08],app=document.querySelector('#app'),params=new URLSearchParams(location.search);let state=createState(),sceneState={timeFixed:false,whiteStage:0},page=1,activeSlot=0,sourceOpen=false,pendingSuccess='',panelClosing=false,sceneAnimation='',finalReady=false,whiteReady=false,mode='cover',act2State=createAct2State(),act2Controller=null,lessonState=createLesson();
const taskFor={3:'sound',4:'frost',5:'yu',6:'allWhite',7:'time'},SUCCESS_DWELL=520,PANEL_FADE=300,SCENE_REVEAL=680;
const snapshot=()=>({timeFixed:state.timeFixed,whiteStage:state.whiteStage});
let resumeRoute='';
const restored=readSession();
if(restored){({state,act2State,lessonState,mode,page}=restored);sceneState=snapshot();
  const v=act2State.values;
  const touched=Boolean(v.causeway||v.pavilion||v.boat||v.people||state.repairSteps.length||lessonState.epitaph.trim()||lessonState.selectedQuestion);
  if(restored.mode!=='cover'&&touched)resumeRoute=restored.mode==='lesson'?`lesson:${lessonState.step}`:restored.mode==='act2'?'act2':`act1:${page}`;
}
/* 整课第一页固定是封面：每次打开都先停在封面，再按需续上上次的进度。 */
mode='cover';
function applyRoute(route){
  if(route==='cover')mode='cover';
  else if(route==='act2')mode='act2';
  else if(route.startsWith('lesson:')){mode='lesson';lessonState={...lessonState,step:route.slice(7)};}
  else{mode='act1';page=Number(route.split(':')[1]);finalReady=false;}
}
const goto=params.get('goto');
if(goto&&goto.startsWith('phase2:'))location.replace(phase2Url(goto.slice(7)));
else if(goto&&goto!=='cover'&&DEMO_ROUTES.some(item=>item.id===goto))applyRoute(goto);
let dotsMounted=false;
function syncDots(current){
  if(!dotsMounted){mountPageDots({current,onSelect:navigateDemo});dotsMounted=true;}
  else setPageDotsCurrent(current);
}
function persist(){saveSession({mode,page,state,act2State,lessonState});}
function leaveModes(){stopBirds(0);app._lessonAbort?.abort();app._act2Abort?.abort();act2Controller?.destroy();act2Controller=null;}
function navigateDemo(route){
  if(!DEMO_ROUTES.some(item=>item.id===route))return;
  leaveModes();pendingSuccess='';panelClosing=false;sceneAnimation='';
  if(route.startsWith('phase2:')){persist();enterPhase2(route.slice(7));return;}
  applyRoute(route);
  render();
}

/* 第二环节用全屏 iframe 承接：整课文档不跳转，浏览器才不会因为换页退出全屏。
   未处于全屏时仍按原来的独立页面跳转，保证深链与分享版行为不变。 */
let phase2Frame=null;
function fullscreenNow(){return Boolean(document.fullscreenElement)}
function toggleFullscreen(){const promise=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen({navigationUI:'hide'});promise?.catch(()=>{})}
function postPhase2State(){if(!phase2Frame?.contentWindow)return;try{phase2Frame.contentWindow.postMessage({type:'huxinting:fs-state',active:fullscreenNow()},location.origin)}catch{}}
function openPhase2(step){
  if(!phase2Frame){
    const tag=document.createElement('style');
    tag.id='phase2-frame-style';
    tag.textContent='iframe.phase2-frame{position:fixed;inset:0;z-index:200;width:100vw;height:100vh;border:0;background:#e8ebe9}body.phase2-open{overflow:hidden}';
    document.head.append(tag);
    phase2Frame=document.createElement('iframe');
    phase2Frame.className='phase2-frame';
    phase2Frame.setAttribute('allow','fullscreen');
    phase2Frame.setAttribute('title','第二教学环节');
    phase2Frame.addEventListener('load',postPhase2State);
    document.body.append(phase2Frame);
  }
  const href=phase2Url(step);
  if(phase2Frame.src!==href)phase2Frame.src=href;
  document.body.classList.add('phase2-open');
  postPhase2State();
}
function closePhase2(){document.body.classList.remove('phase2-open');phase2Frame?.remove();phase2Frame=null}
function enterPhase2(step){if(fullscreenNow())openPhase2(step);else location.assign(phase2Url(step))}
document.addEventListener('fullscreenchange',postPhase2State);
window.addEventListener('message',event=>{
  if(event.origin!==location.origin)return;
  const data=event.data||{};
  if(data.type==='huxinting:phase2-route'&&typeof data.route==='string'){closePhase2();applyRoute(data.route);render();return}
  if(data.type==='huxinting:leave-phase2'){closePhase2();applyRoute('act2');render();return}
  if(data.type==='huxinting:fs-toggle')toggleFullscreen();
});

function devState(){return `<div class="task-state"><span>声 ${state.soundFixed?'✓':'○'}</span><span>白 ${state.whiteStage}/3</span><span>时 ${state.timeFixed?'✓':'○'}</span></div>`}
function original(){return sourceOpen?`<aside class="original-panel" aria-label="湖心亭看雪原文"><button data-action="source" aria-label="关闭原文">×</button><b>《湖心亭看雪》</b><p>崇祯五年十二月，余住西湖。大雪三日，湖中人鸟声俱绝。是日更定矣，余拏一小舟，拥毳衣炉火，独往湖心亭看雪。雾凇沆砀，天与云与山与水，上下一白。</p></aside>`:''}
function sceneNotice(){return pendingSuccess&&page===1?`<div class="scene-notice" role="status">${pendingSuccess}</div>`:''}
function render(){persist();if(mode!=='act1'||page!==2)stopBirds(0);if(mode==='cover'){setCourseProgressStage(0);app._lessonAbort?.abort();app._act2Abort?.abort();act2Controller?.destroy();act2Controller=null;app.innerHTML=`<div class="cover-page"><div class="cover-stage" role="img" aria-label="《湖心亭看雪》课程封面"><button class="cover-enter" type="button" data-cover-enter>${resumeRoute?'继续上次课堂':'开始上课'}</button></div></div>`;app.querySelector('[data-cover-enter]').addEventListener('click',()=>{applyRoute(resumeRoute||'act1:1');render()});syncDots('cover');return}setCourseProgressStage(mode==='act1'?1:2);syncDots(mode==='lesson'?`lesson:${lessonState.step}`:mode==='act2'?'act2':`act1:${page}`);if(mode!=='lesson')app._lessonAbort?.abort();if(mode!=='act2')app._act2Abort?.abort();if(mode==='lesson'){act2Controller?.destroy();act2Controller=null;mountLesson(app,()=>({values:act2State.values,lesson:lessonState}),next=>{lessonState=next;persist()},()=>{mode='act2';render()},()=>enterPhase2('pavilion'));return}if(mode==='act2'){if(!act2Controller)mountWorkbench(app,()=>act2State,next=>{act2State=next;persist()},()=>{act2Controller?.destroy();act2Controller=null;mode='act1';page=8;render()},()=>{act2Controller?.destroy();act2Controller=null;mode='lesson';render()}).then(controller=>{if(mode==='act2')act2Controller=controller;else controller.destroy()});return}act2Controller?.destroy();act2Controller=null;const preview=params.get('preview')!=='0'&&params.get('demo')!=='1',final=page===8;const body=scenes[page-1]({progressValue:state.progress,slots:state.answers.yu,activeSlot,whiteStage:state.whiteStage,canUndo:canUndoRepair(state),whiteReady});app.innerHTML=`<div class="stage v24 ${final?'final':''} ${panelClosing?'panel-closing':''}">${snowScene({timeFixed:sceneState.timeFixed,whiteStage:sceneState.whiteStage,finalScene:final,animate:sceneAnimation,transitionFrom:sceneState})}${body}${page>1&&page<8?progress(state.progress):''}${page===1?`${original()}${sceneNotice()}`:''}${preview?`${page===1?devState():''}<nav class="preview"><button data-action="prev">‹</button><b>P${String(page).padStart(2,'0')} ${titles[page-1]}</b><button data-action="next">›</button><button data-action="reset">重置本幕</button><button data-action="quick-sound">完成听声</button><button data-action="quick-white">完成观白</button><button data-action="quick-time">完成辨时</button></nav>`:''}</div>`;hydrate();if(pendingSuccess&&page>1&&page<8)showFeedback('',pendingSuccess)}
function answer(b){return b.dataset.answer||''}function hydrate(){if(page===3){document.querySelector('.blank').textContent=(state.answers.sound[0]||'____')+' '+(state.answers.sound[1]||'____');document.querySelectorAll('[data-group=object]').forEach(b=>selectStyle(b,state.answers.sound[0]===answer(b)));document.querySelectorAll('[data-group=state]').forEach(b=>selectStyle(b,state.answers.sound[1]===answer(b)))}if(page===4)document.querySelectorAll('[data-group=frost]').forEach(b=>selectStyle(b,state.answers.frost===answer(b)));if(page===6)document.querySelectorAll('[data-group=white]').forEach(b=>selectStyle(b,state.answers.allWhite===answer(b)));if(page===7)document.querySelectorAll('[data-group=time]').forEach(b=>selectStyle(b,state.answers.time===answer(b)));if(page===5)document.querySelectorAll('[data-group=yu]').forEach(b=>selectStyle(b,state.answers.yu[activeSlot]===answer(b)));}
function selectStyle(b,on){b.classList.toggle('selected',on);b.setAttribute('aria-pressed',on)}function go(n){whiteReady=false;page=Math.max(1,Math.min(8,n));render()}function showFeedback(key,text){const box=document.querySelector('.feedback');if(box)box.textContent='◈ '+(text||hint(state,key))}
const WHITE_DONE='白意已修复：雾凇沆砀，天与云与山与水，上下一白。';
function hotspot(task){
  if(task==='sound')return state.soundFixed?setNotice('此处已归于无声，原文写“湖中人鸟声俱绝”。'):go(2);
  if(task==='time')return state.timeFixed?setNotice('此处已辨为更定雪夜。'):go(7);
  if(task==='white'){if(state.whiteStage>=3)return setNotice(WHITE_DONE);return go(state.whiteStage===0?4:state.whiteStage===1?5:6)}
}
function undoLastRepair(){if(!undoRepair(state))return;stopBirds(0);whiteReady=false;sceneState=snapshot();sceneAnimation='';pendingSuccess='';render()}
function setNotice(text){page=1;pendingSuccess=text;render();window.setTimeout(()=>{pendingSuccess='';render()},1200)}
function repairAnimation(previous){if(previous.timeFixed!==state.timeFixed)return'time';if(previous.whiteStage!==state.whiteStage)return`white${state.whiteStage}`;return''}
function succeed(key,previous){if(key==='sound')stopBirds(500);recordRepair(state,key);const messages={sound:'声音归静，雪湖仍是原来的雪湖。',frost:'冰花与白气已在画卷中显现。',yu:'天、云、山、水的边界渐渐连缀。',allWhite:'天地浑融，白意已完整修复。',time:'日轮隐去，雪湖进入更定月夜。'};pendingSuccess=messages[key];panelClosing=false;render();window.setTimeout(()=>{panelClosing=true;render();window.setTimeout(()=>{page=1;panelClosing=false;sceneState=snapshot();sceneAnimation=repairAnimation(previous);render();window.setTimeout(()=>{sceneAnimation='';if(state.finalScene){pendingSuccess='';finalReady=true;page=8;render()}else{pendingSuccess='';render()}},SCENE_REVEAL)},PANEL_FADE)},SUCCESS_DWELL)}
/* 三句白意连答完成后，回到画卷并按 1→2→3 层逐次显影。 */
function completeWhite(){recordRepair(state,'allWhite');pendingSuccess='天地浑融，白意已完整修复。';panelClosing=false;render();window.setTimeout(()=>{panelClosing=true;render();window.setTimeout(()=>{page=1;whiteReady=false;panelClosing=false;sceneState={...snapshot(),whiteStage:1};sceneAnimation='white1';render();window.setTimeout(()=>{sceneState={...sceneState,whiteStage:2};sceneAnimation='white2';render();window.setTimeout(()=>{sceneState={...sceneState,whiteStage:3};sceneAnimation='white3';render();window.setTimeout(()=>{sceneAnimation='';pendingSuccess='';if(state.finalScene){finalReady=true;go(8)}else{render()}},SCENE_REVEAL)},SCENE_REVEAL)},SCENE_REVEAL)},PANEL_FADE)},SUCCESS_DWELL)}
function quick(change){stopBirds(0);change();sceneState=snapshot();sceneAnimation='';finalReady=state.finalScene;go(state.finalScene?8:1)}
app.addEventListener('click',e=>{if(mode!=='act1')return;const b=e.target.closest('button');if(!b||pendingSuccess)return;if(b.dataset.task){hotspot(b.dataset.task);return}if(b.dataset.action==='play-birds'){if(state.soundFixed){setNotice('此处已归于无声，原文写“湖中人鸟声俱绝”。');return}playBirds();const box=b.closest('.audio');if(box){box.classList.add('is-playing');const title=box.querySelector('b'),note=box.querySelector('small');if(title)title.textContent='鸟鸣仍在雪湖间回响';if(note)note.textContent='再次点击不会叠加播放；修复成功后，鸟鸣会随即消失。'}return}if(b.dataset.slot!==undefined){activeSlot=Number(b.dataset.slot);render();return}if(b.dataset.group){const g=b.dataset.group,v=answer(b);if(g==='object')state.answers.sound[0]=v;else if(g==='state')state.answers.sound[1]=v;else if(g==='frost')state.answers.frost=v;else if(g==='white')state.answers.allWhite=v;else if(g==='time')state.answers.time=v;else if(g==='yu')state.answers.yu[activeSlot]=v;render();return}const act=b.dataset.action;if(act==='home')go(state.finalScene?8:1);else if(act==='next')go(page+1);else if(act==='prev')go(page-1);else if(act==='back-scene')go(1);else if(act==='undo-repair')undoLastRepair();else if(act==='next-white'){whiteReady=false;go(page+1)}else if(act==='source'){sourceOpen=!sourceOpen;render()}else if(act==='reset'){stopBirds(0);state=createState();sceneState=snapshot();act2State=createAct2State();lessonState=createLesson();activeSlot=0;sourceOpen=false;pendingSuccess='';panelClosing=false;sceneAnimation='';finalReady=false;go(1)}else if(act==='quick-sound')quick(()=>{state.soundFixed=true;recordRepair(state,'sound')});else if(act==='quick-white')quick(()=>{state.whiteStage=3;recordRepair(state,'white')});else if(act==='quick-time')quick(()=>{state.timeFixed=true;recordRepair(state,'time')});else if(act==='placeholder'){const key=taskFor[page];if(!key)return;const previous=snapshot(),complete=verify(state,key);if(complete==='incomplete')showFeedback(key,'请先补全所有选择，再验证文字钥匙。');else if(complete==='locked')showFeedback(key,'请先完成上一层观白任务，再继续修复此处。');else if(complete){if(key==='frost'){whiteReady=true;render();showFeedback('','冰花与白气已在画卷中显影。点“下一个”继续补全第二句。')}else if(key==='yu'){whiteReady=true;render();showFeedback('','三个“与”已把天、云、山、水连缀成境，下一句随即而来。');window.setTimeout(()=>{if(whiteReady&&page===5)go(6)},900)}else if(key==='allWhite')completeWhite();else succeed(key,previous)}else showFeedback(key)}else if(act==='act2'){mode='act2';render()}});render();





window.addEventListener('pagehide',()=>disposeBirds());
/* 滚轮翻页：封面→第一幕→四笔→由画返文；工作台内不翻页，避免误触滑杆。 */
mountWheelNav({
  next:()=>{
    if(phase2Frame)return false;
    if(mode==='cover'){applyRoute(resumeRoute||'act1:1');render();return true}
    if(mode==='act1'){if(page<8)go(page+1);else{mode='act2';render()}return true}
    if(mode==='lesson')return clickDirectional('next');
    return false;
  },
  prev:()=>{
    if(phase2Frame)return false;
    if(mode==='act1'){if(page<=1)return false;go(page-1);return true}
    if(mode==='lesson')return clickDirectional('prev');
    if(mode==='act2'){mode='act1';page=8;render();return true}
    return false;
  }
});
if(params.get('demo')==='1')mountPresentation({navigate:navigateDemo,getRoute:()=>mode==='lesson'?'lesson:'+lessonState.step:mode==='act2'?'act2':mode==='cover'?'cover':'act1:'+page,resetCourse:()=>{leaveModes();closePhase2();resumeRoute='';state=createState();act2State=createAct2State();lessonState=createLesson();sceneState=snapshot();mode='cover';page=1;pendingSuccess='';finalReady=false;render();}});
window.__course={enterPhase2,openPhase2,closePhase2,hasFrame:()=>Boolean(phase2Frame),fullscreen:fullscreenNow,getRoute:()=>mode==='lesson'?'lesson:'+lessonState.step:mode==='act2'?'act2':mode==='cover'?'cover':'act1:'+page};
