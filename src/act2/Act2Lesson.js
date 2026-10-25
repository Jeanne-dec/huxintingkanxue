import {loadMaster,renderScene,SCENE_SIZE} from './v10-art/rendererV10.js';
import {QUESTIONS,RATING_KEYS,RATING_NAMES,RATING_LEVELS,RATING_DESCRIPTIONS,createLesson,chooseQuestion,updateDraft,chooseRating,ratingNext,ratingProgress,scrollSceneValues,studentScrollLayout,advanceLesson,previousLesson,lessonGuard,updateInquiry,toggleInquiryHint} from './Act2LessonState.js';
import {inquiryPage,closurePage} from './InquiryPages.js';
import {mountDemoFill,clearDemoFill} from '../demo-fill.js?v=1';
export {createLesson};

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const stepTitle={returnText:'回到文字',questions:'四问择一',epitaph:'学生题跋',baimiao:'认识白描',rating:'自评落印',scroll:'个人画卷'};
export async function renderCurrentScene(canvas,values,masterLoader=loadMaster){
  const master=await masterLoader();
  renderScene(canvas,{values:scrollSceneValues(values),compareOriginal:false},master);
  return canvas;
}
export async function renderStudentScroll(canvas,{values,epitaph,selfRatings},masterLoader=loadMaster){
  await document.fonts?.ready;
  const scene=document.createElement('canvas');await renderCurrentScene(scene,values,masterLoader);
  const text=epitaph||'题跋待补',layout=studentScrollLayout(text);
  canvas.width=SCENE_SIZE.width;canvas.height=layout.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.fillStyle='#eee5d2';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(scene,0,0,SCENE_SIZE.width,SCENE_SIZE.height);
  ctx.fillStyle='rgba(250,248,241,.94)';ctx.fillRect(0,941,SCENE_SIZE.width,canvas.height-941);
  ctx.strokeStyle='#b89a77';ctx.strokeRect(28,968,SCENE_SIZE.width-56,canvas.height-996);
  ctx.fillStyle='#2d444a';ctx.font='32px serif';ctx.fillText('雪湖题跋',68,layout.textY);ctx.font='25px serif';
  layout.lines.forEach((line,i)=>ctx.fillText(line,242,layout.textY+i*34));
  let x=70;
  RATING_KEYS.forEach(key=>{const value=selfRatings[key];if(!value)return;ctx.strokeStyle='#9c352c';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x+68,layout.stampY,44,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#9c352c';ctx.font='17px serif';ctx.fillText(`${RATING_NAMES[key]}·${value}`,x+21,layout.stampY+6);x+=190;});
  return canvas;
}
function header(step){return `<header><p>第二幕 · 张岱的四笔</p><h1>${stepTitle[step]}</h1></header>`;}
function nav(step){return `<nav class="lesson-nav" aria-label="课堂环节导航"><button data-l="back">返回四笔工作台</button><button data-l="prev">‹ 上一步</button>${['scroll','closure','epitaph'].includes(step)?'':`<button data-l="next" class="lesson-primary">${step==='du'?'继续：痴又为何痴':step==='chi'?'走向课堂收束':'继续 ›'}</button>`}</nav>`;}
function picture(){return `<div class="lesson-picture"><canvas aria-label="学生实际调整后的雪湖画卷" data-scene></canvas></div>`;}
function ratingPage(lesson){
  const {current}=ratingProgress(lesson),focus=lesson.ratingFocus||current||RATING_KEYS.at(-1),descriptions=RATING_DESCRIPTIONS[focus];
  return `${header('rating')}<article class="rating-focus"><p class="rating-progress">第 ${RATING_KEYS.indexOf(focus)+1} / 3 枚印 · ${RATING_NAMES[focus]}</p><h2>${RATING_NAMES[focus]}</h2><p>${current?'选择现在最贴近你的学习状态，落下这枚印；点“继续”进入下一维度。':'三枚印已落成；可点击印章回看修改，点“继续”生成个人画卷。'}</p>${descriptions.map((text,index)=>`<button class="rate ${lesson.selfRatings[focus]===RATING_LEVELS[index]?'selected':''}" aria-pressed="${lesson.selfRatings[focus]===RATING_LEVELS[index]}" data-rate="${focus}:${RATING_LEVELS[index]}"><b>${RATING_LEVELS[index]}</b>${text}</button>`).join('')}<div class="stamps">${RATING_KEYS.filter(key=>lesson.selfRatings[key]).map(key=>`<button class="stamp" data-rating-focus="${key}">${RATING_NAMES[key]}·${lesson.selfRatings[key]}</button>`).join('')}</div></article>${nav('rating')}`;
}
function page(state,lesson){
  if(['du','chi'].includes(lesson.step))return inquiryPage(lesson,esc,()=>nav(lesson.step));
  if(lesson.step==='closure')return closurePage(lesson,esc,()=>nav('closure'));
  if(lesson.step==='baimiao')return `${header('baimiao')}<div class="baimiao-grid">${picture()}<article class="baimiao-card"><h2>白描：</h2><p class="baimiao-definition">用简练质朴的语言，抓住事物主要特征，勾勒事物形象。</p><dl class="baimiao-points"><div><dt>特点</dt><dd>简练质朴，抓住特征</dd></div><div><dt>效果</dt><dd>寥寥数笔，境界全出</dd></div></dl><p class="baimiao-example">如“长堤一痕，湖心亭一点，与余舟一芥，舟中人两三粒”，寥寥几笔，便写出了雪湖的空阔与景物的渺小。</p></article></div>${nav('baimiao')}`;
  if(lesson.step==='returnText')return `${header('returnText')}<div class="return-text-grid">${picture()}<article><p>如果换一种说法：<br>长堤一条，湖心亭一座，余舟一艘，舟中人两三个人。</p><p><b>张岱的写法：</b><br>长堤一痕，湖心亭一点，与余舟一芥，舟中人两三粒。</p><p>同样是这些景物，为什么换了几个字，雪湖给人的感觉就不同了？</p></article></div>${nav('returnText')}`;
  if(lesson.step==='questions')return `${header('questions')}<section class="question-grid">${Object.entries(QUESTIONS).map(([key,question])=>`<button class="question ${lesson.selectedQuestion===key?'selected':''}" data-q="${key}">${question}</button>`).join('')}</section><p class="lesson-caption">只选一道深入回应；可以随时改选，草稿会保留。</p>${nav('questions')}`;
  if(lesson.step==='epitaph'){
    const key=lesson.selectedQuestion,draft=key?lesson.questionDrafts[key]:'';
    return `${header('epitaph')}<article><p>${key?QUESTIONS[key]:'请先选择一道追问。'}</p><label class="sr-only" for="student-epitaph">我的原话题跋</label><textarea id="student-epitaph" data-draft ${key?'':'disabled'} maxlength="150" placeholder="写下你的原话，推荐20—80字。">${esc(draft)}</textarea><p data-count>${draft.length} / 150</p><button data-l="save" class="lesson-primary">保存并生成题跋</button></article>${nav('epitaph')}`;
  }
  if(lesson.step==='rating')return ratingPage(lesson);
  const stamps=RATING_KEYS.map(key=>`<i>${lesson.selfRatings[key]?`${RATING_NAMES[key]}·${lesson.selfRatings[key]}`:'待补'}</i>`).join('');
  return `${header('scroll')}<div class="personal-scroll">${picture(state.values)}<article class="scroll"><h2>雪湖题跋</h2><p class="student-wording">${esc(lesson.epitaph||'题跋待补')}</p><div class="stamps">${stamps}</div></article></div><div class="scroll-actions"><button data-l="export" class="lesson-primary">保存画卷 PNG</button><button data-l="nextLesson">继续：一点入亭 ›</button></div><p class="lesson-caption" data-export></p>${nav('scroll')}`;
}
export function mountLesson(root,getState,setLesson,onBack,onEnterPhase2=()=>{}){
  root._lessonAbort?.abort();
  const abort=new AbortController();root._lessonAbort=abort;
  let revision=0;
  const message=text=>{const element=root.querySelector('.lesson-message');if(element)element.textContent=text;};
  const render=()=>{
    const state=getState(),ticket=++revision;
    root.innerHTML=`<section class="lesson lesson-${state.lesson.step}">${page(state,state.lesson)}<p class="lesson-message" role="status" aria-live="polite"></p></section>`;
    root.scrollTop=0;
    const canvas=root.querySelector('[data-scene]');
    if(canvas)renderCurrentScene(canvas,state.values).then(()=>{if(ticket===revision)canvas.dataset.ready='true';}).catch(error=>{if(ticket===revision)message(error.message);});
    root.dispatchEvent(new CustomEvent('lessonstepchange',{bubbles:true}));
    if(state.lesson.step==='epitaph')mountDemoFill([{selector:'#student-epitaph',answer:'epitaph'}]);
    else clearDemoFill();
  };
  const commit=lesson=>{setLesson(lesson);render();};
  const next=()=>{const lesson=getState().lesson;
    if(lesson.step==='rating'){const result=ratingNext(lesson);if(result.message){message(result.message);return;}commit(result.lesson);return;}
    const error=lessonGuard(lesson);if(error){message(error);return;}commit(advanceLesson(lesson));};
  root.addEventListener('click',async event=>{
    const button=event.target.closest('button');if(!button)return;
    const lesson=getState().lesson;
    if(button.dataset.q){commit(chooseQuestion(lesson,button.dataset.q));return;}
    if(button.dataset.rate){const [key,value]=button.dataset.rate.split(':');commit(chooseRating(lesson,key,value));return;}
    if(button.dataset.ratingFocus){commit({...lesson,ratingFocus:button.dataset.ratingFocus});return;}
    if(button.dataset.inquiryHint){commit(toggleInquiryHint(lesson,button.dataset.inquiryHint));return;}
    const action=button.dataset.l;
    if(action==='back'){abort.abort();onBack();}
    else if(action==='nextLesson')onEnterPhase2();
    else if(action==='save')next();
    else if(action==='next'){lesson.step==='scroll'?onEnterPhase2():next();}
    else if(action==='prev'){if(lesson.step==='returnText'){abort.abort();onBack();}else commit(previousLesson(lesson));}
    else if(action==='scroll')commit({...lesson,step:'scroll'});
    else if(action==='revisit')commit({...lesson,step:'returnText'});
    else if(action==='export'){
      const ticket=revision,values={...getState().values};button.disabled=true;message('正在按当前画卷生成 PNG……');
      try{
        const canvas=document.createElement('canvas');await renderStudentScroll(canvas,{values,epitaph:lesson.epitaph,selfRatings:lesson.selfRatings});
        const link=document.createElement('a');link.download='我的雪湖画卷.png';link.href=canvas.toDataURL('image/png');document.body.append(link);link.click();link.remove();
        if(ticket===revision)message('已保存当前四笔、原话题跋与三枚自评印章。');
      }catch(error){if(ticket===revision)message(`保存失败，请重试：${error.message}`);}
      finally{if(ticket===revision)button.disabled=false;}
    }
  },{signal:abort.signal});
  root.addEventListener('input',event=>{
    if(event.target.matches('[data-draft]')){
      setLesson(updateDraft(getState().lesson,event.target.value));
      root.querySelector('[data-count]').textContent=`${event.target.value.length} / 150`;
    }else if(event.target.dataset.inquiry)setLesson(updateInquiry(getState().lesson,event.target.dataset.inquiry,event.target.value));
  },{signal:abort.signal});
  render();
  return {destroy(){revision++;abort.abort();clearDemoFill();}};
}
