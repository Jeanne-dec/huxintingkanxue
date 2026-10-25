import {readSession,SESSION_KEY} from '../../session.js';
import {loadMaster,renderScene} from '../v10-art/rendererV10.js';
import {applyFlowMode,flowHref} from '../../flow-mode.js';
import {mountCourseProgress} from '../../progress-nav.js';
import {mountPageDots} from '../../page-dots.js';
import {mountWheelNav} from '../../wheel-nav.js';
import {installFullscreenShell} from '../../fs-shell.js';
import {RATING_KEYS,RATING_LEVELS,RATING_NAMES} from '../Act2LessonState.js';
import {hasSavedAct2Values,readFinaleState} from './state.js';
import {RATING2_KEYS,RATING2_NAMES,readRating2State} from './rating-state.js';

applyFlowMode();
installFullscreenShell();
mountCourseProgress(3);
mountPageDots();
mountWheelNav();

const stage=document.querySelector('[data-scroll-stage]');
const status=document.querySelector('[data-status]');
const exportButton=document.querySelector('[data-export-scroll]');
const prevLink=document.querySelector('[data-prev]');
const finale=readFinaleState();
const rating2=readRating2State();
let rawSession=null;
try{rawSession=JSON.parse(localStorage.getItem(SESSION_KEY));}catch{}
const session=hasSavedAct2Values(rawSession)?readSession():null;
const values=session?.act2State?.values?{...session.act2State.values}:null;
const firstEpitaph=(session?.lessonState?.epitaph||'').trim();
const firstRatings=session?.lessonState?.selfRatings||{};
const secondEpitaph=finale.saved.response.trim();
const secondRatings=rating2.selfRatings;
const api={ready:false,page:'final-scroll',values,lastExport:null,getState:()=>({finale:readFinaleState(),rating2:readRating2State()})};
window.__PHASE2_FINALE__=api;

const announce=(message,type='info')=>{status.textContent=message;status.dataset.type=type;};
const escape=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const firstSeals=RATING_KEYS.filter(key=>RATING_LEVELS.includes(firstRatings[key])).map(key=>`${RATING_NAMES[key]}·${firstRatings[key]}`);
const secondSeals=RATING2_KEYS.filter(key=>RATING_LEVELS.includes(secondRatings[key])).map(key=>`${RATING2_NAMES[key]}·${secondRatings[key]}`);
const sealHtml=list=>list.map(text=>`<span class="seal-stamp">${escape(text)}</span>`).join('');

if(prevLink)prevLink.href=flowHref('rating.html');

function emptyView(){
  const reasons=[];
  if(!values)reasons.push('尚未找到你在《张岱的四笔》中保存的雪湖');
  if(!secondEpitaph)reasons.push('尚未在“此刻，我想怎样回应”中保存新的理解');
  stage.innerHTML=`<article class="final-empty" data-empty><h2>画卷还未收入完整</h2><p>${escape(reasons.join('；'))}。请返回对应页面完成真实的学习成果，再回到这里。</p><div class="empty-actions"><a class="nav-button" href="./rating.html">返回自评落印</a><a class="nav-button" href="../../../index.html?demo=1&amp;preview=0">回到课堂</a></div></article>`;
  api.ready=true;document.body.dataset.ready='true';
}

function sceneMarkup(){
  return `<figure class="final-scene"><canvas data-scene width="1672" height="941" aria-label="学生在四笔工作台中调整后的雪湖"></canvas></figure>`;
}
function panelMarkup(){
  const firstNote=firstEpitaph?'':`<p class="missing-note">尚未保存第一环节的题跋。</p>`;
  const firstSealNote=firstSeals.length===3?'':`<p class="missing-note">第一环节自评尚未落齐，可回到“个人画卷”页补齐。</p>`;
  const secondSealNote=secondSeals.length===3?'':`<p class="missing-note">第二环节自评尚未落齐，请回到“自评落印”页补齐。</p>`;
  return `<aside class="final-panel"><h2>雪湖题跋</h2>
    <section class="epitaph-block"><p data-epitaph="first">${escape(firstEpitaph||'题跋待补')}</p><div class="seals" data-seals="first">${sealHtml(firstSeals)}</div>${firstNote}${firstSealNote}</section>
    <section class="epitaph-block"><p data-epitaph="second">${escape(secondEpitaph)}</p><div class="seals" data-seals="second">${sealHtml(secondSeals)}</div>${secondSealNote}</section>
  </aside>`;
}

function wrapText(ctx,text,maxWidth){
  const closing=/[。！？，；：、”’）】》]/u;
  const opening=/[“‘（【《]/u;
  const paragraphs=String(text??'').replace(/\r\n?/g,'\n').split('\n');
  const lines=[];
  for(const paragraph of paragraphs){
    const chars=Array.from(paragraph);
    if(!chars.length){lines.push('');continue;}
    let line='';
    for(const char of chars){
      const candidate=line+char;
      if(ctx.measureText(candidate).width>maxWidth&&line){
        if(closing.test(char)){
          lines.push(candidate);
          line='';
          continue;
        }
        if(opening.test(char)){lines.push(line);line=char;continue;}
        lines.push(line);line=char;
      }else line=candidate;
    }
    if(line)lines.push(line);
  }
  return lines;
}

