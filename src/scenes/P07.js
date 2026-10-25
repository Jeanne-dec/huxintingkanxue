import {panel,btn,choices,feedback} from '../components.js'; import {content} from '../content.js';
export default ()=>panel('辨时 · 文字钥匙',`<p class="question time-question">是日 <span class="blank">______</span> 矣。</p>${choices(content.time,'time')}<p class="note">根据文中的线索，辨出当时的时辰。</p>${feedback('')}`,`${btn('收起','home','secondary')}${btn('修复此景','placeholder','primary')}`,'time');


