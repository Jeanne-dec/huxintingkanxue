/* 课堂演示：点击进度条右侧“示范填入”，把预设答案逐字写入当前页面的作答框。
   只用于教师展示，不改变学生手动输入与保存逻辑。 */
const ANSWERS={
  epitaph:'“两三粒”把人写得极小，更显天地空阔，也写出人融入雪景之中。',
  judgment:'我赞同 AI 的看法。文本依据：“大雪三日，湖中人鸟声俱绝。”“独往湖心亭看雪。”“莫说相公痴，更有痴似相公者！”大雪三日后的深夜，他仍独自去湖心亭看雪，这样的举动确实不同常人，说明他对雪景有近乎痴迷的热爱。',
  heard:'有人认为张岱并不是真的“傻”或“痴”，而是有雅趣、有审美追求，只是比一般人更执着。',
  question:'如果你认为他不是真痴，那他为什么要在“大雪三日”“更定”时独往看雪？这种不同常人的举动，又该怎样理解呢？',
  response:'我也有过这样的时刻。比如一个人傍晚散步、听歌，或者专心做一件自己喜欢的事时，周围很安静，好像暂时不用向别人解释什么，只要沉浸其中，就会觉得很自在、很充实。那种感觉，和“独与天地精神往来”有一点相似。\n\n张岱，我想你当时去湖心亭看雪，也不只是为了看风景，更是在寻找一种只有自己才能真正体会的心境。也许不是所有人都会理解你，但你愿意忠于自己的热爱，这份“痴”很可贵，也很动人。'
};

let current=null;
let runId=0;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function typeInto(field,token){
  const element=typeof field==='string'?document.querySelector(field):(field.element??document.querySelector(field.selector));
  if(!element)return false;
  if(element.disabled)element.disabled=false;
  const limit=Number(element.maxLength)>0?element.maxLength:Infinity;
  const value=String(field.text??ANSWERS[field.answer]??'').slice(0,limit);
  element.value='';
  element.dispatchEvent(new Event('input',{bubbles:true}));
  for(let index=2;index<=value.length;index+=2){
    if(token!==runId)return false;
    element.value=value.slice(0,index);
    element.dispatchEvent(new Event('input',{bubbles:true}));
    if(index%24===0)await sleep(32);else await sleep(16);
  }
  element.value=value;
  element.dispatchEvent(new Event('input',{bubbles:true}));
  element.dispatchEvent(new Event('change',{bubbles:true}));
  return true;
}

export function clearDemoFill(){
  runId++;
  if(!current)return;
  current.button.removeEventListener('click',current.handle);
  current.button.hidden=true;
  current.button.dataset.busy='false';
  current.button.textContent='示范填入';
  current=null;
}

export function mountDemoFill(fields,label='示范填入'){
  clearDemoFill();
  const usable=fields.filter(field=>typeof field==='string'?document.querySelector(field):Boolean(field.element??document.querySelector(field.selector)));
  if(!usable.length)return false;
  const button=document.querySelector('.cp-demo');
  if(!button)return false;
  button.hidden=false;
  button.textContent=label;
  button.dataset.demoFill='true';
  button.dataset.busy='false';
  const handle=async()=>{
    if(button.dataset.busy==='true')return;
    const token=++runId;
    button.dataset.busy='true';
    button.textContent='正在填入…';
    for(const field of usable){
      if(token!==runId)break;
      await typeInto(field,token);
    }
    if(token===runId){
      button.textContent=label;
      button.dataset.busy='false';
    }
  };
  button.addEventListener('click',handle);
  current={button,handle};
  return true;
}
