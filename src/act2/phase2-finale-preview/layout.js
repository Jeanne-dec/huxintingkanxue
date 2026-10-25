const CLOSING=/[。！？，；：、”’）】》]/u;
const OPENING=/[“‘（【《]/u;
const normalizedText=value=>String(value??'').replace(/\r\n?/g,'\n');

export function splitVerticalColumns(value,{rows=28}={}){
  const maxRows=Math.max(2,Math.floor(Number(rows)||28));
  const columns=[[]];
  let current=columns[0];
  const nextColumn=()=>{current=[];columns.push(current);};
  for(const char of Array.from(normalizedText(value))){
    if(char==='\n'){nextColumn();continue;}
    if(current.length>=maxRows||(OPENING.test(char)&&current.length===maxRows-1))nextColumn();
    if(CLOSING.test(char)&&current.length===0&&columns.length>1){
      const previous=columns.at(-2);
      if(previous.length>1)current.push(previous.pop());
    }
    current.push(char);
  }
  return columns;
}

export function exportLayout(value,{baseWidth=1920,height=1080,sceneWidth=1448,panelMinWidth=360,rows=25,columnAdvance=34}={}){
  const columns=splitVerticalColumns(value,{rows});
  const panelWidth=Math.max(panelMinWidth,164+columns.length*columnAdvance);
  const width=Math.max(baseWidth,55+sceneWidth+28+panelWidth+29);
  return {width,height,scene:{x:55,y:176,width:sceneWidth,height:815},panel:{x:55+sceneWidth+28,y:176,width:panelWidth,height:815},columns,rows,columnAdvance};
}
