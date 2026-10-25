export const OBJECTS={causeway:{label:'长堤一痕',range:'具象 — 省形 — 留意'},pavilion:{label:'湖心亭一点',range:'具象 — 省形 — 留意'},boat:{label:'与余舟一芥',range:'具象 — 省形 — 留意'},people:{label:'舟中人两三粒',range:'具象 — 省形 — 留意'}};
export const createAct2State=()=>({selected:'causeway',values:{causeway:0,pavilion:0,boat:0,people:0},compareOriginal:false,fineTuneExpanded:false});
export const clamp=v=>Math.max(0,Math.min(100,Number(v)||0));
export const setValue=(s,key,value)=>({...s,values:{...s.values,[key]:clamp(value)}});
export const selectObject=(s,key)=>OBJECTS[key]?{...s,selected:key}:s;
export const resetCurrent=s=>setValue(s,s.selected,0);
export const resetAll=s=>({...s,values:{causeway:0,pavilion:0,boat:0,people:0},compareOriginal:false});
export const toggleCompare=s=>({...s,compareOriginal:!s.compareOriginal});
