export const DEBATE_STORAGE_KEY='huxinting-snow-phase2-debate-preview-v1';
export const DEBATE_SCHEMA_VERSION=1;
export const AI_DRAFT_PARAGRAPHS=Object.freeze([
  '张岱于大雪三日、更定时分，独往湖心亭看雪。舟子称其‘痴’，可见其举动确实不同寻常。',
  '他不顾天寒夜深，执意前往，说明他对赏雪颇为执着。',
  '不过，这种‘痴’似乎更多表现为一种脱离常情的古怪举动，未必具有更深的意味。'
]);
export const STANCE_OPTIONS=Object.freeze(['赞同','部分赞同','不赞同']);
export const PAGE_SEQUENCE=Object.freeze(['portrait','judgment','challenge']);

const text=value=>typeof value==='string'?value:'';
const stance=value=>STANCE_OPTIONS.includes(value)?value:'';
const timestamp=value=>typeof value==='string'?value:'';

export function createDebateState(){
  return {
    schemaVersion:DEBATE_SCHEMA_VERSION,
    draft:{stance:'',originalReason:''},
    stance:'',originalReason:'',heardOtherView:'',questionToPeer:'',
    savedExchange:{heardOtherView:'',questionToPeer:''},
    savedJudgmentAt:'',savedExchangeAt:''
  };
}

export function restoreDebateState(raw={}){
  if(raw?.schemaVersion!==DEBATE_SCHEMA_VERSION)return createDebateState();
  const heardOtherView=text(raw.heardOtherView);
  const questionToPeer=text(raw.questionToPeer);
  const savedExchangeAt=timestamp(raw.savedExchangeAt);
  const savedExchange=raw.savedExchange&&typeof raw.savedExchange==='object'
    ?{heardOtherView:text(raw.savedExchange.heardOtherView),questionToPeer:text(raw.savedExchange.questionToPeer)}
    :savedExchangeAt?{heardOtherView,questionToPeer}:{heardOtherView:'',questionToPeer:''};
  return {
    schemaVersion:DEBATE_SCHEMA_VERSION,
    draft:{stance:stance(raw.draft?.stance),originalReason:text(raw.draft?.originalReason)},
    stance:stance(raw.stance),
    originalReason:text(raw.originalReason),
    heardOtherView,
    questionToPeer,
    savedExchange,
    savedJudgmentAt:timestamp(raw.savedJudgmentAt),
    savedExchangeAt
  };
}

export function readDebateState(storage){
  try{
    storage??=globalThis.localStorage;
    const saved=storage.getItem(DEBATE_STORAGE_KEY);
    return saved?restoreDebateState(JSON.parse(saved)):createDebateState();
  }catch{return createDebateState();}
}

export function saveDebateState(state,storage){
  try{
    storage??=globalThis.localStorage;
    storage.setItem(DEBATE_STORAGE_KEY,JSON.stringify(restoreDebateState(state)));
    return true;
  }catch{return false;}
}

export function updateJudgmentDraft(state,patch={}){
  const current=restoreDebateState(state);
  return {...current,draft:{
    stance:Object.hasOwn(patch,'stance')?stance(patch.stance):current.draft.stance,
    originalReason:Object.hasOwn(patch,'originalReason')?text(patch.originalReason):current.draft.originalReason
  }};
}

export function saveJudgment(state,savedAt=new Date().toISOString()){
  const current=restoreDebateState(state);
  if(!current.draft.stance)return {state:current,error:'请先选择你的立场，再保存初判。'};
  if(!current.draft.originalReason.trim())return {state:current,error:'请写下判断、理由及文本依据，再保存初判。'};
  return {state:{...current,stance:current.draft.stance,originalReason:current.draft.originalReason,savedJudgmentAt:savedAt},error:''};
}

export function updateExchange(state,patch={}){
  const current=restoreDebateState(state);
  return {
    ...current,
    heardOtherView:Object.hasOwn(patch,'heardOtherView')?text(patch.heardOtherView):current.heardOtherView,
    questionToPeer:Object.hasOwn(patch,'questionToPeer')?text(patch.questionToPeer):current.questionToPeer
  };
}

export function saveExchange(state,savedAt=new Date().toISOString()){
  const current=restoreDebateState(state);
  return {state:{...current,savedExchange:{heardOtherView:current.heardOtherView,questionToPeer:current.questionToPeer},savedExchangeAt:savedAt},error:''};
}
