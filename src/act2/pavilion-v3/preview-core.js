import {ASSET_ANCHORS,SCENE_SIZE} from '../renderer.js';
import {clamp} from '../state.js';

export const APPROVED_PAVILION_ASSETS=Object.freeze({
  storyboard:Object.freeze({
    file:'01_认可版_远望推进转角入亭_四帧.png',
    width:1672,
    height:941,
    sha256:'88d127b34df61cb229b98f8c2e2038fd8dd8f56ec550f2f10cca687ccc2c3cb1'
  }),
  interior:Object.freeze({
    file:'02_认可版_入亭后_两坐一立终点.png',
    width:1448,
    height:1086,
    sha256:'83337e2b369848cabac9e3eacf6b56b0d93f22cd8ea5a79ea861ff6db37b13a0'
  })
});

const pavilion=ASSET_ANCHORS.pavilion;
export const PAVILION_HOTSPOT=Object.freeze({
  left:pavilion.x/SCENE_SIZE.width*100,
  top:pavilion.y/SCENE_SIZE.height*100,
  width:pavilion.w/SCENE_SIZE.width*100,
  height:pavilion.h/SCENE_SIZE.height*100
});

export const PAVILION_SEQUENCE=Object.freeze([
  Object.freeze({id:'student',title:'从你的画卷出发',copy:'点击真实湖心亭。此刻只能从远处辨认照看酒炉的站立童子。',viewAngle:'lake-front',seatedGuests:'occluded',duration:0,transition:'none'}),
  Object.freeze({id:'approach',title:'沿湖面推进',copy:'镜头保持原有湖面视线，亭子的屋檐、朝向与位置仍可辨认。',viewAngle:'lake-front',seatedGuests:'occluded',duration:1500,transition:'student-canvas-zoom'}),
  Object.freeze({id:'closer',title:'渐近亭前',copy:'接近长平台之前，仍是正面远望角度；两位坐客尚被尺度与亭柱遮挡。',viewAngle:'lake-front',seatedGuests:'occluded',duration:1350,transition:'approved-storyboard-crop',storyboardPanel:1}),
  Object.freeze({id:'turn',title:'沿平台轻转',copy:'镜头在接近后转向长平台一侧，亭内空间随观察角度改变而显露。',viewAngle:'platform-side',seatedGuests:'revealed-by-angle',duration:1550,transition:'approved-storyboard-crop',storyboardPanel:2}),
  Object.freeze({id:'interior',title:'一点入亭',copy:'两位客人铺毡对坐，童子始终站在炉旁。人物没有生成或瞬移。',viewAngle:'platform-side',seatedGuests:'visible',duration:900,transition:'approved-interior-crossfade'})
]);

export function getPlaybackStages(reducedMotion=false){
  if(!reducedMotion)return PAVILION_SEQUENCE;
  return [PAVILION_SEQUENCE[0],Object.freeze({...PAVILION_SEQUENCE.at(-1),duration:0,transition:'static-cut'})];
}

export function normalizeStudentValues(values={}){
  return {causeway:clamp(values.causeway),pavilion:clamp(values.pavilion),boat:clamp(values.boat),people:clamp(values.people)};
}
