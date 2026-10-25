export const DEMO_ROUTES=[
  {id:'cover',label:'封面 · 湖心亭看雪'},
  {id:'act1:1',label:'P01 · 雪湖发现'},
  {id:'act1:2',label:'P02 · 寻声发现'},
  {id:'act1:3',label:'P03 · 寻声文字钥匙'},
  {id:'act1:4',label:'P04 · 观白：雾凇沆砀'},
  {id:'act1:5',label:'P05 · 观白：三个“与”'},
  {id:'act1:6',label:'P06 · 观白：上下一白'},
  {id:'act1:7',label:'P07 · 辨时'},
  {id:'act1:8',label:'P08 · 执笔入画'},
  {id:'act2',label:'第二幕 · 四笔工作台'},
  {id:'lesson:returnText',label:'由画返文'},
  {id:'lesson:questions',label:'四问择一'},
  {id:'lesson:epitaph',label:'学生题跋'},
  {id:'lesson:baimiao',label:'认识白描'},
  {id:'lesson:rating',label:'自评落印'},
  {id:'lesson:scroll',label:'个人画卷'},
  {id:'phase2:pavilion',label:'第二环节 · 一点入亭'},
  {id:'phase2:portrait',label:'第二环节 · 人物笺'},
  {id:'phase2:judgment',label:'第二环节 · 个人初判'},
  {id:'phase2:challenge',label:'第二环节 · 同伴质疑'},
  {id:'phase2:bridge',label:'第二环节 · 课堂追问'},
  {id:'phase2:response',label:'第二环节 · 此刻回应'},
  {id:'phase2:rating',label:'第二环节 · 自评落印'},
  {id:'phase2:scroll',label:'第二环节 · 整课成果画卷'},
  {id:'phase2:homework',label:'尾声 · 课后学习任务'},
  {id:'phase2:thanks',label:'谢幕 · 谢谢'},
  {id:'lesson:du',label:'独往何以独（旧版试制）'},
  {id:'lesson:chi',label:'痴又为何痴（旧版试制）'},
  {id:'lesson:closure',label:'课堂收束（旧版试制）'}
];
export function mountPresentation({navigate,getRoute,resetCourse}){
  const panel=document.createElement('details');panel.className='demo-panel';
  panel.innerHTML='<summary>彩排 <time>00:00</time></summary><div class="demo-controls"><label>教师分段导航<select aria-label="教师分段导航">'+DEMO_ROUTES.map(route=>`<option value="${route.id}">${route.label}</option>`).join('')+'</select></label><button data-demo="pause">暂停计时</button><button data-demo="timer">计时归零</button><button data-demo="fullscreen">全屏</button><button data-demo="reset">新一轮课堂</button><p>目标 10—12 分钟 · 跳转保留已有作答，不代填答案。</p><p><a href="./src/act2/pavilion-v8-eight/preview.html" target="_blank" rel="noopener">打开“一点入亭”V8 八镜头隔离预览 ↗</a></p><p><a href="./src/act2/pavilion-v4-seven/preview.html" target="_blank" rel="noopener">打开“一点入亭”V4 七镜头隔离预览 ↗</a></p><p><a href="./src/act2/phase2-debate-preview/portrait.html" target="_blank" rel="noopener">打开“人物笺与痴人论辩笺”V2 隔离预览 ↗</a></p><p><a href="./src/act2/phase2-bridge/bridge.html" target="_blank" rel="noopener">打开“课堂追问”隔离预览 ↗</a></p><p><a href="./src/act2/phase2-finale-preview/response.html" target="_blank" rel="noopener">打开“此刻我想怎么回应”隔离预览 ↗</a></p><p><a href="./src/act2/phase2-finale-preview/scroll.html" target="_blank" rel="noopener">打开“我的雪湖画卷”隔离预览 ↗</a></p><p><a href="./src/act2/pavilion-v3/preview.html" target="_blank" rel="noopener">打开“一点入亭”V3 隔离预览 ↗</a></p><p><a href="./src/act2/art-review/draft-preview.html" target="_blank" rel="noopener">打开舟人 DRAFT 隔离预览 ↗</a></p><p>舟人演示候选已冻结；正式美术 BLOCKED_ART。</p></div>';
  document.body.append(panel);
  const select=panel.querySelector('select'),clock=panel.querySelector('time');let elapsed=0,last=Date.now(),running=true;
  select.onchange=()=>navigate(select.value);
  panel.addEventListener('click',event=>{
    const action=event.target.dataset.demo;
    if(action==='pause'){running=!running;last=Date.now();event.target.textContent=running?'暂停计时':'继续计时';}
    if(action==='timer'){elapsed=0;last=Date.now();}
    if(action==='fullscreen'){const promise=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();promise?.catch(()=>{});}
    if(action==='reset'&&window.confirm('开始新一轮课堂会清除本机已保存的作答、题跋与自评。是否继续？')){elapsed=0;last=Date.now();resetCourse();}
  });
  setInterval(()=>{const now=Date.now();if(running)elapsed+=now-last;last=now;const seconds=Math.floor(elapsed/1000);clock.textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;clock.dataset.over=String(seconds>720);select.value=getRoute();},500);
}
