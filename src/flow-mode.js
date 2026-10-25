export const FLOW_QUERY='flow';
export const FLOW_VALUE='phase2';

const PHASE2_LINK_TARGETS=new Set([
  'portrait.html',
  'judgment.html',
  'challenge.html',
  '../phase2-bridge/bridge.html',
  '../pavilion-v8-eight/preview.html',
  '../pavilion-v4-seven/preview.html',
  '../phase2-debate-preview/portrait.html',
  '../phase2-debate-preview/challenge.html',
  '../phase2-finale-preview/response.html',
  'response.html',
  'rating.html',
  'scroll.html',
  'homework.html',
  '../../../index.html'
]);

export function isFlowMode(){
  try{return new URLSearchParams(location.search).get(FLOW_QUERY)===FLOW_VALUE;}
  catch{return false;}
}

export function flowHref(href){
  if(!isFlowMode())return href;
  const url=new URL(href,location.href);
  url.searchParams.set(FLOW_QUERY,FLOW_VALUE);
  return url.href;
}

export function applyFlowMode(){
  if(!isFlowMode())return false;
  document.documentElement.classList.add('flow-mode');
  const base=new URL('.',location.href);
  for(const link of document.querySelectorAll('a[href]')){
    const raw=link.getAttribute('href');
    if(!raw||raw.startsWith('#')||raw.includes('://'))continue;
    const relative=raw.split('?')[0].split('#')[0];
    if(!PHASE2_LINK_TARGETS.has(relative))continue;
    const url=new URL(raw,base);
    if(url.origin!==location.origin)continue;
    const separator=raw.includes('?')?'&':'?';
    link.setAttribute('href',`${raw}${separator}${FLOW_QUERY}=${FLOW_VALUE}`);
  }
  return true;
}
