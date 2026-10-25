export const W=1672,H=941;
export const DRAFT_ROOT='./assets/';
export const draftPaths=()=>['clean_lake_no_boat_DRAFT.png','boat_back_DRAFT.png','boat_front_DRAFT.png','people_group_0_DRAFT.png','people_group_50_DRAFT.png','people_group_100_DRAFT.png'];
export function composePlan({boat=0,people=0}){const stage=people<=25?0:people<=75?50:100;return {people:`people_group_${stage}_DRAFT.png`,order:['clean_lake_no_boat_DRAFT.png','boat_back_DRAFT.png',`people_group_${stage}_DRAFT.png`,'boat_front_DRAFT.png'],transform:{pivot:[1407,660],scale:1-boat/200}};}
