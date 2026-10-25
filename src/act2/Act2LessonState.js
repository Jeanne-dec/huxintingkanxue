export const RATING_KEYS=['baimiao','textEvidence','sceneMeaning'];
export const RATING_NAMES={baimiao:'识白描',textEvidence:'据文落笔',sceneMeaning:'由景会意'};
export const RATING_LEVELS=['初识','渐明','会意','活用'];
export const QUESTIONS={
  causeway:'你让长堤的哪些细节退去了？为什么留下“一痕”，反而更能写出雪中的长堤？',
  pavilion:'你把整座湖心亭凝练到什么程度？要用哪几笔，才能既是“一点”，又仍让人看出亭意？',
  boat:'当余舟渐渐成了“一芥”，湖面在你眼中变得怎样？为什么这个“芥”比“艘”更有意味？',
  people:'人物仍在舟中，张岱为什么不写“两三个人”，却写“两三粒”？这样的取舍改变了你看人与天地的眼光吗？'
};
export const RATING_DESCRIPTIONS={
  baimiao:['我能找出“一痕”等特别的用词','我能说出这些词比一般数量词更简练','我能结合具体词语解释抓特征、少铺饰的效果','我能比较另一种表述，说明张岱写法更有表现力'],
  textEvidence:['我能对照一句原文尝试调整画面','我能指出一处调整与原文的联系','我能说明删去与留下，并以原文解释','我能比较不同画法，提出有根据的取舍建议'],
  sceneMeaning:['我能描述雪湖景物','我能发现天地辽阔与舟人渺小的对比','我能结合画面和词语解释大小、虚实关系','我能提出进一步理解或疑问，并找到文本依据']
};
export const LESSON_STEPS=['returnText','questions','epitaph','baimiao','rating','scroll','du','chi','closure'];
export const createLesson=()=>({step:'returnText',selectedQuestion:null,questionDrafts:{causeway:'',pavilion:'',boat:'',people:''},epitaph:'',selfRatings:{baimiao:null,textEvidence:null,sceneMeaning:null},ratingFocus:'baimiao',inquiry:{du:'',chi:''},inquiryHints:{du:false,chi:false}});
export const chooseQuestion=(lesson,key)=>({...lesson,selectedQuestion:key,step:'epitaph'});
export const updateDraft=(lesson,text)=>lesson.selectedQuestion?{...lesson,questionDrafts:{...lesson.questionDrafts,[lesson.selectedQuestion]:text}}:lesson;
export const saveEpitaph=lesson=>lesson.selectedQuestion?{...lesson,epitaph:lesson.questionDrafts[lesson.selectedQuestion],step:'baimiao',ratingFocus:ratingProgress(lesson).current||RATING_KEYS.at(-1)}:lesson;
export function ratingProgress(lesson){const completed=RATING_KEYS.filter(key=>lesson.selfRatings[key]).length;return {current:RATING_KEYS.find(key=>!lesson.selfRatings[key])||null,completed};}
export function openRating(lesson){const {current}=ratingProgress(lesson);return {...lesson,step:'rating',ratingFocus:current||lesson.ratingFocus||RATING_KEYS.at(-1)};}
export function openBaimiao(lesson){return {...lesson,step:'baimiao'};}
export function chooseRating(lesson,key,value){return {...lesson,selfRatings:{...lesson.selfRatings,[key]:value},ratingFocus:key,step:'rating'};}
export const canEnterScroll=lesson=>ratingProgress(lesson).completed===RATING_KEYS.length;
/* 评价页的“继续”：逐页走过识白描 → 据文落笔 → 由景会意，三枚印齐了才进个人画卷。 */
export function ratingNext(lesson){
  const focus=lesson.ratingFocus||RATING_KEYS[0],index=RATING_KEYS.indexOf(focus);
  if(!lesson.selfRatings[focus])return {message:'请先完成当前维度的选择。'};
  if(index<RATING_KEYS.length-1)return {lesson:{...lesson,step:'rating',ratingFocus:RATING_KEYS[index+1]}};
  if(canEnterScroll(lesson))return {lesson:{...lesson,step:'scroll'}};
  return {message:'请先完成三个维度的自评。'};
}
export const scrollSceneValues=values=>({causeway:values.causeway,pavilion:values.pavilion,boat:values.boat,people:values.people});
export function studentScrollLayout(epitaph){
  const lines=(epitaph||'题跋待补').split(/\r\n|\r|\n/).flatMap(paragraph=>{
    const characters=Array.from(paragraph),wrapped=[];
    for(let i=0;i<characters.length;i+=42)wrapped.push(characters.slice(i,i+42).join(''));
    return wrapped.length?wrapped:[''];
  });
  const lineCount=lines.length,textY=1014,textBottom=textY+(lineCount-1)*34,stampY=textBottom+78;
  return {lines,lineCount,textY,textBottom,stampY,height:stampY+74};
}

export function lessonGuard(lesson){
  if(lesson.step==='questions'&&!lesson.selectedQuestion)return '请先从四道追问中选择一道。';
  if(lesson.step==='epitaph'&&!lesson.selectedQuestion)return '请先选择一道追问。';
  if(lesson.step==='epitaph'&&!lesson.questionDrafts[lesson.selectedQuestion]?.trim())return '请先写下你的原话，再保存题跋。';
  if(lesson.step==='rating'&&!canEnterScroll(lesson))return '请先完成当前维度的选择。';
  return '';
}
export function advanceLesson(lesson){
  if(lessonGuard(lesson))return lesson;
  if(lesson.step==='epitaph')return saveEpitaph(lesson);
  const index=LESSON_STEPS.indexOf(lesson.step);
  return {...lesson,step:LESSON_STEPS[Math.min(LESSON_STEPS.length-1,Math.max(0,index+1))]};
}
export function previousLesson(lesson){
  if(lesson.step==='scroll')return openRating(lesson);
  if(lesson.step==='rating'){
    const index=RATING_KEYS.indexOf(lesson.ratingFocus);
    if(index>0)return {...lesson,ratingFocus:RATING_KEYS[index-1]};
  }
  return {...lesson,step:LESSON_STEPS[Math.max(0,LESSON_STEPS.indexOf(lesson.step)-1)]};
}
export const updateInquiry=(lesson,key,text)=>['du','chi'].includes(key)?{...lesson,inquiry:{...lesson.inquiry,[key]:text}}:lesson;
export const toggleInquiryHint=(lesson,key)=>['du','chi'].includes(key)?{...lesson,inquiryHints:{...lesson.inquiryHints,[key]:!lesson.inquiryHints[key]}}:lesson;
