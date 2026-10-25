import {clamp} from '../state.js';

// 《一点入亭》八镜头隔离预览 · 纯逻辑核心
// 参数来源：附件A《镜头参数配置_DRAFT.json》（首轮测试值，未经美术复核改判）
// 约束：01—03 同一学生画卷快照；03→04 仅短淡切/硬切；04—07 同一认可亭景原图连续推进，
// 05/06 不停顿，07 末端速度为零；08 播放已认可 V8 六秒循环，不改人物/白气/炉火/帽后飘带。

export const FRAME_SIZE=Object.freeze({width:1920,height:1080});
export const SOURCE_SIZE=Object.freeze({
  master:Object.freeze({width:1672,height:941}),
  close:Object.freeze({width:1448,height:1086}),
  v8:Object.freeze({width:1120,height:630})
});

// 新版节奏时间轴（新时间域，秒）：原 0—5s 压缩至约 1.8s，原 8—13s 压缩至约 2s
export const TIMELINE=Object.freeze({
  firstMotionStart:0.18,
  cutStart:3.26,
  cutEnd:3.50,
  crossfade:0.24,
  finalStill:8.72,
  loopDuration:6.0
});

// 原时间轴（空间路径采样域，秒）：裁切路径与插值曲线保持 V1 不变
export const SOURCE_TIMELINE=Object.freeze({
  firstMotionStart:0.9,
  cutStart:7.35,
  cutEnd:7.62,
  finalStill:16.0
});

// 新→旧 时间重映射锚点：镜头关键帧对应 + 用户指定锚点（原5→新1.8 / 原8→新3.72 / 原13→新5.72）
export const TIME_REMAP=Object.freeze([
  Object.freeze({newT:0,oldT:0}),
  Object.freeze({newT:0.18,oldT:0.9}),
  Object.freeze({newT:1.42,oldT:4.15}),
  Object.freeze({newT:1.8,oldT:5.0}),
  Object.freeze({newT:3.26,oldT:7.35}),
  Object.freeze({newT:3.5,oldT:7.62}),
  Object.freeze({newT:3.72,oldT:8.0}),
  Object.freeze({newT:4.36,oldT:9.6}),
  Object.freeze({newT:5.6,oldT:12.7}),
  Object.freeze({newT:5.72,oldT:13.0}),
  Object.freeze({newT:8.72,oldT:16.0})
]);

export const CUT_MODES=Object.freeze(['fade','hard']);
export const normalizeCutMode=value=>value==='hard'?'hard':'fade';

// —— 08 终镜文字叠层规格（交接包 V1：01_已批准效果与实现规格.md，逐字不得改）——
// 唯一逻辑坐标系 = V8 视频 1120×630；HTML 文字层为正式实现，透明 PNG 仅作视觉对照。
export const TEXT_OVERLAY=Object.freeze({
  origin:Object.freeze({x:352,y:116}),
  fontSize:22,
  lineHeight:34,
  color:'#27201C',
  // 羽化淡白范围 x=326–628、y=102–280（仅柔和墨纸留白，无方框边界）
  halo:Object.freeze({x1:326,y1:102,x2:628,y2:280}),
  lines:Object.freeze(['到亭上，有两人','铺毡对坐，一童子','烧酒炉正沸。','见余大喜曰：','“湖中焉得更有此人！”']),
  // 终镜激活后累计播放 0.35s 起整体渐显 0.70s；只出现一次，不随 6s 循环重复
  fade:Object.freeze({delay:0.35,duration:0.70})
});
export const TEXT_FULL=TEXT_OVERLAY.lines.join('');
// 渐显进度：elapsed=终镜激活后的累计播放时长（暂停时冻结；不用视频 currentTime 回绕值）。
// reduced=减少动态：直接完整显示。
export const textFadeProgress=(elapsed,reduced=false)=>{
  if(reduced)return 1;
  const p=(elapsed-TEXT_OVERLAY.fade.delay)/TEXT_OVERLAY.fade.duration;
  return Math.min(Math.max(p,0),1);
};

