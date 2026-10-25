export const FINAL_STORAGE_KEY='huxinting-snow-phase2-finale-preview-v1';
export const FINAL_SCHEMA_VERSION=1;
export const STANCE_OPTIONS=Object.freeze(['保留','补充','修订']);
const ACT2_VALUE_KEYS=Object.freeze(['causeway','pavilion','boat','people']);

const text=value=>typeof value==='string'?value:'';
const stance=value=>STANCE_OPTIONS.includes(value)?value:'';
const timestamp=value=>typeof value==='string'?value:'';

export function hasSavedAct2Values(raw){
  const values=raw?.act2State?.values;
  return ACT2_VALUE_KEYS.every(key=>Object.hasOwn(values??{},key)&&Number.isFinite(Number(values[key])));
}

export function createFinaleState(){
  return {
    schemaVersion:FINAL_SCHEMA_VERSION,
    draft:{stance:'',response:''},
    saved:{stance:'',response:'',savedAt:''},
    updatedAt:''
  };
}

export function restoreFinaleState(raw={}){
  if(raw?.schemaVersion!==FINAL_SCHEMA_VERSION)return createFinaleState();
  return {
    schemaVersion:FINAL_SCHEMA_VERSION,
    draft:{stance:stance(raw.draft?.stance),response:text(raw.draft?.response)},
    saved:{stance:stance(raw.saved?.stance),response:text(raw.saved?.response),savedAt:timestamp(raw.saved?.savedAt)},
    updatedAt:timestamp(raw.updatedAt)
  };
}

export function readFinaleState(storage){
  try{
    storage??=globalThis.localStorage;
    const raw=storage.getItem(FINAL_STORAGE_KEY);
    return raw?restoreFinaleState(JSON.parse(raw)):createFinaleState();
  }catch{return createFinaleState();}
}

export function saveFinaleState(state,storage){
  try{
    storage??=globalThis.localStorage;
    storage.setItem(FINAL_STORAGE_KEY,JSON.stringify(restoreFinaleState(state)));
    return true;
  }catch{return false;}
}

export function updateFinaleDraft(state,patch={},updatedAt=new Date().toISOString()){
  const current=restoreFinaleState(state);
  return {
    ...current,
    draft:{
      stance:Object.hasOwn(patch,'stance')?stance(patch.stance):current.draft.stance,
      response:Object.hasOwn(patch,'response')?text(patch.response):current.draft.response
    },
    updatedAt:timestamp(updatedAt)
  };
}

export function commitFinaleResponse(state,savedAt=new Date().toISOString()){
  const current=restoreFinaleState(state);
  if(!current.draft.stance)return {state:current,error:'请先选择保留、补充或修订。'};
  if(!current.draft.response.trim())return {state:current,error:'请先写下此刻真实的理解，再收入画卷。'};
  return {
    state:{
      ...current,
      saved:{stance:current.draft.stance,response:current.draft.response,savedAt:timestamp(savedAt)},
      updatedAt:timestamp(savedAt)
    },
    error:''
  };
}
