export const W=1672,H=941,ROOT='./assets/boat-people/';
export const FRAME_LEVELS=[0,50,100];
export const PEOPLE=['left','middle','right'];
export const ASSET_PATHS={
 clean:'boat_people_clean_plate.png',boatBack:'boat_back.png',boatFront:'boat_front.png',
 boatMask:'masks/boat_static_protection.png',
 leftMask:'masks/person_left_mask.png',middleMask:'masks/person_middle_mask.png',rightMask:'masks/person_right_mask.png'
};
export const personFrame=(person,value)=>`person_${person}_${FRAME_LEVELS.reduce((best,n)=>Math.abs(n-value)<Math.abs(best-value)?n:best,0)}.png`;
export const requiredPaths=()=>[ASSET_PATHS.clean,ASSET_PATHS.boatBack,ASSET_PATHS.boatFront,...PEOPLE.flatMap(p=>FRAME_LEVELS.map(v=>personFrame(p,v))),ASSET_PATHS.boatMask,ASSET_PATHS.leftMask,ASSET_PATHS.middleMask,ASSET_PATHS.rightMask];
export const selectedFrames=values=>PEOPLE.map(person=>personFrame(person,values[person]));
export const renderOrder=values=>[ASSET_PATHS.clean,ASSET_PATHS.boatBack,...selectedFrames(values),ASSET_PATHS.boatFront];
export const assetUrl=path=>ROOT+path;