const shot=config=>Object.freeze({...config,crop:Object.freeze(config.crop)});
// time=旧时间域（空间路径采样用）；newTime=新版节奏时间点（对外时间轴）
export const SHOTS=Object.freeze([
  shot({id:'shot-01',number:1,name:'雪湖远望',source:'master',time:0.0,newTime:0,crop:{x:0,y:0,w:1672,h:940.5}}),
  shot({id:'shot-02',number:2,name:'向亭推进',source:'master',time:4.15,newTime:1.42,crop:{x:270,y:126,w:1260,h:708.75}}),
  shot({id:'shot-03',number:3,name:'来到亭前',source:'master',time:7.35,newTime:3.26,crop:{x:555,y:200,w:850,h:478.125}}),
  shot({id:'shot-04',number:4,name:'沿平台换角',source:'close',time:7.62,newTime:3.5,crop:{x:0,y:0,w:1448,h:814.5}}),
  shot({id:'shot-05',number:5,name:'继续靠近·锁视角',source:'close',time:9.6,newTime:4.36,crop:{x:90,y:60,w:1330,h:748.125}}),
  shot({id:'shot-06',number:6,name:'视角不变·继续前推',source:'close',time:12.7,newTime:5.6,crop:{x:430,y:232,w:880,h:495}}),
  shot({id:'shot-07',number:7,name:'亭中终点',source:'close',time:16.0,newTime:8.72,crop:{x:650,y:365,w:560,h:315}}),
  shot({id:'shot-08',number:8,name:'V8动态终镜',source:'v8',time:16.0,newTime:8.72,crop:{x:0,y:0,w:1120,h:630}})
]);

export const V8_ASSETS=Object.freeze({
  video:Object.freeze({file:'assets/V8_已认可终镜动态_6秒24fps.mp4',width:1120,height:630,duration:6,fps:24,sha256:'e85f87f3e27c56378826acc7a76ee969c2ecddeedb7de864d021473b5253caa0'}),
  poster:Object.freeze({file:'assets/V8_终镜冻结底图_1120x630.png',width:1120,height:630,sha256:'1e7ec68655e9764f888baa4c502c7305e23727595fa01c488f34f4c03b06d7d7'})
});
export const CLOSE_IMAGE=Object.freeze({file:'../pavilion-v3/assets/02_认可版_入亭后_两坐一立终点.png',width:1448,height:1086,sha256:'83337e2b369848cabac9e3eacf6b56b0d93f22cd8ea5a79ea861ff6db37b13a0'});

const byNumber=number=>SHOTS[number-1];

// —— 插值：log(宽度) 单调三次 Hermite（Fritsch–Carlson 限制），中心点 plain secant Hermite ——
// 端点切线：腿首/腿尾可覆盖（01 起点静止、07 终点速度为零；03/04 用单侧割线保持运动连续）。
function tangents(times,values,{monotone,startSlope,endSlope}){
  const n=values.length,h=[],d=[];
  for(let i=0;i<n-1;i++){h.push(times[i+1]-times[i]);d.push((values[i+1]-values[i])/h[i]);}
  const m=new Array(n);
  for(let i=1;i<n-1;i++){
    if(!monotone){m[i]=(values[i+1]-values[i-1])/(times[i+1]-times[i-1]);continue;}
    if(d[i-1]*d[i]<=0)m[i]=0;
    else{const w1=2*h[i]+h[i-1],w2=h[i]+2*h[i-1];m[i]=(w1+w2)/(w1/d[i-1]+w2/d[i]);}
  }
  m[0]=startSlope??d[0];
  m[n-1]=endSlope??d[n-2];
  if(monotone)for(let i=0;i<n-1;i++){
    if(d[i]===0){m[i]=0;m[i+1]=0;continue;}
    const a=m[i]/d[i],b=m[i+1]/d[i],s=a*a+b*b;
    if(s>9){const tau=3/Math.sqrt(s);m[i]=tau*a*d[i];m[i+1]=tau*b*d[i];}
  }
  return m;
}

function hermite(times,values,m,t){
  const n=times.length,tt=Math.min(Math.max(t,times[0]),times[n-1]);
  let i=0;while(i<n-2&&tt>times[i+1])i++;
  const h=times[i+1]-times[i],s=(tt-times[i])/h,s2=s*s,s3=s2*s;
  return (2*s3-3*s2+1)*values[i]+(s3-2*s2+s)*h*m[i]+(-2*s3+3*s2)*values[i+1]+(s3-s2)*h*m[i+1];
}