function drawSeals(ctx,seals,x,y,width,lineHeight){
  let cursor=x;
  const height=30;
  for(const text of seals){
    ctx.strokeStyle='#a35a4c';ctx.fillStyle='#a35a4c';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.ellipse(cursor+56,y+height/2,56,height/2,0,0,Math.PI*2);ctx.stroke();
    ctx.font='13px "Noto Serif CJK SC","Source Han Serif SC","Songti SC",serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(text,cursor+56,y+height/2+1);
    cursor+=124;
    if(cursor+112>x+width){cursor=x;y+=lineHeight;}
  }
  ctx.textAlign='left';ctx.textBaseline='alphabetic';
  return y+height;
}

async function exportScroll(scene){
  await document.fonts?.ready;
  const scale=1,width=2000,sceneWidth=1400,sceneHeight=Math.round(sceneWidth*941/1672);
  const panelX=60+sceneWidth+46,panelWidth=width-panelX-60;
  const probe=document.createElement('canvas').getContext('2d');
  const bodyFont='20px "Noto Serif CJK SC","Source Han Serif SC","Songti SC",serif';
  probe.font=bodyFont;
  const firstLines=wrapText(probe,firstEpitaph||'题跋待补',panelWidth-8);
  const secondLines=wrapText(probe,secondEpitaph,panelWidth-8);
  const lineHeight=34,blockGap=34,stampArea=44;
  const firstHeight=40+firstLines.length*lineHeight+stampArea+(firstSeals.length?12:0);
  const secondHeight=40+secondLines.length*lineHeight+stampArea+(secondSeals.length?12:0);
  const panelHeight=firstHeight+blockGap+secondHeight+30;
  const height=Math.max(Math.round(1080),170+Math.max(sceneHeight,panelHeight)+90);
  const canvas=document.createElement('canvas');canvas.width=width*scale;canvas.height=height*scale;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#f7f5ee';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#2d444a';ctx.font='40px "Noto Serif CJK SC","Source Han Serif SC","Songti SC",serif';ctx.textBaseline='alphabetic';
  ctx.fillText('我的雪湖画卷',60,84);
  ctx.font='19px "Noto Serif CJK SC","Source Han Serif SC","Songti SC",serif';ctx.fillStyle='#8a938f';
  ctx.fillText('四笔 · 两则题跋 · 两组自评',60,120);
  ctx.strokeStyle='#cfc9ba';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(60,144);ctx.lineTo(width-60,144);ctx.stroke();
  ctx.drawImage(scene,60,170,sceneWidth,sceneHeight);
  ctx.strokeStyle='rgba(120,145,150,.34)';ctx.strokeRect(60.5,170.5,sceneWidth-1,sceneHeight-1);
  ctx.beginPath();ctx.moveTo(panelX-24,170);ctx.lineTo(panelX-24,170+Math.max(sceneHeight,panelHeight));ctx.stroke();
  ctx.fillStyle='#3c5557';ctx.font='24px "Noto Serif CJK SC","Source Han Serif SC","Songti SC",serif';
  ctx.fillText('雪湖题跋',panelX,204);
  let y=170+38;
  ctx.font=bodyFont;ctx.fillStyle='#3e5454';
  for(const line of firstLines){ctx.fillText(line,panelX,y);y+=lineHeight;}
  if(firstSeals.length){y+=8;y=drawSeals(ctx,firstSeals,panelX,y,panelWidth,42);}
  y+=blockGap;
  ctx.strokeStyle='#e0dacb';ctx.beginPath();ctx.moveTo(panelX,y-16);ctx.lineTo(panelX+panelWidth-8,y-16);ctx.stroke();
  ctx.fillStyle='#3e5454';ctx.font=bodyFont;
  for(const line of secondLines){ctx.fillText(line,panelX,y);y+=lineHeight;}
  if(secondSeals.length){y+=8;y=drawSeals(ctx,secondSeals,panelX,y,panelWidth,42);}
  api.lastExport={width:canvas.width,height:canvas.height,text:secondEpitaph,firstEpitaph,firstSeals,secondSeals,values:{...values},sceneDataUrl:scene.toDataURL('image/png')};
  const href=canvas.toDataURL('image/png');
  if(!href.startsWith('data:image/png;base64,'))throw new Error('浏览器未能生成PNG。');
  const link=document.createElement('a');link.download='我的雪湖画卷-整课成果.png';link.href=href;document.body.append(link);link.click();link.remove();
}

async function mount(){
  if(!values||!secondEpitaph){emptyView();return;}
  stage.innerHTML=`${sceneMarkup()}${panelMarkup()}`;
  const scene=stage.querySelector('[data-scene]');
  try{
    renderScene(scene,{values,compareOriginal:false},await loadMaster());
    scene.dataset.ready='true';exportButton.hidden=false;
    exportButton.addEventListener('click',async()=>{
      exportButton.disabled=true;announce('正在按四笔、两则题跋与六枚印章生成画卷……');
      try{await exportScroll(scene);announce('画卷 PNG 已生成，浏览器将开始下载。','success');}
      catch(error){announce(`保存失败：${error.message}`,'error');}
      finally{exportButton.disabled=false;}
    });
  }catch(error){
    stage.innerHTML=`<article class="final-empty" data-empty><h2>暂时无法绘制画卷</h2><p>${escape(error.message)}</p><div class="empty-actions"><a class="nav-button" href="../../../index.html?demo=1&amp;preview=0">回到课堂</a></div></article>`;
    announce('画卷资源加载失败，请稍后重试。','error');
  }
  api.ready=true;document.body.dataset.ready='true';
}

mount();
