const asset=name=>new URL(`./assets/v24/${name}`,import.meta.url).href;
const image=(name,klass,alt)=>`<img class="${klass}" src="${asset(name)}" alt="${alt}">`;
function workingLayers({timeFixed=false,whiteStage=0,animate='' }={}){
 const base=timeFixed?'NIGHT_base_sun_removed.png':'DAY_before_approved.png';
 const reveal=name=>animate===name?' is-revealing':'';
 return `${image(base,`scene-layer scene-base${reveal('time')}`,timeFixed?'去日轮的冷灰蓝雪夜':'待修复的日间雪湖')}${timeFixed?image('MOON_only_one.png',`scene-layer scene-moon${reveal('time')}`,'一轮弯月'):''}${whiteStage>=1?image('WHITE_STAGE_1_frost_vapor.png',`scene-layer scene-white scene-white-1${reveal('white1')}`,'冰花与白气'):''}${whiteStage>=2?image('WHITE_STAGE_2_join_sky_cloud_mountain_water.png',`scene-layer scene-white scene-white-2${reveal('white2')}`,'天云山水边界连缀'):''}${whiteStage>=3?image('WHITE_STAGE_3_all_white.png',`scene-layer scene-white scene-white-3${reveal('white3')}`,'天地一白'):''}`;
}
export function snowScene({timeFixed=false,whiteStage=0,finalScene=false,animate='',transitionFrom=null}={}){
 if(finalScene){const previous=transitionFrom||{timeFixed,whiteStage};return `<div class="snow-scene snow-scene-final" aria-label="雪夜复原画卷">${workingLayers({...previous,animate:''})}${image('FINAL_after_approved_DO_NOT_REPLACE.png','scene-layer scene-master scene-master-crossfade','已认可的雪夜复原母版')}</div>`}
 return `<div class="snow-scene ${timeFixed?'is-night':'is-day'} white-${whiteStage}" aria-label="可修复的雪湖画卷">${workingLayers({timeFixed,whiteStage,animate})}</div>`;
}