function legSampler(shots,{startSlope,endSlope}){
  const times=shots.map(s=>s.time);
  const logW=shots.map(s=>Math.log(s.crop.w));
  const cx=shots.map(s=>s.crop.x+s.crop.w/2);
  const cy=shots.map(s=>s.crop.y+s.crop.h/2);
  const mLogW=tangents(times,logW,{monotone:true,startSlope,endSlope});
  const mCx=tangents(times,cx,{monotone:false,startSlope,endSlope});
  const mCy=tangents(times,cy,{monotone:false,startSlope,endSlope});
  const source=SOURCE_SIZE[shots[0].source];
  return t=>{
    const w=Math.exp(hermite(times,logW,mLogW,t));
    const h=w*9/16;
    const x=Math.min(Math.max(hermite(times,cx,mCx,t)-w/2,0),source.width-w);
    const y=Math.min(Math.max(hermite(times,cy,mCy,t)-h/2,0),source.height-h);
    return {x,y,w,h};
  };
}

// 腿A：学生画卷快照（01→03），01 起点静止；腿B：认可亭景原图（04→07），07 终点速度为零。
// 采样始终在旧时间域进行，新版仅改变时间参数，不改变路径。
const legA=legSampler([byNumber(1),byNumber(2),byNumber(3)].map((s,i)=>i===0?{...s,time:SOURCE_TIMELINE.firstMotionStart}:s),{startSlope:0});
const legB=legSampler([byNumber(4),byNumber(5),byNumber(6),byNumber(7)],{endSlope:0});

// PCHIP 单调时间重映射：速度（导数）连续，无急加速/急刹；所有锚点精确通过
const remapTimes=TIME_REMAP.map(p=>p.newT),remapValues=TIME_REMAP.map(p=>p.oldT);
const remapSlopes=tangents(remapTimes,remapValues,{monotone:true});
export const toSourceTime=newT=>hermite(remapTimes,remapValues,remapSlopes,Math.min(Math.max(newT,0),TIMELINE.finalStill));

const cropOf=number=>byNumber(number).crop;

// 任一时刻需要绘制的图层序列（自下而上）。source==='v8' 的图层由页面换成 <video>。
// 入口为新时间域；腿部采样内部换算到旧时间域。
export function layersAt(time,mode='fade'){
  const cut=normalizeCutMode(mode),t=Math.max(0,time);
  if(t>=TIMELINE.finalStill)return [
    {source:'close',crop:cropOf(7),alpha:1,role:'underlay'},
    {source:'v8',crop:cropOf(8),alpha:1,role:'video'}
  ];
  if(t<TIMELINE.firstMotionStart)return [{source:'master',crop:cropOf(1),alpha:1,role:'base'}];
  if(t<TIMELINE.cutStart)return [{source:'master',crop:legA(toSourceTime(t)),alpha:1,role:'base'}];
  if(t<TIMELINE.cutEnd){
    if(cut==='hard')return [{source:'close',crop:cropOf(4),alpha:1,role:'base'}];
    const p=(t-TIMELINE.cutStart)/TIMELINE.crossfade;
    return [
      {source:'master',crop:cropOf(3),alpha:1-p,role:'cut-out'},
      {source:'close',crop:cropOf(4),alpha:p,role:'cut-in'}
    ];
  }
  return [{source:'close',crop:legB(toSourceTime(t)),alpha:1,role:'base'}];
}

// 段落信息：驱动镜头清单高亮与状态文案（高亮=正在抵达的镜头）。
export function segmentAt(time){
  const t=Math.max(0,time);
  if(t>=TIMELINE.finalStill)return {id:'final-loop',activeShot:8,label:'08 · V8动态终镜（六秒循环）'};
  if(t<TIMELINE.firstMotionStart)return {id:'hold-01',activeShot:1,label:'01 · 雪湖远望（静止）'};
  if(t<TIMELINE.cutStart&&t<1.42)return {id:'move-02',activeShot:2,label:'01→02 · 向亭推进'};
  if(t<TIMELINE.cutStart)return {id:'move-03',activeShot:3,label:'02→03 · 来到亭前'};
  if(t<TIMELINE.cutEnd)return {id:'cut',activeShot:4,label:'03→04 · 直接转场'};
  if(t<4.36)return {id:'move-05',activeShot:5,label:'04→05 · 继续靠近·锁视角'};
  if(t<5.6)return {id:'move-06',activeShot:6,label:'05→06 · 视角不变·继续前推'};
  return {id:'move-07',activeShot:7,label:'06→07 · 亭中终点'};
}

export const normalizeStudentValues=(values={})=>({
  causeway:Math.round(clamp(values.causeway)),
  pavilion:Math.round(clamp(values.pavilion)),
  boat:Math.round(clamp(values.boat)),
  people:Math.round(clamp(values.people))
});
