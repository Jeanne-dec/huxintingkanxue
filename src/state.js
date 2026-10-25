export const progressOf=s=>Number(s.soundFixed)+Number(s.whiteStage===3)+Number(s.timeFixed);
export const isFinal=s=>progressOf(s)===3;
export const createState=()=>{const s={soundFixed:false,whiteStage:0,timeFixed:false,repairSteps:[],attemptsByCause:{sound:{object:0,state:0},frost:{scene:0},yu:{connector:0},allWhite:{expression:0},time:{hour:0}},answers:{sound:['',''],frost:'',yu:['','',''],allWhite:'',time:''}};Object.defineProperties(s,{progress:{get:()=>progressOf(s)},finalScene:{get:()=>isFinal(s)}});return s};
const complete=(s,k)=>k==='sound'?s.answers.sound.every(Boolean):k==='yu'?s.answers.yu.every(Boolean):Boolean(s.answers[{frost:'frost',allWhite:'allWhite',time:'time'}[k]]);
export const errorCause=(s,key)=>{if(key==='sound')return s.answers.sound[0]!=='人鸟声'?'object':'state';if(key==='frost')return'scene';if(key==='yu')return'connector';if(key==='allWhite')return'expression';return'hour'};
export const verify=(s,key)=>{if(key==='yu'&&s.whiteStage<1)return'locked';if(key==='allWhite'&&s.whiteStage<2)return'locked';if(!complete(s,key))return'incomplete';let ok=false;if(key==='sound'){ok=s.answers.sound[0]==='人鸟声'&&s.answers.sound[1]==='俱绝';if(ok)s.soundFixed=true}if(key==='frost'){ok=s.answers.frost==='雾凇沆砀';if(ok)s.whiteStage=Math.max(1,s.whiteStage)}if(key==='yu'){ok=s.answers.yu.every(x=>x==='与');if(ok)s.whiteStage=Math.max(2,s.whiteStage)}if(key==='allWhite'){ok=s.answers.allWhite==='上下一白'&&s.whiteStage===2;if(ok)s.whiteStage=3}if(key==='time'){ok=s.answers.time==='更定';if(ok)s.timeFixed=true}if(!ok){const cause=errorCause(s,key);s.attemptsByCause[key][cause]++}return ok};
export const REPAIR_STEPS=['sound','white','time'];
export function recordRepair(s,key){const step=REPAIR_STEPS.includes(key)?key:key==='allWhite'&&s.whiteStage===3?'white':'';if(step&&!s.repairSteps.includes(step))s.repairSteps.push(step)}
export const canUndoRepair=s=>s.repairSteps.length>0||(s.whiteStage>0&&s.whiteStage<3);
const clearWhite=s=>{s.whiteStage=0;s.answers.frost='';s.answers.yu=['','',''];s.answers.allWhite=''};
export function undoRepair(s){
  if(s.whiteStage>0&&s.whiteStage<3){clearWhite(s);return'white'}
  const step=s.repairSteps.pop();if(!step)return'';
  if(step==='sound'){s.soundFixed=false;s.answers.sound=['','']}
  else if(step==='white')clearWhite(s);
  else{s.timeFixed=false;s.answers.time=''}
  return step;
}
export const hint=(s,key)=>{const cause=errorCause(s,key),n=s.attemptsByCause[key][cause];if(key==='sound')return cause==='object'?(n>1?'原文先写“人鸟声”，再写“俱绝”：听见的是声音的断绝。':'张岱写的是人鸟消失，还是人鸟的声音消失？'):(n>1?'“俱绝”写人声、鸟声一同断绝，雪湖才归于寂静。':'“无”与“绝”，哪一个更能表现声音断绝后的寂静？');if(key==='frost')return n>1?'雾凇是冰花凝结，沆砀是白气弥漫。':'留意这里写的是冰花和弥漫白气，还是正在飘落的雪？';if(key==='yu')return n>1?'三个“与”把天、云、山、水连缀成境，读来有绵延不断的节奏。':'顿号的停顿，与“与”字的连缀，读起来感觉一样吗？';if(key==='allWhite')return n>1?'“一白”凝练地写天地整体浑然一色。':'“上下一白”和“上下一片白”，哪一句更凝练地写出天地整体？';return n>1?'“更定”通常指初更时分，约晚上八时左右。':'文中写的时辰，是傍晚、深夜，还是更深的夜里？'};
