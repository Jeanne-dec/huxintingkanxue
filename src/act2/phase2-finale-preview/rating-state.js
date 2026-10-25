export const RATING2_STORAGE_KEY='huxinting-snow-phase2-rating-v1';
export const RATING2_SCHEMA_VERSION=1;
export const RATING2_KEYS=['understandChi','textArgument','reflectThroughDebate'];
export const RATING2_NAMES={understandChi:'识其痴',textArgument:'据文立论',reflectThroughDebate:'由辩会心'};
export const RATING_LEVELS=['初识','渐明','会意','活用'];
export const RATING2_CRITERIA={
  understandChi:{
    name:'识其痴',
    intro:'评价学生对张岱行为与精神追求的理解。',
    levels:{
      初识:'能找出舟子评价张岱为“痴”的原文，并指出张岱雪夜看雪的行为，但尚未说明这一行为与“痴”的联系。',
      渐明:'能结合至少一处原文中的行为或情节，解释张岱为何被称为“痴”。',
      会意:'能结合不同的文本细节，说明张岱的“痴”既表现为不同寻常的举动，也可能包含对山水的独特情趣。',
      活用:'能联系《醉翁亭记》或庄子相关思想，对张岱的“痴”作有文本依据的比较和解释。'
    }
  },
  textArgument:{
    name:'据文立论',
    intro:'评价学生能否依据文本提出、解释并支持自己的观点。',
    levels:{
      初识:'能明确表达自己对AI解读的立场，但尚未引用具体原文说明理由。',
      渐明:'能引用至少一处原文，说明其与自身观点的联系。',
      会意:'能结合多处关键原文，清楚解释证据如何支持自己的判断。',
      活用:'能比较不同观点的文本依据，并针对他人的质疑作出有理有据的回应。'
    }
  },
  reflectThroughDebate:{
    name:'由辩会心',
    intro:'评价学生听取异见、反思原有认识及联系生活的表现。',
    levels:{
      初识:'能记录一种与自己不同的观点，但尚未针对这一观点提出问题或作出回应。',
      渐明:'能准确复述不同观点，并提出一个与课文相关的问题。',
      会意:'能依据原文回应不同意见，说明自己为何保留、补充或修订原有判断。',
      活用:'能比较不同观点及其依据，并联系自身经历，说明自己对张岱之“痴”的进一步认识。'
    }
  }
};
const level=value=>RATING_LEVELS.includes(value)?value:null;
export function createRating2State(){
  return {schemaVersion:RATING2_SCHEMA_VERSION,selfRatings:{understandChi:null,textArgument:null,reflectThroughDebate:null},updatedAt:''};
}
export function restoreRating2State(raw={}){
  if(raw?.schemaVersion!==RATING2_SCHEMA_VERSION)return createRating2State();
  const ratings=createRating2State().selfRatings;
  for(const key of RATING2_KEYS)ratings[key]=level(raw.selfRatings?.[key]);
  return {schemaVersion:RATING2_SCHEMA_VERSION,selfRatings:ratings,updatedAt:typeof raw.updatedAt==='string'?raw.updatedAt:''};
}
export function readRating2State(storage){
  try{storage??=globalThis.localStorage;const raw=storage.getItem(RATING2_STORAGE_KEY);return raw?restoreRating2State(JSON.parse(raw)):createRating2State();}catch{return createRating2State();}
}
export function saveRating2State(state,storage){
  try{storage??=globalThis.localStorage;storage.setItem(RATING2_STORAGE_KEY,JSON.stringify(restoreRating2State(state)));return true;}catch{return false;}
}
export function setRating2(state,key,value,updatedAt=new Date().toISOString()){
  if(!RATING2_KEYS.includes(key)||!RATING_LEVELS.includes(value))return restoreRating2State(state);
  const current=restoreRating2State(state);
  return {...current,selfRatings:{...current.selfRatings,[key]:value},updatedAt};
}
export const missingRating2Keys=state=>RATING2_KEYS.filter(key=>!restoreRating2State(state).selfRatings[key]);
