export const PHASE2_STEPS=Object.freeze(['pavilion','portrait','judgment','challenge','bridge','response','rating','scroll','homework','thanks']);

const PHASE2_PATHS=Object.freeze({
  pavilion:'act2/pavilion-v8-eight/preview.html',
  portrait:'act2/phase2-debate-preview/portrait.html',
  judgment:'act2/phase2-debate-preview/judgment.html',
  challenge:'act2/phase2-debate-preview/challenge.html',
  bridge:'act2/phase2-bridge/bridge.html',
  response:'act2/phase2-finale-preview/response.html',
  rating:'act2/phase2-finale-preview/rating.html',
  scroll:'act2/phase2-finale-preview/scroll.html',
  homework:'act2/phase2-finale-preview/homework.html',
  thanks:'act2/phase2-finale-preview/thanks.html'
});

export function phase2Url(step){
  const path=PHASE2_PATHS[step];
  if(!path)throw new Error(`未知的第二教学环节步骤：${step}`);
  const url=new URL(path,import.meta.url);
  url.searchParams.set('flow','phase2');
  return url.href;
}

export function goPhase2(step){
  location.assign(phase2Url(step));
}
