/* 第一幕“寻声”的鸟鸣：只由学生点击触发，循环播放，修复成功后渐弱停止。 */
const VOLUME=.35,FADE_STEP=40;
let element=null,fadeTimer=0;

const ensureAudio=()=>{
  if(element)return element;
  element=new Audio(new URL('./assets/birds.wav',import.meta.url).href);
  element.loop=true;
  element.preload='auto';
  element.volume=VOLUME;
  return element;
};

export function isBirdsPlaying(){return Boolean(element&&!element.paused&&!element.ended);}

export function playBirds(){
  const audio=ensureAudio();
  if(fadeTimer){clearInterval(fadeTimer);fadeTimer=0;}
  audio.volume=VOLUME;
  if(isBirdsPlaying())return true;
  const started=audio.play();
  if(started&&typeof started.catch==='function')started.catch(()=>{});
  return true;
}

export function stopBirds(fadeMs=0){
  if(!element)return;
  if(fadeTimer){clearInterval(fadeTimer);fadeTimer=0;}
  const audio=element;
  if(audio.paused)return;
  if(fadeMs>0){
    const steps=Math.max(1,Math.round(fadeMs/FADE_STEP));
    let step=0;
    fadeTimer=setInterval(()=>{
      step+=1;
      audio.volume=Math.max(0,VOLUME*(1-step/steps));
      if(step>=steps){
        clearInterval(fadeTimer);fadeTimer=0;
        audio.pause();
        try{audio.currentTime=0;}catch{}
        audio.volume=VOLUME;
      }
    },FADE_STEP);
    return;
  }
  audio.pause();
  try{audio.currentTime=0;}catch{}
  audio.volume=VOLUME;
}

export function disposeBirds(){
  if(fadeTimer){clearInterval(fadeTimer);fadeTimer=0;}
  if(!element)return;
  element.pause();
  element.removeAttribute('src');
  element.load?.();
  element=null;
}
