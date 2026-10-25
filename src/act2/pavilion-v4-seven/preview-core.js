import {ASSET_ANCHORS,SCENE_SIZE} from '../renderer.js';
import {clamp} from '../state.js';

export const APPROVED_SEVEN_ASSETS=Object.freeze({
  board:Object.freeze({
    file:'reference/01_APPROVED_7SHOT_BOARD.png',
    width:992,
    height:1586,
    bytes:2317128,
    sha256:'5c98838dde52d5f9388dea97dae6bf01f33f9a81892666ea1e8cfa19c277cfc3',
    runtime:false
  }),
  final:Object.freeze({
    file:'../pavilion-v3/assets/02_认可版_入亭后_两坐一立终点.png',
    width:1448,
    height:1086,
    bytes:3396233,
    sha256:'83337e2b369848cabac9e3eacf6b56b0d93f22cd8ea5a79ea861ff6db37b13a0',
    runtime:true
  }),
  masterReference:Object.freeze({
    file:'03_MASTER_REFERENCE_ONLY.png',
    width:1672,
    height:941,
    bytes:2387060,
    sha256:'e863d9f012338a993f7e70e5bef91ebaa933a5a84234da3f411194fc1416f1f8',
    runtime:false
  })
});

const pavilion=ASSET_ANCHORS.pavilion;
export const PAVILION_HOTSPOT=Object.freeze({
  left:pavilion.x/SCENE_SIZE.width*100,
  top:pavilion.y/SCENE_SIZE.height*100,
  width:pavilion.w/SCENE_SIZE.width*100,
  height:pavilion.h/SCENE_SIZE.height*100
});

const shot=(config)=>Object.freeze({...config,camera:Object.freeze(config.camera)});
export const SEVEN_SHOT_SEQUENCE=Object.freeze([
  shot({id:'shot-01',number:1,title:'雪湖远望',shortTitle:'远望',copy:'从学生自己的四笔雪湖出发。远亭中只能辨认照看酒炉的站立童子。',source:'student-canvas',assetKey:null,viewAngle:'lake-front',seatedGuests:'occluded',transition:'none',duration:0,camera:{scale:1,translateX:0,translateY:0}}),
  shot({id:'shot-02',number:2,title:'镜头向亭推进',shortTitle:'推进',copy:'沿同一湖面方向平缓靠近，亭子的屋檐、栏杆和原始位置保持对应。',source:'student-canvas',assetKey:null,viewAngle:'lake-front',seatedGuests:'occluded',transition:'student-canvas-forward',duration:1400,camera:{scale:1.58,translateX:-5,translateY:1}}),
  shot({id:'shot-03',number:3,title:'来到亭前',shortTitle:'亭前',copy:'继续使用同一画卷，完整保留亭顶、部分湖面与长平台，为转角建立空间依据。',source:'student-canvas',assetKey:null,viewAngle:'lake-front',seatedGuests:'occluded',transition:'student-canvas-forward',duration:1500,camera:{scale:2.35,translateX:-10.5,translateY:1.5}}),
  shot({id:'shot-04',number:4,title:'沿平台换角',shortTitle:'换角',copy:'全程仅在此处改变观察方向。平台侧画面借亭柱、栏杆与短暂雪雾显露，两位坐客随角度进入视野。',source:'approved-final',assetKey:'final',viewAngle:'changing-to-platform-side',seatedGuests:'revealed-by-angle',transition:'platform-turn-occlusion',duration:1750,camera:{scale:1,translateX:0,translateY:0}}),
  shot({id:'shot-05',number:5,title:'继续靠近·定格视角',shortTitle:'定格',copy:'平台侧方向已经稳定，二坐一立关系明确。从这里起摄影机方向锁定。',source:'approved-final',assetKey:'final',viewAngle:'platform-side-locked',seatedGuests:'visible',transition:'locked-camera-forward',duration:1100,camera:{scale:1.06,translateX:0,translateY:0}}),
  shot({id:'shot-06',number:6,title:'视角不变·继续前推',shortTitle:'前推',copy:'同一张认可亭景沿锁定方向继续前进，人物、亭柱、栏杆与酒炉的相对位置不变。',source:'approved-final',assetKey:'final',viewAngle:'platform-side-locked',seatedGuests:'visible',transition:'locked-camera-forward',duration:1550,camera:{scale:1.5,translateX:0,translateY:0}}),
  shot({id:'shot-07',number:7,title:'入亭终点',shortTitle:'入亭',copy:'沿同一视角轻推后停住：童子照看酒炉，两位客人铺毡对坐，亭外雪湖仍清寒。',source:'approved-final',assetKey:'final',viewAngle:'platform-side-locked',seatedGuests:'visible',transition:'locked-camera-forward',duration:1550,camera:{scale:2,translateX:0,translateY:0}})
]);

export function getPlaybackShots(reducedMotion=false){
  if(!reducedMotion)return SEVEN_SHOT_SEQUENCE;
  return [SEVEN_SHOT_SEQUENCE[0],Object.freeze({...SEVEN_SHOT_SEQUENCE.at(-1),duration:0,transition:'static-cut'})];
}

export function normalizeStudentValues(values={}){
  return {causeway:Math.round(clamp(values.causeway)),pavilion:Math.round(clamp(values.pavilion)),boat:Math.round(clamp(values.boat)),people:Math.round(clamp(values.people))};
}
