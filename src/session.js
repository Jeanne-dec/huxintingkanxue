import {createState,REPAIR_STEPS} from './state.js';
import {createAct2State,clamp} from './act2/state.js';
import {createLesson,LESSON_STEPS,RATING_KEYS,RATING_LEVELS,QUESTIONS} from './act2/Act2LessonState.js';
export const SESSION_KEY='huxinting-snow-v41-session';
const text=value=>typeof value==='string'?value:'';
export function restoreSession(raw={}){
  const state=createState(),act2State=createAct2State(),lessonState=createLesson();
  const a=raw?.state||{},b=raw?.act2State||{},l=raw?.lessonState||{};
  state.soundFixed=a.soundFixed===true;state.timeFixed=a.timeFixed===true;
  state.whiteStage=Math.max(0,Math.min(3,Number(a.whiteStage)||0));
  state.repairSteps=Array.isArray(a.repairSteps)?[...new Set(a.repairSteps.filter(step=>REPAIR_STEPS.includes(step)))]:[[state.soundFixed,'sound'],[state.whiteStage===3,'white'],[state.timeFixed,'time']].filter(([done])=>done).map(([,step])=>step);
  if(a.answers){
    for(const key of ['frost','allWhite','time'])state.answers[key]=text(a.answers[key]);
    for(const [key,count] of [['sound',2],['yu',3]])state.answers[key]=Array.from({length:count},(_,i)=>text(a.answers[key]?.[i]));
  }
  for(const key of Object.keys(state.attemptsByCause))for(const cause of Object.keys(state.attemptsByCause[key]))state.attemptsByCause[key][cause]=Math.max(0,Number(a.attemptsByCause?.[key]?.[cause])||0);
  for(const key of Object.keys(act2State.values))act2State.values[key]=clamp(b.values?.[key]);
  if(Object.hasOwn(act2State.values,b.selected))act2State.selected=b.selected;
  act2State.compareOriginal=b.compareOriginal===true;
  if(LESSON_STEPS.includes(l.step))lessonState.step=l.step;
  if(Object.hasOwn(QUESTIONS,l.selectedQuestion))lessonState.selectedQuestion=l.selectedQuestion;
  for(const key of Object.keys(QUESTIONS))lessonState.questionDrafts[key]=text(l.questionDrafts?.[key]);
  lessonState.epitaph=text(l.epitaph);
  for(const key of RATING_KEYS)if(RATING_LEVELS.includes(l.selfRatings?.[key]))lessonState.selfRatings[key]=l.selfRatings[key];
  if(RATING_KEYS.includes(l.ratingFocus))lessonState.ratingFocus=l.ratingFocus;
  for(const key of ['du','chi']){lessonState.inquiry[key]=text(l.inquiry?.[key]);lessonState.inquiryHints[key]=l.inquiryHints?.[key]===true;}
  return {mode:['act1','act2','lesson','cover'].includes(raw?.mode)?raw.mode:'cover',page:Math.max(1,Math.min(8,Number(raw?.page)||1)),state,act2State,lessonState};
}
export function readSession(storage){try{storage??=globalThis.localStorage;const saved=storage.getItem(SESSION_KEY);return saved?restoreSession(JSON.parse(saved)):null;}catch{return null;}}
export function saveSession(snapshot,storage){try{storage??=globalThis.localStorage;storage.setItem(SESSION_KEY,JSON.stringify(snapshot));return true;}catch{return false;}}
